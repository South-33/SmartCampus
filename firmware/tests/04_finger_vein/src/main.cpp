/**
 * Waveshare Finger Vein Sensor Test
 * ==================================
 * 
 * This test uses the ACTUAL FingerVeinAuth driver from the Gatekeeper firmware.
 * No code duplication - tests the real production code.
 * 
 * CRITICAL: THIS SENSOR IS 3.3V ONLY!
 * Connecting 5V WILL DESTROY the sensor!
 * 
 * WIRING:
 *   VEIN     ->   ESP32
 *   VCC      ->   3V3 (NOT VIN/5V!)
 *   GND      ->   GND
 *   TXD      ->   GPIO16 (ESP32 RX)
 *   RXD      ->   GPIO17 (ESP32 TX)
 * 
 * COMMANDS (type in Serial Monitor):
 *   1 = Check sensor alive (WHO_AM_I)
 *   2 = Get template count
 *   3 = Verify finger (identify)
 *   4 = Enroll new finger (ID 1)
 *   5 = Delete all templates
 *   ? = Show menu
 */

#include <Arduino.h>
#include "FingerVeinAuth.h"  // From Gatekeeper firmware

// ESP32 doesn't define LED_BUILTIN by default
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

HardwareSerial VeinSerial(2);

void printMenu() {
    Serial.println();
    Serial.println(F("╔════════════════════════════════════════╗"));
    Serial.println(F("║       FINGER VEIN SENSOR COMMANDS      ║"));
    Serial.println(F("╠════════════════════════════════════════╣"));
    Serial.println(F("║  1 = Check sensor alive                ║"));
    Serial.println(F("║  2 = Get template count                ║"));
    Serial.println(F("║  3 = Verify finger (identify)          ║"));
    Serial.println(F("║  4 = Enroll new finger (ID 1)          ║"));
    Serial.println(F("║  5 = Delete all templates              ║"));
    Serial.println(F("║  c = Cancel ongoing enrollment         ║"));
    Serial.println(F("║  ? = Show this menu                    ║"));
    Serial.println(F("╚════════════════════════════════════════╝"));
    Serial.println();
}

bool sensorReady = false;

void setup() {
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);
    delay(1000);
    
    Serial.println();
    Serial.println(F("╔════════════════════════════════════════╗"));
    Serial.println(F("║   FINGER VEIN SENSOR TEST              ║"));
    Serial.println(F("║   Using Production FingerVeinAuth      ║"));
    Serial.println(F("╚════════════════════════════════════════╝"));
    Serial.println();
    
    Serial.println(F("⚠️  CRITICAL: Sensor must be powered by 3.3V!"));
    Serial.println(F("   Using 5V will DESTROY the sensor!"));
    Serial.println();
    
    Serial.println(F("Initializing FingerVeinAuth module..."));
    
    // Use the actual production driver
    if (FingerVeinAuth::begin(VeinSerial, VEIN_RX_PIN, VEIN_TX_PIN)) {
        sensorReady = true;
        Serial.println(F("╔════════════════════════════════════════╗"));
        Serial.println(F("║   ✓ SENSOR INITIALIZED!                ║"));
        Serial.println(F("╚════════════════════════════════════════╝"));
        Serial.println();
        
        // Get template count
        int count = FingerVeinAuth::getTemplateCount();
        if (count >= 0) {
            Serial.print(F("  Enrolled templates: "));
            Serial.println(count);
        }
        
        printMenu();
    } else {
        Serial.println(F("╔════════════════════════════════════════╗"));
        Serial.println(F("║   ❌ SENSOR NOT RESPONDING!            ║"));
        Serial.println(F("╚════════════════════════════════════════╝"));
        Serial.println();
        Serial.println(F("Troubleshooting:"));
        Serial.println(F("  1. CHECK VOLTAGE: Must be 3.3V, NOT 5V!"));
        Serial.println(F("  2. Sensor TXD -> ESP32 GPIO16"));
        Serial.println(F("  3. Sensor RXD -> ESP32 GPIO17"));
        Serial.println(F("  4. Check for green LED inside sensor"));
        Serial.println();
        Serial.println(F("Will keep retrying every 5 seconds..."));
    }
}

