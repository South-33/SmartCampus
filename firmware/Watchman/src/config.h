#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =============================================================================
// FIRMWARE VERSION
// =============================================================================
#define FIRMWARE_VERSION "2.0.0"

// =============================================================================
// HARDWARE PINS
// =============================================================================
#define RADAR_RX 16
#define RADAR_TX 17
#define RADAR_BAUD 256000

#define RELAY_PIN 26
#define STATUS_LED 2

// =============================================================================
// ROOM CONFIGURATION
// =============================================================================
#define DEFAULT_ROOM_ID "ROOM_001"
#define ROOM_ID_MAX_LEN 15

// =============================================================================
// TIMING CONSTANTS
// =============================================================================
#define GRACE_PERIOD_MS     300000  // 5 minutes
#define STANDBY_DELAY_MS    60000   // 1 minute additional before cutting power
#define BEACON_INTERVAL_MS  2000    // ESP-NOW beacon interval when not paired
#define HEARTBEAT_TIMEOUT_MS 15000  // Consider disconnected after this

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================
#define ESP_NOW_SHARED_SECRET   "SchoolNFC2024!@#"

// =============================================================================
// DEBUG MODE
// =============================================================================
#define DEBUG_MODE true

#if DEBUG_MODE
    #define DEBUG_PRINT(x) Serial.print(x)
    #define DEBUG_PRINTLN(x) Serial.println(x)
    #define DEBUG_PRINTF(...) Serial.printf(__VA_ARGS__)
#else
    #define DEBUG_PRINT(x)
    #define DEBUG_PRINTLN(x)
    #define DEBUG_PRINTF(...)
#endif

#endif // CONFIG_H
