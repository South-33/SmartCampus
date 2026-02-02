#ifndef NTP_SYNC_H
#define NTP_SYNC_H

#include <Arduino.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include "config.h"

// =============================================================================
// NTP TIME SYNCHRONIZATION
// Features:
// - Configurable timezone offset
// - Proper epoch validation (not just > 0)
// - Retry logic for sync failures
// =============================================================================

class NTPSync {
private:
    static WiFiUDP ntpUDP;
    static NTPClient timeClient;
    static bool _initialized;
    static bool _synced;
    static int _syncRetries;

public:
    // Initialize NTP client. Call after WiFi is connected.
    static void begin() {
        if (!_initialized) {
            timeClient.begin();
            // Cambodia/Thailand: UTC+7 (7 * 3600 = 25200 seconds)
            // TODO: Make configurable via NVS
            timeClient.setTimeOffset(25200);
            _initialized = true;
            _synced = false;
            _syncRetries = 0;
            DEBUG_PRINTLN("[NTP] Client initialized");
        }
    }

    // Force sync with NTP server
    static bool update() {
        if (!_initialized) return false;
        
        bool success = timeClient.update();
        if (success) {
            // Validate the received time
            unsigned long epoch = timeClient.getEpochTime();
            if (epoch > MIN_VALID_EPOCH) {
                if (!_synced) {
                    DEBUG_PRINTF("[NTP] Synced: %s (epoch: %lu)\n", 
                        timeClient.getFormattedTime().c_str(), epoch);
                }
                _synced = true;
                _syncRetries = 0;
                return true;
            } else {
                DEBUG_PRINTF("[NTP] Invalid epoch: %lu\n", epoch);
            }
        } else {
            _syncRetries++;
            if (_syncRetries % 10 == 0) {  // Log every 10 failures
                DEBUG_PRINTF("[NTP] Sync failed (attempt %d)\n", _syncRetries);
            }
        }
        return false;
    }

    // Get current epoch time (seconds since 1970)
    static uint32_t getEpochTime() {
        if (!_initialized || !_synced) return 0;
        return timeClient.getEpochTime();
    }

    // Check if time is valid and synced
    static bool isTimeValid() {
        if (!_initialized || !_synced) return false;
        unsigned long epoch = timeClient.getEpochTime();
        return epoch > MIN_VALID_EPOCH;
    }

    // Get formatted time string (HH:MM:SS)
    static String getFormattedTime() {
        if (!_initialized || !_synced) return "N/A";
        return timeClient.getFormattedTime();
    }

    // Get formatted date-time string
    static String getFormattedDateTime() {
        if (!_initialized || !_synced) return "N/A";
        
        unsigned long epoch = timeClient.getEpochTime();
        time_t rawtime = (time_t)epoch;
        struct tm* ti = localtime(&rawtime);
        
        char buffer[25];
        snprintf(buffer, sizeof(buffer), "%04d-%02d-%02d %02d:%02d:%02d",
            ti->tm_year + 1900, ti->tm_mon + 1, ti->tm_mday,
            ti->tm_hour, ti->tm_min, ti->tm_sec);
        
        return String(buffer);
    }

    // Set timezone offset in hours (e.g., 7 for UTC+7)
    static void setTimezoneOffset(int hours) {
        if (_initialized) {
            timeClient.setTimeOffset(hours * 3600);
            DEBUG_PRINTF("[NTP] Timezone set to UTC%+d\n", hours);
        }
    }

    // Check if initialized
    static bool isInitialized() { return _initialized; }
    
    // Check if synced at least once
    static bool isSynced() { return _synced; }
};

// Static member definitions
inline WiFiUDP NTPSync::ntpUDP;
inline NTPClient NTPSync::timeClient(NTPSync::ntpUDP, "pool.ntp.org");
inline bool NTPSync::_initialized = false;
inline bool NTPSync::_synced = false;
inline int NTPSync::_syncRetries = 0;

#endif // NTP_SYNC_H