bool enrolling = false;

void loop() {
    // Heartbeat LED
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 500) {
        lastBlink = millis();
        digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    }
    
    // Handle ongoing enrollment
    if (enrolling) {
        FingerVeinAuth::Result result = FingerVeinAuth::enroll(1);
        switch (result) {
            case FingerVeinAuth::SUCCESS:
                Serial.println(F("✓ Enrollment complete!"));
                enrolling = false;
                break;
            case FingerVeinAuth::STEP_COMPLETE:
                Serial.print(F("  Step "));
                Serial.print(FingerVeinAuth::getEnrollStep());
                Serial.println(F("/4 complete. Place finger again..."));
                break;
            case FingerVeinAuth::WAITING_FOR_FINGER:
                // Still waiting, do nothing
                break;
            case FingerVeinAuth::TIMEOUT:
                Serial.println(F("✗ Enrollment timeout"));
                enrolling = false;
                break;
            case FingerVeinAuth::SENSOR_ERROR:
                Serial.println(F("✗ Sensor error during enrollment"));
                enrolling = false;
                break;
            default:
                break;
        }
        delay(100);
        return;
    }
    
    // Handle serial commands
    if (Serial.available()) {
        char cmd = Serial.read();
        
        switch (cmd) {
            case '1': {
                Serial.println(F("\n[CMD] Checking sensor alive..."));
                if (FingerVeinAuth::isAlive()) {
                    Serial.println(F("✓ Sensor is responding"));
                } else {
                    Serial.println(F("✗ No response from sensor"));
                }
                break;
            }
            
            case '2': {
                Serial.println(F("\n[CMD] Getting template count..."));
                int count = FingerVeinAuth::getTemplateCount();
                if (count >= 0) {
                    Serial.print(F("  Enrolled templates: "));
                    Serial.println(count);
                } else {
                    Serial.println(F("✗ Failed to get count"));
                }
                break;
            }
            
            case '3': {
                Serial.println(F("\n[CMD] Verifying finger..."));
                Serial.println(F("Place your finger on the sensor..."));
                int userId = FingerVeinAuth::verify();
                if (userId >= 0) {
                    Serial.print(F("✓ Finger matched! User ID: "));
                    Serial.println(userId);
                } else {
                    Serial.println(F("✗ Finger not recognized"));
                }
                break;
            }
            
            case '4': {
                Serial.println(F("\n[CMD] Starting enrollment for ID 1..."));
                Serial.println(F("You will need to place your finger 3 times."));
                Serial.println(F("Place finger now (1/3)..."));
                enrolling = true;
                break;
            }
            
            case '5': {
                Serial.println(F("\n[CMD] Deleting all templates..."));
                if (FingerVeinAuth::clearAll()) {
                    Serial.println(F("✓ All templates deleted"));
                } else {
                    Serial.println(F("✗ Delete failed"));
                }
                break;
            }
            
            case 'c':
            case 'C': {
                if (enrolling) {
                    FingerVeinAuth::cancelEnroll();
                    enrolling = false;
                    Serial.println(F("Enrollment cancelled"));
                }
                break;
            }
            
            case '?':
            case 'h':
            case 'H':
                printMenu();
                break;
                
            case '\n':
            case '\r':
                break;
                
            default:
                Serial.print(F("Unknown command: "));
                Serial.println(cmd);
                printMenu();
                break;
        }
    }
    
    // Retry initialization if failed
    static unsigned long lastRetry = 0;
    if (!sensorReady && millis() - lastRetry > 5000) {
        lastRetry = millis();
        Serial.println(F("\nRetrying sensor init..."));
        if (FingerVeinAuth::begin(VeinSerial, VEIN_RX_PIN, VEIN_TX_PIN)) {
            sensorReady = true;
            Serial.println(F("✓ Sensor now responding!"));
            printMenu();
        } else {
            Serial.println(F("✗ Still no response"));
        }
    }
}
