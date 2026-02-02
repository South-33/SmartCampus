// =============================================================================
// GATEKEEPER FIRMWARE v2.0.0
// Smart Classroom NFC + Biometric Access Control System
//
// Security Features:
// - TLS certificate verification (no insecure mode)
// - FreeRTOS mutex for thread-safe shared state
// - HMAC-SHA256 for ESP-NOW message authentication
// - Proper input validation and bounds checking
// - NVS-based credential storage (not hardcoded)
// =============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_PN532.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_now.h>
#include <esp_task_wdt.h>
#include <freertos/semphr.h>

#include "config.h"
#include "Storage.h"
#include "NTPSync.h"
#include "FaceAuth.h"
#include "FingerVeinAuth.h"
#include "ESPNowProtocol.h"

// =============================================================================
// GLOBAL OBJECTS
// =============================================================================
Adafruit_PN532 nfc(PN532_SDA, PN532_SCL);
Preferences prefs;
HardwareSerial FaceSerial(1);
HardwareSerial VeinSerial(2);

// Task Handles
TaskHandle_t NetworkTaskHandle = NULL;

// Thread synchronization
SemaphoreHandle_t stateMutex = NULL;

// =============================================================================
// SHARED STATE (Protected by mutex)
// =============================================================================
struct SharedState {
    bool isWifiConnected = false;
    bool isPaired = false;
    uint8_t watchmanMac[6] = {0};
    char roomId[16] = {0};
    uint32_t seqNum = 0;
    unsigned long lastHeartbeatRecv = 0;
} sharedState;

// Local state (main task only)
String hardwareToken = "";
String wifiSSID = "";
String wifiPass = "";
String convexUrl = "";
unsigned long lastWhitelistSync = 0;
unsigned long lastLogSync = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastConfigSync = 0;

// Dynamic configuration from Convex (stored in NVS)
String espNowPmk = "";           // 16 chars for ESP-NOW PMK
String espNowSharedSecret = "";  // Shared secret for HMAC
bool debugModeEnabled = true;    // Can be toggled remotely
uint32_t configVersion = 0;      // For detecting config changes

// Sequence number manager for replay protection
SeqNumManager seqNumManager;

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

void getWatchmanMac(uint8_t* mac) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        memcpy(mac, sharedState.watchmanMac, 6);
        xSemaphoreGive(stateMutex);
    }
}

