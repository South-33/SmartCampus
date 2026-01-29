#ifndef NTP_SYNC_H
#define NTP_SYNC_H

#include <Arduino.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

/**
 * NTPSync handles time synchronization for the ESP32.
 * This ensures that logs stored offline have accurate timestamps.
 */
class NTPSync {
  private:
    static WiFiUDP ntpUDP;
    static NTPClient timeClient;
    static bool _initialized;

  public:
    /**
     * Initializes the NTP client. Should be called after WiFi is connected.
     */
    static void begin() {
      if (!_initialized) {
        timeClient.begin();
        // Time zone offset: Cambodia/Thailand is UTC+7 (7 * 3600 seconds)
        timeClient.setTimeOffset(25200);
        _initialized = true;
      }
    }

    /**
     * Force a sync with the NTP server.
     * Returns true if successful.
     */
    static bool update() {
      if (!_initialized) return false;
      return timeClient.update();
    }

    /**
     * Returns the current Epoch time (seconds since Jan 01 1970).
     */
    static uint32_t getEpochTime() {
      if (!_initialized) return 0;
      return timeClient.getEpochTime();
    }

    /**
     * Returns true if the time has been synchronized at least once.
     */
    static bool isTimeValid() {
      // NTPClient considers time valid if year > 1970 (epoch > 0)
      return _initialized && timeClient.getEpochTime() > 0;
    }

    /**
     * Formats the current time as a readable string.
     */
    static String getFormattedTime() {
      if (!_initialized) return "N/A";
      return timeClient.getFormattedTime();
    }
};

// Define static members
WiFiUDP NTPSync::ntpUDP;
NTPClient NTPSync::timeClient(NTPSync::ntpUDP, "pool.ntp.org");
bool NTPSync::_initialized = false;

#endif
