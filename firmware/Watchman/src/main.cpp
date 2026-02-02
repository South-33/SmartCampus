// =============================================================================
// WATCHMAN FIRMWARE v2.0.0
// Smart Classroom Presence Detection & Power Control
//
// Security Features:
// - FreeRTOS mutex for thread-safe shared state
// - HMAC-SHA256 for ESP-NOW message authentication
// - Proper input validation and bounds checking
// - NVS-based configuration storage
// =============================================================================

#include <Arduino.h>
#include <ld2410.h>
#include <esp_now.h>
#include <WiFi.h>
#include <Preferences.h>
#include <esp_task_wdt.h>
#include <freertos/semphr.h>

#include "config.h"
#include "ESPNowProtocol.h"

// =============================================================================
// GLOBAL OBJECTS
// =============================================================================
ld2410 radar;
HardwareSerial RadarSerial(2);
Preferences prefs;

// Thread synchronization
SemaphoreHandle_t stateMutex = NULL;

// State Machine
enum RoomState { OCCUPIED, GRACE, STANDBY };

// =============================================================================
// SHARED STATE (Protected by mutex)
// =============================================================================
struct SharedState {
    volatile RoomState currentState = STANDBY;
    volatile bool isPaired = false;
    volatile bool powerOn = false;
    uint8_t gatekeeperMac[6] = {0};
    char roomId[16] = {0};
    uint32_t seqNum = 0;
    volatile unsigned long lastMovementTime = 0;
    volatile unsigned long lastHeartbeatTime = 0;
} sharedState;

// Sequence number manager
SeqNumManager seqNumManager;

// Local state
unsigned long lastBeaconTime = 0;

// Dynamic configuration (stored in NVS, loaded on boot)
String espNowSharedSecret = DEFAULT_ESP_NOW_SECRET;

// =============================================================================
// THREAD-SAFE STATE ACCESS
// =============================================================================
bool getIsPaired() {
    bool result = false;
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        result = sharedState.isPaired;
        xSemaphoreGive(stateMutex);
    }
    return result;
}

void setIsPaired(bool value) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        sharedState.isPaired = value;
        xSemaphoreGive(stateMutex);
    }
}

void getGatekeeperMac(uint8_t* mac) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        memcpy(mac, sharedState.gatekeeperMac, 6);
        xSemaphoreGive(stateMutex);
    }
}

void setGatekeeperMac(const uint8_t* mac) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        memcpy(sharedState.gatekeeperMac, mac, 6);
        xSemaphoreGive(stateMutex);
    }
}

void getRoomId(char* buffer, size_t bufSize) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        strncpy(buffer, sharedState.roomId, bufSize - 1);
        buffer[bufSize - 1] = '\0';
        xSemaphoreGive(stateMutex);
    }
}

void setRoomId(const char* room) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        strncpy(sharedState.roomId, room, sizeof(sharedState.roomId) - 1);
        sharedState.roomId[sizeof(sharedState.roomId) - 1] = '\0';
        xSemaphoreGive(stateMutex);
    }
}

uint32_t getNextSeqNum() {
    uint32_t result = 0;
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        result = ++sharedState.seqNum;
        xSemaphoreGive(stateMutex);
    }
    return result;
}

void updateMovementTime() {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        sharedState.lastMovementTime = millis();
        xSemaphoreGive(stateMutex);
    }
}

void updateHeartbeatTime() {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        sharedState.lastHeartbeatTime = millis();
        xSemaphoreGive(stateMutex);
    }
}

// =============================================================================
// POWER CONTROL
// =============================================================================
void setRoomPower(bool on) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        if (sharedState.powerOn != on) {
            sharedState.powerOn = on;
            digitalWrite(RELAY_PIN, on ? HIGH : LOW);
            DEBUG_PRINTF("[POWER] Room power: %s\n", on ? "ON" : "OFF");
        }
        xSemaphoreGive(stateMutex);
    }
}