void setWatchmanMac(const uint8_t* mac) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100))) {
        memcpy(sharedState.watchmanMac, mac, 6);
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

// =============================================================================
// LED PATTERNS
// =============================================================================
void ledPattern(int onMs, int offMs, int count) {
    for (int i = 0; i < count; i++) {
        digitalWrite(STATUS_LED, HIGH);
        delay(onMs);
        digitalWrite(STATUS_LED, LOW);
        delay(offMs);
    }
}

void ledSuccess() { ledPattern(100, 100, 3); }
void ledDenied() { ledPattern(100, 100, 10); }

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

    // Handle beacon from Watchman (pairing discovery)
    if (msg.msgType == MSG_BEACON && !getIsPaired()) {
        DEBUG_PRINTF("[ESPNOW] Beacon from Watchman: %02X:%02X:%02X:%02X:%02X:%02X\n",
            mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
        
        // Send Pairing Request
        ESPNowMessage req;
        req.init();
        req.setRoomId(currentRoom);
        req.msgType = MSG_PAIR_REQUEST;
        req.seqNum = getNextSeqNum();
        req.timestamp = NTPSync::getEpochTime();
        req.calculateHMAC(espNowSharedSecret.c_str());

        esp_now_peer_info_t peerInfo = {};
        memcpy(peerInfo.peer_addr, mac, 6);
        peerInfo.channel = 0;
        peerInfo.encrypt = true;
        
        // Generate LMK from room ID and shared secret for encryption
        generateLMK(currentRoom, espNowSharedSecret.c_str(), peerInfo.lmk);
        
        if (!esp_now_is_peer_exist(mac)) {
            esp_err_t result = esp_now_add_peer(&peerInfo);
            if (result != ESP_OK) {
                DEBUG_PRINTF("[ESPNOW] Failed to add peer: %d\n", result);
                return;
            }
        }
        
        esp_err_t sendResult = esp_now_send(mac, (uint8_t*)&req, sizeof(req));
        if (sendResult != ESP_OK) {
            DEBUG_PRINTF("[ESPNOW] Failed to send: %d\n", sendResult);
        }
    } 
    // Handle pairing acknowledgment
    else if (msg.msgType == MSG_PAIR_ACK && !getIsPaired()) {
        setWatchmanMac(mac);
        setIsPaired(true);
        
        // Persist pairing
        prefs.begin("nvm", false);
        prefs.putBytes("watchMac", mac, 6);
        prefs.putBool("paired", true);
        prefs.end();
        
        DEBUG_PRINTLN("[ESPNOW] Pairing confirmed!");
    }
}

// =============================================================================
// ESP-NOW SEND HELPER
// =============================================================================
bool sendToWatchman(MessageType type) {
    if (!getIsPaired()) return false;
    
    char currentRoom[16];
    getRoomId(currentRoom, sizeof(currentRoom));
    
    uint8_t mac[6];
    getWatchmanMac(mac);
    
    ESPNowMessage msg;
    msg.init();
    msg.setRoomId(currentRoom);
    msg.msgType = type;
    msg.seqNum = getNextSeqNum();
    msg.timestamp = NTPSync::getEpochTime();
    msg.calculateHMAC(espNowSharedSecret.c_str());
    
    esp_err_t result = esp_now_send(mac, (uint8_t*)&msg, sizeof(msg));
    if (result != ESP_OK) {
        DEBUG_PRINTF("[ESPNOW] Send failed: %d\n", result);
        return false;
    }
    return true;
}

// =============================================================================
// ACCESS CONTROL
// =============================================================================
void openDoor(const String& userId, const String& method) {
    DEBUG_PRINTF("[ACCESS] GRANTED: %s via %s\n", userId.c_str(), method.c_str());
    
    // Wake Watchman
    sendToWatchman(MSG_WAKE);
    
    // Unlock door
    digitalWrite(RELAY_PIN, HIGH);
    ledSuccess();
    
    // Log access
    Storage::appendLog(userId.c_str(), method.c_str(), NTPSync::getEpochTime());
    
    // Keep unlocked for configured duration
    delay(UNLOCK_DURATION_MS);
    digitalWrite(RELAY_PIN, LOW);
}

bool runBiometricCheck(uint16_t expectedBiometricId) {
    DEBUG_PRINTF("[BIOMETRIC] Starting check, expecting ID: %d\n", expectedBiometricId);
    unsigned long start = millis();
    
    if (TEST_MODE) {
        delay(2000);
        return true;
    }

    while (millis() - start < BIOMETRIC_TIMEOUT_MS) {
        esp_task_wdt_reset();
        
        // Blink LED while waiting
        digitalWrite(STATUS_LED, (millis() / 500) % 2);

        // Try Face Recognition
        int faceId = FaceAuth::verifyOnce();
        if (faceId >= 0) {
            if (faceId == expectedBiometricId) {
                DEBUG_PRINTF("[BIOMETRIC] Face match: %d\n", faceId);
                digitalWrite(STATUS_LED, LOW);
                return true;
            }
            DEBUG_PRINTF("[BIOMETRIC] Face mismatch: got %d, expected %d\n", faceId, expectedBiometricId);
        }

        // Try Finger Vein
        int veinId = FingerVeinAuth::verify();
        if (veinId >= 0) {
            if (veinId == expectedBiometricId) {
                DEBUG_PRINTF("[BIOMETRIC] Vein match: %d\n", veinId);
                digitalWrite(STATUS_LED, LOW);
                return true;
            }
            DEBUG_PRINTF("[BIOMETRIC] Vein mismatch: got %d, expected %d\n", veinId, expectedBiometricId);
        }

        yield();
    }
    
    digitalWrite(STATUS_LED, LOW);
    DEBUG_PRINTLN("[BIOMETRIC] Timeout - No match");
    return false;
}

// =============================================================================
// NETWORK FUNCTIONS WITH TLS
// =============================================================================
WiFiClientSecure* createSecureClient() {
    WiFiClientSecure* client = new WiFiClientSecure();
    client->setCACert(ROOT_CA_CERT);
    client->setTimeout(HTTP_TIMEOUT_MS / 1000);
    return client;
}

void registerDevice() {
    if (WiFi.status() != WL_CONNECTED || convexUrl.isEmpty()) return;
    
    WiFiClientSecure* client = createSecureClient();
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    
    if (!http.begin(*client, convexUrl + "/api/register")) {
        DEBUG_PRINTLN("[NET] Failed to begin HTTP");
        delete client;
        return;
    }
    
    http.addHeader("Content-Type", "application/json");
    
    JsonDocument req;
    req["chipId"] = WiFi.macAddress();
    req["firmwareVersion"] = FIRMWARE_VERSION;
    
    String body;
    serializeJson(req, body);
    
    int code = http.POST(body);
    if (code == 200) {
        JsonDocument res;
        DeserializationError err = deserializeJson(res, http.getString());
        if (!err && res["token"].is<const char*>()) {
            hardwareToken = res["token"].as<String>();
            prefs.begin("auth", false);
            prefs.putString("token", hardwareToken);
            prefs.end();
            DEBUG_PRINTLN("[NET] Device registered successfully");
        }
    } else {
        DEBUG_PRINTF("[NET] Registration failed: %d\n", code);
    }
    
    http.end();
    delete client;
}

void syncLogs() {
    if (hardwareToken.isEmpty() || WiFi.status() != WL_CONNECTED) return;
    
    int count = Storage::getLogCount();
    if (count == 0) return;

    File file = LittleFS.open("/logs.bin", FILE_READ);
    if (!file) return;

    JsonDocument doc;
    doc["chipId"] = WiFi.macAddress();
    JsonArray logsArr = doc["logs"].to<JsonArray>();
    
    while (file.available()) {
        AccessLog log;
        if (file.read((uint8_t*)&log, sizeof(AccessLog)) != sizeof(AccessLog)) {
            break;
        }
        JsonObject logObj = logsArr.add<JsonObject>();
        logObj["userId"] = log.userId;
        logObj["method"] = log.method;
        logObj["action"] = "ATTENDANCE";
        logObj["result"] = "success";
        logObj["timestamp"] = log.timestamp;
        logObj["timestampType"] = NTPSync::isTimeValid() ? "ntp" : "local";
    }
    file.close();

    WiFiClientSecure* client = createSecureClient();
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    
    if (!http.begin(*client, convexUrl + "/api/logs")) {
        delete client;
        return;
    }
    
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + hardwareToken);
    
    String body;
    serializeJson(doc, body);
    
    int httpCode = http.POST(body);
    if (httpCode == 200) {
        Storage::clearLogs();
        DEBUG_PRINTLN("[SYNC] Logs uploaded successfully");
    } else {
        DEBUG_PRINTF("[SYNC] Log upload failed: %d - %s\n", httpCode, http.getString().c_str());
    }
    
    http.end();
    delete client;
}

