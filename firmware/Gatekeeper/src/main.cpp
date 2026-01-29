#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_now.h>
#include "config.h"
#include "Storage.h"

// --- Global Objects ---
PN532_I2C pn532_i2c(Wire);
PN532 nfc(pn532_i2c);
Preferences prefs;

// FreeRTOS Handles
TaskHandle_t NetworkTaskHandle = NULL;

// --- ESP-NOW Configuration ---
typedef struct struct_message {
    char command[16];
} struct_message;

uint8_t watchmanMac[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF}; 

// State
bool isWifiConnected = false;
String hardwareToken = "";
unsigned long lastWhitelistSync = 0;
unsigned long lastLogSync = 0;
unsigned long lastHeartbeat = 0;
const unsigned long WHITELIST_INTERVAL = 3600000;
const unsigned long LOG_INTERVAL = 30000;
const unsigned long HEARTBEAT_INTERVAL = 60000;

// --- Helper: Wake Node B ---
void wakeWatchman() {
    struct_message msg;
    strcpy(msg.command, "WAKE");
    esp_now_send(watchmanMac, (uint8_t *) &msg, sizeof(msg));
    Serial.println("ESP-NOW: Wake signal sent to Node B");
}

// --- Helper: Open Door ---
void openDoor(String studentId, String method) {
    Serial.printf(">>> ACCESS GRANTED [%s via %s] <<<\n", studentId.c_str(), method.c_str());
    wakeWatchman();
    digitalWrite(STATUS_LED, HIGH);
    digitalWrite(RELAY_PIN, HIGH);
    Storage::appendLog(studentId.c_str(), method.c_str());
    delay(UNLOCK_DURATION);
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(STATUS_LED, LOW);
}

// --- Provisioning & Sync ---
void sendWatchmanHeartbeat() {
    struct_message msg;
    strcpy(msg.command, "HEARTBEAT");
    esp_now_send(watchmanMac, (uint8_t *) &msg, sizeof(msg));
}

void registerDevice() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    Serial.println("Registering device with Convex...");
    HTTPClient http;
    http.begin(String(CONVEX_URL) + "/api/register");
    http.addHeader("Content-Type", "application/json");
    
    JsonDocument req;
    req["chipId"] = WiFi.macAddress(); // Use MAC as unique ID
    String body;
    serializeJson(req, body);
    
    int httpCode = http.POST(body);
    if (httpCode == HTTP_CODE_OK) {
        JsonDocument res;
        deserializeJson(res, http.getString());
        if (res["status"] == "registered") {
            hardwareToken = res["token"].as<String>();
            prefs.begin("auth", false);
            prefs.putString("token", hardwareToken);
            prefs.end();
            Serial.println("Device registered and token saved.");
        }
    }
    http.end();
}

void syncLogs() {
    if (hardwareToken == "" || WiFi.status() != WL_CONNECTED) return;
    int count = Storage::getLogCount();
    if (count == 0) return;

    File file = LittleFS.open("/logs.bin", FILE_READ);
    if (!file) return;

    JsonDocument doc;
    doc["chipId"] = WiFi.macAddress();
    doc["token"] = hardwareToken;
    JsonArray logsArr = doc["logs"].to<JsonArray>();

    while (file.available()) {
        AccessLog log;
        file.read((uint8_t*)&log, sizeof(AccessLog));
        JsonObject logObj = logsArr.add<JsonObject>();
        logObj["userId"] = log.userId;
        logObj["method"] = String(log.method) == "CARD" ? "card" : "phone";
        logObj["action"] = "OPEN_GATE";
        logObj["result"] = "success";
        logObj["timestamp"] = log.timestamp;
        logObj["timestampType"] = "local";
    }
    file.close();

    HTTPClient http;
    http.begin(String(CONVEX_URL) + "/api/logs");
    http.addHeader("Content-Type", "application/json");
    String body;
    serializeJson(doc, body);
    if (http.POST(body) == HTTP_CODE_OK) {
        Storage::clearLogs();
        Serial.println("Logs synced.");
    }
    http.end();
}