bool isPowerOn() {
    bool result = false;
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        result = sharedState.powerOn;
        xSemaphoreGive(stateMutex);
    }
    return result;
}

// =============================================================================
// ESP-NOW CALLBACKS
// =============================================================================
void OnDataRecv(const uint8_t* mac, const uint8_t* incomingData, int len) {
    if (len != sizeof(ESPNowMessage)) return;
    
    ESPNowMessage msg;
    memcpy(&msg, incomingData, sizeof(msg));
    
    // Verify protocol version
    if (msg.version != ESPNOW_PROTOCOL_VERSION) {
        DEBUG_PRINTLN("[ESPNOW] Protocol version mismatch");
        return;
    }
    
    // Get current room ID safely
    char currentRoom[16];
    getRoomId(currentRoom, sizeof(currentRoom));
    
    // Verify room ID (safe comparison)
    if (strncmp(msg.roomId, currentRoom, sizeof(msg.roomId)) != 0) {
        return;  // Not for this room
    }
    
    // Verify HMAC
    if (!msg.verifyHMAC(espNowSharedSecret.c_str())) {
        DEBUG_PRINTLN("[ESPNOW] HMAC verification failed");
        return;
    }

    // Handle Pairing Request (from Gatekeeper)
    if (msg.msgType == MSG_PAIR_REQUEST) {
        if (!getIsPaired()) {
            setGatekeeperMac(mac);
            setIsPaired(true);
            
            // Persist pairing
            prefs.begin("nvm", false);
            prefs.putBytes("gateMac", mac, 6);
            prefs.putBool("paired", true);
            prefs.end();

            DEBUG_PRINTF("[PAIR] Paired with Gatekeeper: %02X:%02X:%02X:%02X:%02X:%02X\n",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

            // Send ACK
            ESPNowMessage ack;
            ack.init();
            ack.setRoomId(currentRoom);
            ack.msgType = MSG_PAIR_ACK;
            ack.seqNum = getNextSeqNum();
            ack.calculateHMAC(espNowSharedSecret.c_str());
            
            esp_now_peer_info_t peerInfo = {};
            memcpy(peerInfo.peer_addr, mac, 6);
            peerInfo.channel = 0;
            peerInfo.encrypt = true;
            
            // Generate LMK from room ID and shared secret for encryption
            generateLMK(currentRoom, espNowSharedSecret.c_str(), peerInfo.lmk);
            
            if (!esp_now_is_peer_exist(mac)) {
                esp_now_add_peer(&peerInfo);
            }
            esp_now_send(mac, (uint8_t*)&ack, sizeof(ack));
        }
        return;
    }

    // After pairing, only accept from paired MAC
    uint8_t gateMac[6];
    getGatekeeperMac(gateMac);
    
    if (!getIsPaired() || memcmp(mac, gateMac, 6) != 0) {
        return;
    }

    // Validate sequence number (replay protection)
    if (!seqNumManager.isValid(msg.seqNum)) {
        DEBUG_PRINTLN("[ESPNOW] Replay detected");
        return;
    }

    // Handle messages
    if (msg.msgType == MSG_WAKE || msg.msgType == MSG_HEARTBEAT) {
        updateHeartbeatTime();
        if (msg.msgType == MSG_WAKE) {
            updateMovementTime();
            setRoomPower(true);
            DEBUG_PRINTLN("[ESPNOW] Wake signal received");
        }
    }
}

// =============================================================================
// SERIAL COMMAND HANDLER
// =============================================================================
void handleSerial() {
    if (!Serial.available()) return;
    
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.isEmpty()) return;
    
    if (cmd.startsWith("ROOM:")) {
        String newRoom = cmd.substring(5);
        if (newRoom.length() > 0 && newRoom.length() <= ROOM_ID_MAX_LEN) {
            prefs.begin("nvm", false);
            prefs.putString("roomId", newRoom);
            prefs.end();
            setRoomId(newRoom.c_str());
            Serial.printf("[CONFIG] Room ID set to %s\n", newRoom.c_str());
        } else {
            Serial.println("[ERROR] Invalid room ID length");
        }
    } 
    else if (cmd == "PAIR:RESET") {
        prefs.begin("nvm", false);
        prefs.putBool("paired", false);
        prefs.end();
        setIsPaired(false);
        seqNumManager.reset();
        Serial.println("[CONFIG] Pairing reset");
    } 
    else if (cmd == "PAIR:STATUS") {
        uint8_t mac[6];
        getGatekeeperMac(mac);
        char room[16];
        getRoomId(room, sizeof(room));
        Serial.printf("[STATUS] Paired: %s, Room: %s, Peer: %02X:%02X:%02X:%02X:%02X:%02X\n",
            getIsPaired() ? "YES" : "NO", room,
            mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    } 
    else if (cmd == "MAC") {
        Serial.printf("[INFO] MAC: %s\n", WiFi.macAddress().c_str());
    }
    else if (cmd == "STATUS") {
        Serial.printf("[INFO] Firmware: %s\n", FIRMWARE_VERSION);
        Serial.printf("[INFO] Power: %s\n", isPowerOn() ? "ON" : "OFF");
        Serial.printf("[INFO] Radar: %s\n", radar.isConnected() ? "OK" : "FAIL");
    }
    else if (cmd == "HELP") {
        Serial.println("Commands:");
        Serial.println("  ROOM:id      - Set room ID");
        Serial.println("  PAIR:STATUS  - Show pairing status");
        Serial.println("  PAIR:RESET   - Reset pairing");
        Serial.println("  MAC          - Show MAC address");
        Serial.println("  STATUS       - Show system status");
    }
    else {
        Serial.println("[ERROR] Unknown command. Type HELP for list.");
    }
}

// =============================================================================
// SETUP
// =============================================================================
void setup() {
    Serial.begin(115200);
    delay(100);
    
    Serial.println("\n=== Watchman v" FIRMWARE_VERSION " ===");
    
    // Initialize GPIO
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(STATUS_LED, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);
    
    // Initialize mutex
    stateMutex = xSemaphoreCreateMutex();
    if (!stateMutex) {
        Serial.println("[FATAL] Failed to create mutex");
        ESP.restart();
    }
    
    // Initialize radar
    RadarSerial.begin(RADAR_BAUD, SERIAL_8N1, RADAR_RX, RADAR_TX);
    if (radar.begin(RadarSerial)) {
        Serial.println("[BOOT] Radar OK");
    } else {
        Serial.println("[BOOT] Radar FAIL");
    }

    // Load configuration
    prefs.begin("nvm", true);
    bool savedPaired = prefs.getBool("paired", false);
    if (savedPaired) {
        uint8_t mac[6];
        prefs.getBytes("gateMac", mac, 6);
        setGatekeeperMac(mac);
        setIsPaired(true);
    }
    String savedRoom = prefs.getString("roomId", DEFAULT_ROOM_ID);
    setRoomId(savedRoom.c_str());
    prefs.end();

    // Initialize movement time to prevent immediate power off
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000))) {
        sharedState.lastMovementTime = millis();
        xSemaphoreGive(stateMutex);
    }

    // Initialize ESP-NOW
    WiFi.mode(WIFI_STA);
    if (esp_now_init() == ESP_OK) {
        esp_now_register_recv_cb(OnDataRecv);
        
        if (getIsPaired()) {
            uint8_t mac[6];
            getGatekeeperMac(mac);
            char room[16];
            getRoomId(room, sizeof(room));
            
            esp_now_peer_info_t peerInfo = {};
            memcpy(peerInfo.peer_addr, mac, 6);
            peerInfo.channel = 0;
            peerInfo.encrypt = true;
            
            // Generate LMK from room ID and shared secret
            generateLMK(room, espNowSharedSecret.c_str(), peerInfo.lmk);
            
            esp_now_add_peer(&peerInfo);
            
            Serial.printf("[BOOT] Paired with %02X:%02X:%02X:%02X:%02X:%02X (encrypted)\n",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
        } else {
            Serial.println("[BOOT] Not paired. Entering beacon mode.");
        }
        Serial.println("[BOOT] ESP-NOW OK");
    } else {
        Serial.println("[BOOT] ESP-NOW FAIL");
    }

    char room[16];
    getRoomId(room, sizeof(room));
    Serial.printf("[BOOT] Room: %s\n", room);
    Serial.printf("[BOOT] MAC: %s\n", WiFi.macAddress().c_str());

    // Initialize watchdog
    esp_task_wdt_init(30, true);
    esp_task_wdt_add(NULL);
    
    Serial.println("[BOOT] Ready. Type HELP for commands.");
}