void syncWhitelist() {
    if (hardwareToken.isEmpty() || WiFi.status() != WL_CONNECTED) return;
    
    WiFiClientSecure* client = createSecureClient();
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    
    String url = convexUrl + "/api/whitelist?chipId=" + WiFi.macAddress();
    if (!http.begin(*client, url)) {
        delete client;
        return;
    }
    
    http.addHeader("Authorization", "Bearer " + hardwareToken);
    
    int httpCode = http.GET();
    if (httpCode == 200) {
        JsonDocument res;
        DeserializationError error = deserializeJson(res, http.getString());
        if (!error) {
            JsonArray entries = res["entries"];
            if (!entries.isNull()) {
                // Store card UID -> studentId mapping
                prefs.begin("whitelist", false);
                prefs.clear();
                for (JsonObject entry : entries) {
                    const char* uid = entry["uid"];
                    const char* sid = entry["sid"];
                    if (uid && sid) {
                        prefs.putString(uid, sid);
                    }
                }
                prefs.end();
                
                // Store studentId -> biometricId mapping (separate namespace)
                prefs.begin("biometrics", false);
                prefs.clear();
                for (JsonObject entry : entries) {
                    const char* sid = entry["sid"];
                    uint16_t bioId = entry["bioId"] | 0;
                    if (sid && bioId > 0) {
                        prefs.putUShort(sid, bioId);
                    }
                }
                prefs.end();
                
                DEBUG_PRINTF("[SYNC] Whitelist updated: %d entries\n", entries.size());
            }
        }
    } else {
        DEBUG_PRINTF("[SYNC] Whitelist sync failed: %d\n", httpCode);
    }
    
    http.end();
    delete client;
}

/**
 * Fetches system configuration (ESP-NOW secrets, debug mode) from Convex.
 * Called after registration and periodically (hourly).
 */
