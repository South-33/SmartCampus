/**
 * HLK-TX510 Face Recognition Test
 * ================================
 * 
 * This test uses the ACTUAL FaceAuth driver from the Gatekeeper firmware.
 * No code duplication - tests the real production code.
 * 
 * WIRING:
 *   TX510    ->   ESP32
 *   VCC      ->   External 5V (USB-C Breakout, NOT ESP32 VIN)
 *   GND      ->   Common GND (shared with ESP32)
 *   TX (38)  ->   GPIO4 (ESP32 RX)
 *   RX (39)  ->   GPIO5 (ESP32 TX)
 * 
 * COMMANDS (type in Serial Monitor):
 *   1 = Query module info (WHO_AM_I check)
 *   2 = Start face recognition
 *   3 = Enroll new face (ID 1)
 *   4 = Delete all faces
 *   ? = Show menu
 */

#include <Arduino.h>
#include "FaceAuth.h"  // From Gatekeeper firmware

// ESP32 doesn't define LED_BUILTIN by default
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

HardwareSerial FaceSerial(1);

void printMenu() {
    Serial.println();
    Serial.println(F("╔════════════════════════════════════════╗"));
    Serial.println(F("║         FACE MODULE COMMANDS           ║"));
    Serial.println(F("╠════════════════════════════════════════╣"));
    Serial.println(F("║  1 = Query module info                 ║"));
    Serial.println(F("║  2 = Verify face (identify)            ║"));
    Serial.println(F("║  3 = Enroll new face (ID 1)            ║"));
    Serial.println(F("║  4 = Delete all faces                  ║"));
    Serial.println(F("║  ? = Show this menu                    ║"));
    Serial.println(F("╚════════════════════════════════════════╝"));
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);
    delay(1000);
    
    Serial.println();
    Serial.println(F("╔════════════════════════════════════════╗"));
    Serial.println(F("║   HLK-TX510 FACE RECOGNITION TEST      ║"));
    Serial.println(F("║   Using Production FaceAuth Driver     ║"));
    Serial.println(F("╚════════════════════════════════════════╝"));
    Serial.println();
    
    Serial.println(F("Initializing FaceAuth module..."));
    Serial.println(F("(TX510 needs ~2 seconds to boot)"));
    Serial.println();
    
    // Use the actual production driver
    if (FaceAuth::begin(FaceSerial, FACE_RX_PIN, FACE_TX_PIN)) {
        Serial.println(F("╔════════════════════════════════════════╗"));
        Serial.println(F("║   ✓ FACE MODULE INITIALIZED!           ║"));
        Serial.println(F("╚════════════════════════════════════════╝"));
        Serial.println();
        Serial.println(F("Module responded to WHO_AM_I query."));
        Serial.println(F("Liveness detection is ENABLED (anti-spoofing)."));
        
        printMenu();
    } else {
        Serial.println(F("╔════════════════════════════════════════╗"));
        Serial.println(F("║   ❌ FACE MODULE NOT RESPONDING!       ║"));
        Serial.println(F("╚════════════════════════════════════════╝"));
        Serial.println();
        Serial.println(F("Troubleshooting:"));
        Serial.println(F("  1. Check TX510 has external 5V power (800mA needed)"));
        Serial.println(F("  2. Check GND is shared between TX510 and ESP32"));
        Serial.println(F("  3. Check TX510 TX(38) -> ESP32 GPIO4"));
        Serial.println(F("  4. Check TX510 RX(39) -> ESP32 GPIO5"));
        Serial.println(F("  5. Look for TX510 LCD screen showing boot"));
        Serial.println();
        Serial.println(F("Will keep retrying every 5 seconds..."));
    }
}

void loop() {
    // Heartbeat LED
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 500) {
        lastBlink = millis();
        digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    }
    
    // Handle serial commands
    if (Serial.available()) {
        char cmd = Serial.read();
        
        switch (cmd) {
            case '1': {
                Serial.println(F("\n[CMD] Querying module info..."));
                if (FaceAuth::queryModuleInfo()) {
                    Serial.println(F("✓ Module responded successfully"));
                    Serial.print(F("  Last MsgId: 0x"));
                    Serial.println(FaceAuth::getLastMsgId(), HEX);
                } else {
                    Serial.println(F("✗ No response from module"));
                }
                break;
            }
            
            case '2': {
                Serial.println(F("\n[CMD] Starting face verification..."));
                Serial.println(F("Look at the camera..."));
                int userId = FaceAuth::verifyOnce();
                if (userId >= 0) {
                    Serial.print(F("✓ Face recognized! User ID: "));
                    Serial.println(userId);
                } else {
                    Serial.println(F("✗ Face not recognized or timeout"));
                }
                break;
            }
            
            case '3': {
                Serial.println(F("\n[CMD] Starting face enrollment for ID 1..."));
                Serial.println(F("Look at the camera and follow prompts..."));
                if (FaceAuth::startEnroll(1)) {
                    Serial.println(F("Enrollment started. Watch the TX510 LCD."));
                    Serial.println(F("Checking for completion..."));
                    
                    // Poll for completion (in real firmware this would be async)
                    unsigned long start = millis();
                    while (millis() - start < 30000) {
                        if (FaceAuth::isEnrollComplete()) {
                            Serial.println(F("✓ Enrollment complete!"));
                            break;
                        }
                        delay(100);
                    }
                } else {
                    Serial.println(F("✗ Failed to start enrollment"));
                }
                break;
            }
            
            case '4': {
                Serial.println(F("\n[CMD] Deleting all enrolled faces..."));
                if (FaceAuth::reset()) {
                    Serial.println(F("✓ All faces deleted"));
                } else {
                    Serial.println(F("✗ Delete failed"));
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
                // Ignore newlines
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
    if (FaceAuth::getState() == FaceAuth::ERROR && millis() - lastRetry > 5000) {
        lastRetry = millis();
        Serial.println(F("\nRetrying module init..."));
        if (FaceAuth::begin(FaceSerial, FACE_RX_PIN, FACE_TX_PIN)) {
            Serial.println(F("✓ Module now responding!"));
            printMenu();
        } else {
            Serial.println(F("✗ Still no response"));
        }
    }
}
