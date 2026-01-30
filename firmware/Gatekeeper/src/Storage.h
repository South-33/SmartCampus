#ifndef STORAGE_H
#define STORAGE_H

#include <Arduino.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

struct AccessLog {
    uint32_t timestamp;
    char userId[30];
    char method[10]; // "CARD" or "PHONE"
};

class Storage {
public:
    static bool begin() {
        if (!LittleFS.begin(true)) {
            Serial.println("LittleFS Mount Failed");
            return false;
        }
        return true;
    }

    static void appendLog(const char* userId, const char* method, uint32_t timestamp) {
        File file = LittleFS.open("/logs.bin", FILE_APPEND);
        if (!file) {
            Serial.println("Failed to open log file for appending");
            return;
        }

        AccessLog log;
        log.timestamp = timestamp;
        strncpy(log.userId, userId, 30);
        strncpy(log.method, method, 10);

        file.write((const uint8_t*)&log, sizeof(AccessLog));
        file.close();
        Serial.println("Log saved to flash.");
    }

    static int getLogCount() {
        File file = LittleFS.open("/logs.bin", FILE_READ);
        if (!file) return 0;
        int count = file.size() / sizeof(AccessLog);
        file.close();
        return count;
    }

    static void clearLogs() {
        LittleFS.remove("/logs.bin");
    }
};

#endif