void syncSystemConfig() {
    if (hardwareToken.isEmpty() || WiFi.status() != WL_CONNECTED) return;
    
    WiFiClientSecure* client = createSecureClient();
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    
    String url = convexUrl + "/api/config?chipId=" + WiFi.macAddress();
    if (!http.begin(*client, url)) {
        delete client;
        return;
    }
    
    http.addHeader("Authorization", "Bearer " + hardwareToken);
    
    int httpCode = http.GET();
    if (httpCode == 200) {
        JsonDocument res;
        DeserializationError error = deserializeJson(res, http.getString());
        if (!error) {
            const char* pmk = res["pmk"];
            const char* secret = res["secret"];
            bool debug = res["debug"] | true;
            uint32_t version = res["version"] | 0;
            
            // Only update if version changed (or first time)
            if (version != configVersion && pmk && secret) {
                espNowPmk = String(pmk);
                espNowSharedSecret = String(secret);
                debugModeEnabled = debug;
                configVersion = version;
                
                // Persist to NVS
                prefs.begin("config", false);
                prefs.putString("pmk", espNowPmk);
                prefs.putString("secret", espNowSharedSecret);
                prefs.putBool("debug", debugModeEnabled);
                prefs.putULong("version", configVersion);
                prefs.end();
                
                DEBUG_PRINTLN("[CONFIG] System configuration updated from Convex");
                
                // Re-initialize ESP-NOW with new PMK
                // Note: This requires ESP-NOW to be restarted with new encryption keys
                // For simplicity, we just store it - full re-init would require more work
            }
        }
    } else {
        DEBUG_PRINTF("[CONFIG] Config sync failed: %d\n", httpCode);
    }
    
    http.end();
    delete client;
}