// =============================================================================
// MAIN LOOP
// =============================================================================
void loop() {
    esp_task_wdt_reset();
    handleSerial();

    // Read radar
    radar.read();
    bool isMoving = radar.presenceDetected();

    // Update movement time if presence detected
    if (isMoving) {
        updateMovementTime();
        setRoomPower(true);
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
            sharedState.currentState = OCCUPIED;
            xSemaphoreGive(stateMutex);
        }
    } else {
        unsigned long now = millis();
        unsigned long lastMovement = 0;
        RoomState newState = STANDBY;
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
            lastMovement = sharedState.lastMovementTime;
            xSemaphoreGive(stateMutex);
        }
        
        unsigned long idleTime = now - lastMovement;
        
        if (idleTime > (GRACE_PERIOD_MS + STANDBY_DELAY_MS)) {
            setRoomPower(false);
            newState = STANDBY;
        } else if (idleTime > GRACE_PERIOD_MS) {
            newState = GRACE;
        } else {
            newState = OCCUPIED;
        }
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
            sharedState.currentState = newState;
            xSemaphoreGive(stateMutex);
        }
    }

    // Beaconing if not paired
    if (!getIsPaired() && millis() - lastBeaconTime > BEACON_INTERVAL_MS) {
        lastBeaconTime = millis();
        
        char currentRoom[16];
        getRoomId(currentRoom, sizeof(currentRoom));
        
        ESPNowMessage beacon;
        beacon.init();
        beacon.setRoomId(currentRoom);
        beacon.msgType = MSG_BEACON;
        beacon.seqNum = getNextSeqNum();
        beacon.calculateHMAC(espNowSharedSecret.c_str());
        
        uint8_t broadcastMac[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
        esp_now_peer_info_t peerInfo = {};
        memcpy(peerInfo.peer_addr, broadcastMac, 6);
        peerInfo.channel = 0;
        peerInfo.encrypt = false;
        
        if (!esp_now_is_peer_exist(broadcastMac)) {
            esp_now_add_peer(&peerInfo);
        }
        esp_now_send(broadcastMac, (uint8_t*)&beacon, sizeof(beacon));
        DEBUG_PRINTLN("[ESPNOW] Beacon sent");
    }

    // Status LED Logic
    unsigned long now = millis();
    bool isPaired = getIsPaired();
    
    if (!isPaired) {
        // Slow blink = Unpaired
        digitalWrite(STATUS_LED, (now / 1000) % 2);
    } else {
        unsigned long lastHB = 0;
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
            lastHB = sharedState.lastHeartbeatTime;
            xSemaphoreGive(stateMutex);
        }
        
        bool connected = (now - lastHB < HEARTBEAT_TIMEOUT_MS);
        if (connected) {
            // Heartbeat pulse
            digitalWrite(STATUS_LED, (now / 2000) % 2);
        } else {
            // Rapid flash = Disconnected
            digitalWrite(STATUS_LED, (now / 200) % 2);
        }
    }

    delay(100);
}