void syncWhitelist() {
    if (hardwareToken == "" || WiFi.status() != WL_CONNECTED) return;
    HTTPClient http;
    String url = String(CONVEX_URL) + "/api/whitelist?chipId=" + WiFi.macAddress() + "&token=" + hardwareToken;
    http.begin(url);
    if (http.GET() == HTTP_CODE_OK) {
        JsonDocument res;
        deserializeJson(res, http.getString());
        JsonArray entries = res["entries"];
        if (!entries.isNull()) {
            prefs.begin("whitelist", false);
            for (JsonObject entry : entries) {
                prefs.putString(entry["uid"], entry["sid"].as<const char*>());
            }
            prefs.end();
            Serial.println("Whitelist synced.");
        }
    }
    http.end();
}

void sendHeartbeat() {
    if (hardwareToken == "" || WiFi.status() != WL_CONNECTED) return;
    HTTPClient http;
    http.begin(String(CONVEX_URL) + "/api/heartbeat");
    http.addHeader("Content-Type", "application/json");
    JsonDocument doc;
    doc["chipId"] = WiFi.macAddress();
    doc["token"] = hardwareToken;
    doc["firmware"] = "1.0.0-polished";
    String body;
    serializeJson(doc, body);
    http.POST(body);
    http.end();
}

void NetworkTask(void *pvParameters) {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    for (;;) {
        if (WiFi.status() == WL_CONNECTED) {
            if (!isWifiConnected) {
                isWifiConnected = true;
                if (hardwareToken == "") registerDevice();
                syncWhitelist();
            }
            if (millis() - lastWhitelistSync > WHITELIST_INTERVAL) { syncWhitelist(); lastWhitelistSync = millis(); }
            if (millis() - lastLogSync > LOG_INTERVAL) { syncLogs(); lastLogSync = millis(); }
            if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) { 
                sendHeartbeat(); 
                sendWatchmanHeartbeat(); // Sync Node B
                lastHeartbeat = millis(); 
            }
        } else { isWifiConnected = false; }
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(STATUS_LED, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);
    
    Storage::begin();
    
    // Load Token
    prefs.begin("auth", true);
    hardwareToken = prefs.getString("token", "");
    prefs.end();

    // Init NFC
    nfc.begin();
    if (!nfc.getFirmwareVersion()) { Serial.println("PN532 Fail"); while(1); }
    nfc.SAMConfig();

    // Init ESP-NOW
    WiFi.mode(WIFI_STA);
    Serial.print("Device MAC: "); Serial.println(WiFi.macAddress());
    if (esp_now_init() == ESP_OK) {
        esp_now_peer_info_t peerInfo = {};
        memcpy(peerInfo.peer_addr, watchmanMac, 6);
        esp_now_add_peer(&peerInfo);
    }

    xTaskCreatePinnedToCore(NetworkTask, "NetTask", 10240, NULL, 1, &NetworkTaskHandle, 0);
}

void loop() {
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
    uint8_t uidLength;

    // --- Mode 1: Poll for Cards ---
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 200)) {
        String cardUID = "";
        for (uint8_t i = 0; i < uidLength; i++) {
            if (uid[i] < 0x10) cardUID += "0";
            cardUID += String(uid[i], HEX);
        }
        cardUID.toUpperCase();
        
        prefs.begin("whitelist", true);
        if (prefs.isKey(cardUID.c_str())) {
            String sid = prefs.getString(cardUID.c_str());
            prefs.end();
            openDoor(sid, "CARD");
        } else {
            prefs.end();
            Serial.println("Denied");
        }
        delay(1000);
    }

    // --- Mode 2: Listen for Phone (Target Mode) ---
    // Note: Simple implementation, requires the PN532 to switch roles.
    // For now, sticking to Reader Mode as most reliable for basic PN532 libs.
    // If phone acts as a Tag (Android), readPassiveTargetID works.
    // For iPhone (Writer), we would need tgInitAsTarget which often blocks.
    
    vTaskDelay(pdMS_TO_TICKS(100));
}