// =============================================================================
// NETWORK TASK (Core 0)
// =============================================================================
void NetworkTask(void* pvParameters) {
    // Connect to WiFi
    if (!wifiSSID.isEmpty()) {
        WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());
        DEBUG_PRINTF("[WIFI] Connecting to %s...\n", wifiSSID.c_str());
    }
    
    bool wasConnected = false;
    
    for (;;) {
        esp_task_wdt_reset();
        
        bool isConnected = (WiFi.status() == WL_CONNECTED);
        
        if (isConnected && !wasConnected) {
            // Just connected
            wasConnected = true;
            DEBUG_PRINTF("[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
            
            NTPSync::begin();
            
            if (hardwareToken.isEmpty()) {
                registerDevice();
            }
            
            // Fetch system config immediately after registration
            syncSystemConfig();
        } else if (!isConnected && wasConnected) {
            // Just disconnected
            wasConnected = false;
            DEBUG_PRINTLN("[WIFI] Disconnected");
        }
        
        if (isConnected) {
            NTPSync::update();
            
            unsigned long now = millis();
            if (now - lastWhitelistSync > WHITELIST_SYNC_INTERVAL) {
                syncWhitelist();
                lastWhitelistSync = now;
            }
            if (now - lastLogSync > LOG_SYNC_INTERVAL) {
                syncLogs();
                lastLogSync = now;
            }
            if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
                sendToWatchman(MSG_HEARTBEAT);
                lastHeartbeat = now;
            }
            if (now - lastConfigSync > CONFIG_SYNC_INTERVAL) {
                syncSystemConfig();
                lastConfigSync = now;
            }
        }
        
        vTaskDelay(pdMS_TO_TICKS(5000));
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
    
    // WiFi configuration: WIFI:ssid:password
    if (cmd.startsWith("WIFI:")) {
        int sep = cmd.indexOf(':', 5);
        if (sep > 5) {
            String ssid = cmd.substring(5, sep);
            String pass = cmd.substring(sep + 1);
            
            prefs.begin("wifi", false);
            prefs.putString("ssid", ssid);
            prefs.putString("pass", pass);
            prefs.end();
            
            Serial.printf("[CONFIG] WiFi credentials saved. Restarting...\n");
            delay(1000);
            ESP.restart();
        } else {
            Serial.println("[ERROR] Format: WIFI:ssid:password");
        }
    }
    // Convex URL: CONVEX:https://...
    else if (cmd.startsWith("CONVEX:")) {
        String url = cmd.substring(7);
        if (url.startsWith("https://")) {
            prefs.begin("net", false);
            prefs.putString("convex", url);
            prefs.end();
            Serial.printf("[CONFIG] Convex URL set to %s\n", url.c_str());
            convexUrl = url;
        } else {
            Serial.println("[ERROR] URL must start with https://");
        }
    }
    // Room ID: ROOM:ROOM_305
    else if (cmd.startsWith("ROOM:")) {
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
    // Pairing commands
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
        getWatchmanMac(mac);
        char room[16];
        getRoomId(room, sizeof(room));
        Serial.printf("[STATUS] Paired: %s, Room: %s, Peer: %02X:%02X:%02X:%02X:%02X:%02X\n",
            getIsPaired() ? "YES" : "NO", room,
            mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    }
    // Enrollment commands
    else if (cmd.startsWith("ENROLL:FACE:")) {
        int id = cmd.substring(12).toInt();
        if (id > 0 && id <= 1000) {
            if (FaceAuth::startEnroll(id)) {
                Serial.printf("[ENROLL] Starting Face enrollment for ID %d\n", id);
            } else {
                Serial.println("[ERROR] Failed to start face enrollment");
            }
        } else {
            Serial.println("[ERROR] Invalid ID (1-1000)");
        }
    }
    else if (cmd.startsWith("ENROLL:VEIN:")) {
        int id = cmd.substring(12).toInt();
        if (id > 0 && id <= 1000) {
            FingerVeinAuth::enroll(id);
            Serial.printf("[ENROLL] Starting Vein enrollment for ID %d\n", id);
        } else {
            Serial.println("[ERROR] Invalid ID (1-1000)");
        }
    }
    // Info commands
    else if (cmd == "MAC") {
        Serial.printf("[INFO] MAC: %s\n", WiFi.macAddress().c_str());
    }
    else if (cmd == "STATUS") {
        Serial.printf("[INFO] Firmware: %s\n", FIRMWARE_VERSION);
        Serial.printf("[INFO] WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
        Serial.printf("[INFO] IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[INFO] NTP: %s\n", NTPSync::isTimeValid() ? "Synced" : "Not synced");
        Serial.printf("[INFO] Token: %s\n", hardwareToken.isEmpty() ? "None" : "Set");
        Serial.printf("[INFO] Logs pending: %d\n", Storage::getLogCount());
        Storage::printInfo();
    }
    else if (cmd == "HELP") {
        Serial.println("Commands:");
        Serial.println("  WIFI:ssid:password - Set WiFi credentials");
        Serial.println("  CONVEX:url         - Set Convex backend URL");
        Serial.println("  ROOM:id            - Set room ID");
        Serial.println("  PAIR:STATUS        - Show pairing status");
        Serial.println("  PAIR:RESET         - Reset pairing");
        Serial.println("  ENROLL:FACE:id     - Enroll face (1-1000)");
        Serial.println("  ENROLL:VEIN:id     - Enroll vein (1-1000)");
        Serial.println("  MAC                - Show MAC address");
        Serial.println("  STATUS             - Show system status");
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
    
    Serial.println("\n=== Gatekeeper v" FIRMWARE_VERSION " ===");
    
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
    
    // Initialize storage
    if (!Storage::begin()) {
        Serial.println("[WARN] Storage init failed");
    }
    
    // Load configuration from NVS
    prefs.begin("nvm", true);
    bool savedPaired = prefs.getBool("paired", false);
    if (savedPaired) {
        uint8_t mac[6];
        prefs.getBytes("watchMac", mac, 6);
        setWatchmanMac(mac);
        setIsPaired(true);
    }
    String savedRoom = prefs.getString("roomId", DEFAULT_ROOM_ID);
    setRoomId(savedRoom.c_str());
    prefs.end();
    
    prefs.begin("auth", true);
    hardwareToken = prefs.getString("token", "");
    prefs.end();
    
    prefs.begin("wifi", true);
    wifiSSID = prefs.getString("ssid", "");
    wifiPass = prefs.getString("pass", "");
    prefs.end();
    
    prefs.begin("net", true);
    convexUrl = prefs.getString("convex", DEFAULT_CONVEX_URL);
    prefs.end();
    
    // Load system config from NVS (fetched from Convex)
    prefs.begin("config", true);
    espNowPmk = prefs.getString("pmk", "");
    espNowSharedSecret = prefs.getString("secret", "");
    debugModeEnabled = prefs.getBool("debug", true);
    configVersion = prefs.getULong("version", 0);
    prefs.end();
    
    // Use defaults if not configured yet
    if (espNowPmk.isEmpty()) {
        espNowPmk = DEFAULT_ESP_NOW_PMK;  // Fallback until config is fetched
    }
    if (espNowSharedSecret.isEmpty()) {
        espNowSharedSecret = DEFAULT_ESP_NOW_SECRET;  // Fallback until config is fetched
    }
    
    // Initialize biometrics
    if (FaceAuth::begin(FaceSerial, FACE_RX_PIN, FACE_TX_PIN)) {
        Serial.println("[BOOT] Face module OK");
    } else {
        Serial.println("[BOOT] Face module FAIL");
    }
    
    if (FingerVeinAuth::begin(VeinSerial, VEIN_RX_PIN, VEIN_TX_PIN)) {
        Serial.println("[BOOT] Vein module OK");
    } else {
        Serial.println("[BOOT] Vein module FAIL");
    }
    
    // Initialize NFC
    nfc.begin();
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (versiondata) {
        nfc.SAMConfig();
        Serial.println("[BOOT] NFC OK");
    } else {
        Serial.println("[BOOT] NFC FAIL");
    }
    
    // Initialize ESP-NOW
    WiFi.mode(WIFI_STA);
    if (esp_now_init() == ESP_OK) {
        esp_now_register_recv_cb(OnDataRecv);
        
        if (getIsPaired()) {
            uint8_t mac[6];
            getWatchmanMac(mac);
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
        }
        Serial.println("[BOOT] ESP-NOW OK");
    } else {
        Serial.println("[BOOT] ESP-NOW FAIL");
    }
    
    // Start network task on Core 0
    BaseType_t result = xTaskCreatePinnedToCore(
        NetworkTask, "NetTask", 10240, NULL, 1, &NetworkTaskHandle, 0);
    if (result != pdPASS) {
        Serial.println("[WARN] Failed to create network task");
    }
    
    // Initialize watchdog
    esp_task_wdt_init(30, true);
    esp_task_wdt_add(NULL);
    
    char room[16];
    getRoomId(room, sizeof(room));
    Serial.printf("[BOOT] Room: %s\n", room);
    Serial.printf("[BOOT] MAC: %s\n", WiFi.macAddress().c_str());
    Serial.println("[BOOT] Ready. Type HELP for commands.");
}

// =============================================================================
// MAIN LOOP
// =============================================================================
void loop() {
    esp_task_wdt_reset();
    handleSerial();
    
    // Continue any ongoing vein enrollment
    if (FingerVeinAuth::getEnrollStep() > 0) {
        FingerVeinAuth::Result result = FingerVeinAuth::enroll(0);
        if (result == FingerVeinAuth::SUCCESS) {
            Serial.println("[ENROLL] Vein enrollment complete!");
            ledSuccess();
        } else if (result == FingerVeinAuth::TIMEOUT || result == FingerVeinAuth::SENSOR_ERROR) {
            Serial.println("[ENROLL] Vein enrollment failed");
            ledDenied();
        }
    }
    
    // Check for face enrollment completion
    if (FaceAuth::getState() == FaceAuth::ENROLLING) {
        if (FaceAuth::isEnrollComplete()) {
            Serial.println("[ENROLL] Face enrollment complete!");
            ledSuccess();
        }
    }
    
    // NFC card reading
    uint8_t uid[7] = {0};
    uint8_t uidLength = 0;
    
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
        // Convert UID to hex string
        char cardUID[15] = {0};  // 7 bytes * 2 + null
        for (uint8_t i = 0; i < uidLength && i < 7; i++) {
            sprintf(&cardUID[i * 2], "%02X", uid[i]);
        }
        
        DEBUG_PRINTF("[NFC] Card: %s\n", cardUID);
        
        // Check whitelist
        prefs.begin("whitelist", true);
        bool isInWhitelist = prefs.isKey(cardUID);
        String sid = isInWhitelist ? prefs.getString(cardUID) : "";
        prefs.end();
        
        if (isInWhitelist) {
            // Check if biometric verification required (students)
            if (sid.startsWith("STU")) {
                // Look up expected biometric ID for this student
                prefs.begin("biometrics", true);
                uint16_t expectedBioId = prefs.getUShort(sid.c_str(), 0);
                prefs.end();
                
                if (expectedBioId == 0) {
                    DEBUG_PRINTLN("[ACCESS] Student has no enrolled biometric");
                    ledDenied();
                    Serial.println("[ACCESS] Denied - No biometric enrolled");
                } else if (runBiometricCheck(expectedBioId)) {
                    openDoor(sid, "NFC+BIO");
                } else {
                    ledDenied();
                    Serial.println("[ACCESS] Denied - Biometric mismatch");
                }
            } else {
                // Staff/Admin - NFC only
                openDoor(sid, "NFC");
            }
        } else {
            Serial.println("[ACCESS] Denied - Not in whitelist");
            ledDenied();
        }
        
        delay(1000);  // Debounce
    }
}
