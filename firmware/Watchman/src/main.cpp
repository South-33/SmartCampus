#include <Arduino.h>
#include <LD2410.h>
#include <esp_now.h>
#include <WiFi.h>
#include "config.h"

// --- Global Objects ---
LD2410 radar;
HardwareSerial RadarSerial(2);

// State Machine
enum RoomState { OCCUPIED, GRACE, STANDBY };
RoomState currentState = STANDBY;

unsigned long lastMovementTime = 0;
unsigned long lastHeartbeatTime = 0;
bool powerOn = false;

// --- Helper: Set Room Power ---
void setRoomPower(bool on) {
    if (powerOn == on) return;
    powerOn = on;
    digitalWrite(RELAY_PIN, on ? HIGH : LOW);
    Serial.printf(">>> ROOM POWER: %s <<<\n", on ? "ON" : "OFF");
}

// --- ESP-NOW Callback ---
typedef struct struct_message {
    char command[16];
} struct_message;

void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
    struct_message myData;
    memcpy(&myData, incomingData, sizeof(myData));
    
    if (String(myData.command) == "WAKE" || String(myData.command) == "HEARTBEAT") {
        lastHeartbeatTime = millis();
        if (String(myData.command) == "WAKE") {
            lastMovementTime = millis();
            setRoomPower(true);
        }
    }
}

void setup() {
    Serial.begin(115200);
    RadarSerial.begin(256000, SERIAL_8N1, RADAR_RX, RADAR_TX);

    pinMode(RELAY_PIN, OUTPUT);
    pinMode(STATUS_LED, OUTPUT);
    setRoomPower(false);

    if (radar.begin(RadarSerial)) Serial.println("Radar OK");
    else Serial.println("Radar Failed");

    WiFi.mode(WIFI_STA);
    if (esp_now_init() != ESP_OK) Serial.println("ESP-NOW Fail");
    esp_now_register_recv_cb(OnDataRecv);
    
    Serial.print("Watchman MAC: "); Serial.println(WiFi.macAddress());
}

void loop() {
    radar.read();
    bool isMoving = radar.presenceDetected();

    if (isMoving) {
        lastMovementTime = millis();
        setRoomPower(true);
        currentState = OCCUPIED;
    } else {
        unsigned long idleTime = millis() - lastMovementTime;
        if (idleTime > (GRACE_PERIOD_MS + STANDBY_DELAY_MS)) {
            setRoomPower(false);
            currentState = STANDBY;
        } else if (idleTime > GRACE_PERIOD_MS) {
            currentState = GRACE;
        }
    }

    // --- Status LED Logic ---
    unsigned long now = millis();
    bool connected = (now - lastHeartbeatTime < 10000); // 10s timeout
    
    if (connected) {
        // Heartbeat pulse
        if ((now / 2000) % 2 == 0) digitalWrite(STATUS_LED, HIGH);
        else digitalWrite(STATUS_LED, LOW);
    } else {
        // Rapid flash = Disconnected from Node A
        if ((now / 200) % 2 == 0) digitalWrite(STATUS_LED, HIGH);
        else digitalWrite(STATUS_LED, LOW);
    }

    delay(100);
}
