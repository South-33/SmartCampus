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
#define PN532_SDA 21
#define PN532_SCL 22
#define RELAY_PIN 25
#define STATUS_LED 2

// =============================================================================
// BIOMETRIC UART PINS
// =============================================================================
#define VEIN_RX_PIN 16
#define VEIN_TX_PIN 17
#define VEIN_BAUD 57600

#define FACE_RX_PIN 4
#define FACE_TX_PIN 5
#define FACE_BAUD 115200

// =============================================================================
// ROOM CONFIGURATION
// =============================================================================
#define DEFAULT_ROOM_ID "ROOM_001"
#define ROOM_ID_MAX_LEN 15  // Max chars (16 byte buffer - 1 for null)

// =============================================================================
// NETWORK CONFIGURATION
// Note: Credentials are stored in NVS, not hardcoded. 
// Use serial commands to configure:
//   WIFI:SSID:password
//   CONVEX:https://your-deployment.convex.site
// =============================================================================

// Default Convex URL (can be overridden via NVS)
#define DEFAULT_CONVEX_URL "https://your-deployment.convex.site"

// =============================================================================
// TIMING CONSTANTS
// =============================================================================
#define UNLOCK_DURATION_MS      5000    // Door unlock duration
#define BIOMETRIC_TIMEOUT_MS    10000   // Max time to wait for biometric
#define WHITELIST_SYNC_INTERVAL 3600000 // 1 hour
#define LOG_SYNC_INTERVAL       30000   // 30 seconds
#define HEARTBEAT_INTERVAL      60000   // 1 minute
#define BEACON_INTERVAL_MS      2000    // ESP-NOW beacon interval
#define HEARTBEAT_TIMEOUT_MS    15000   // Consider disconnected after this
#define HTTP_TIMEOUT_MS         10000   // HTTP request timeout
#define WIFI_CONNECT_TIMEOUT_MS 30000   // WiFi connection timeout

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================
#define MIN_VALID_EPOCH         1600000000  // Sept 2020 - sanity check for NTP
#define MAX_LOG_FILE_SIZE       (100 * 1024) // 100KB max log file
#define ESP_NOW_PMK             "SchoolNFC_PMK01"  // Primary Master Key (16 chars)

// =============================================================================
// ESP-NOW ENCRYPTION
// Local Master Key for paired devices (derived from room ID + shared secret)
// In production, this should be unique per room and stored securely
// =============================================================================
#define ESP_NOW_SHARED_SECRET   "SchoolNFC2024!@#"

// =============================================================================
// TLS CERTIFICATE
// ISRG Root X1 - Let's Encrypt Root CA (valid until 2035)
// This covers Convex and most modern HTTPS services
// =============================================================================
static const char* ROOT_CA_CERT PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

// =============================================================================
// DEBUG MODE
// Set to false in production to disable verbose logging
// =============================================================================
#define DEBUG_MODE true
#define TEST_MODE false

// Debug print macro
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
