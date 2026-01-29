#ifndef CONFIG_H
#define CONFIG_H

// --- Hardware Pins ---
#define PN532_SDA 21
#define PN532_SCL 22
#define RELAY_PIN 5
#define STATUS_LED 2

// --- WiFi Configuration (Placeholders) ---
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASS "YOUR_WIFI_PASSWORD"

// --- Convex Backend ---
#define CONVEX_URL "https://your-deployment.convex.site"
#define DEVICE_CHIP_ID "ESP32_GATEKEEPER_01" // Should be dynamic in production

// --- Access Settings ---
#define UNLOCK_DURATION 5000 // 5 seconds

#endif
