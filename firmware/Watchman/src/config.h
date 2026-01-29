#ifndef CONFIG_H
#define CONFIG_H

// --- Hardware Pins ---
#define RADAR_RX 16
#define RADAR_TX 17
#define RELAY_PIN 5
#define STATUS_LED 2

// --- Energy Logic ---
#define GRACE_PERIOD_MS 600000 // 10 minutes of "Looking for movement" before Standby
#define STANDBY_DELAY_MS 300000 // 5 minutes of "Absolute silence" before cutoff
// Total = 15 minutes as per README

#endif
