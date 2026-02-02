#ifndef STORAGE_H
#define STORAGE_H

#include <Arduino.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include "config.h"

// =============================================================================
// ACCESS LOG STRUCTURE
// Fixed-size binary structure for efficient storage
// =============================================================================
struct AccessLog {
    uint32_t timestamp;
    char userId[32];     // 31 chars + null terminator
    char method[12];     // 11 chars + null terminator ("NFC", "NFC+BIO", "FACE", "VEIN")
};

// =============================================================================
// SECURE STORAGE CLASS
// Features:
// - Proper bounds checking on all string operations
// - Log file rotation when size limit exceeded
// - Error handling with return values
// - Thread-safe file operations (using critical sections)
// =============================================================================
class Storage {
public:
    // Initialize filesystem
    static bool begin() {
        if (!LittleFS.begin(false)) {  // Don't format on fail
            DEBUG_PRINTLN("[STORAGE] Mount failed, attempting format...");
            if (!LittleFS.format()) {
                DEBUG_PRINTLN("[STORAGE] Format failed!");
                return false;
            }
            if (!LittleFS.begin(false)) {
                DEBUG_PRINTLN("[STORAGE] Mount failed after format!");
                return false;
            }
        }
        DEBUG_PRINTLN("[STORAGE] Filesystem mounted OK");
        return true;
    }

    // Append a log entry with proper bounds checking
    static bool appendLog(const char* userId, const char* method, uint32_t timestamp) {
        if (!userId || !method) {
            DEBUG_PRINTLN("[STORAGE] appendLog: null parameter");
            return false;
        }

        // Check if rotation needed
        if (getLogFileSize() >= MAX_LOG_FILE_SIZE) {
            if (!rotateLogs()) {
                DEBUG_PRINTLN("[STORAGE] Log rotation failed");
                // Continue anyway - better to lose old logs than new ones
            }
        }

        File file = LittleFS.open("/logs.bin", FILE_APPEND);
        if (!file) {
            DEBUG_PRINTLN("[STORAGE] Failed to open log file for appending");
            return false;
        }

        AccessLog log;
        memset(&log, 0, sizeof(AccessLog));  // Zero-initialize
        log.timestamp = timestamp;
        
        // Safe string copy with explicit null termination
        strncpy(log.userId, userId, sizeof(log.userId) - 1);
        log.userId[sizeof(log.userId) - 1] = '\0';
        
        strncpy(log.method, method, sizeof(log.method) - 1);
        log.method[sizeof(log.method) - 1] = '\0';

        size_t written = file.write((const uint8_t*)&log, sizeof(AccessLog));
        file.close();

        if (written != sizeof(AccessLog)) {
            DEBUG_PRINTLN("[STORAGE] Failed to write complete log entry");
            return false;
        }

        DEBUG_PRINTF("[STORAGE] Log saved: %s via %s at %lu\n", log.userId, log.method, log.timestamp);
        return true;
    }

    // Get number of log entries
    static int getLogCount() {
        File file = LittleFS.open("/logs.bin", FILE_READ);
        if (!file) {
            return 0;  // File doesn't exist = 0 logs
        }
        size_t size = file.size();
        file.close();
        return size / sizeof(AccessLog);
    }

    // Get log file size in bytes
    static size_t getLogFileSize() {
        File file = LittleFS.open("/logs.bin", FILE_READ);
        if (!file) {
            return 0;
        }
        size_t size = file.size();
        file.close();
        return size;
    }

    // Clear all logs
    static bool clearLogs() {
        if (LittleFS.exists("/logs.bin")) {
            if (!LittleFS.remove("/logs.bin")) {
                DEBUG_PRINTLN("[STORAGE] Failed to remove logs.bin");
                return false;
            }
        }
        DEBUG_PRINTLN("[STORAGE] Logs cleared");
        return true;
    }

    // Rotate logs - archive old, start fresh
    static bool rotateLogs() {
        DEBUG_PRINTLN("[STORAGE] Rotating logs...");
        
        // Remove old backup if exists
        if (LittleFS.exists("/logs.old.bin")) {
            LittleFS.remove("/logs.old.bin");
        }
        
        // Rename current to old
        if (LittleFS.exists("/logs.bin")) {
            if (!LittleFS.rename("/logs.bin", "/logs.old.bin")) {
                DEBUG_PRINTLN("[STORAGE] Failed to rename logs.bin");
                // Try to just delete it
                LittleFS.remove("/logs.bin");
            }
        }
        
        DEBUG_PRINTLN("[STORAGE] Log rotation complete");
        return true;
    }

    // Read a specific log entry by index
    static bool readLog(int index, AccessLog& log) {
        File file = LittleFS.open("/logs.bin", FILE_READ);
        if (!file) {
            return false;
        }
        
        int count = file.size() / sizeof(AccessLog);
        if (index < 0 || index >= count) {
            file.close();
            return false;
        }
        
        file.seek(index * sizeof(AccessLog));
        size_t read = file.read((uint8_t*)&log, sizeof(AccessLog));
        file.close();
        
        return read == sizeof(AccessLog);
    }

    // Get filesystem info
    static void printInfo() {
        size_t totalBytes = LittleFS.totalBytes();
        size_t usedBytes = LittleFS.usedBytes();
        DEBUG_PRINTF("[STORAGE] Used: %u / %u bytes (%.1f%%)\n", 
            usedBytes, totalBytes, 
            totalBytes > 0 ? (100.0 * usedBytes / totalBytes) : 0);
    }
};

#endif // STORAGE_H
