/**
 * LD2410C Radar Sensor Test
 * ==========================
 * 
 * PURPOSE: Verify radar sensor is wired correctly and detecting presence
 * 
 * ⚠️ CRITICAL: THIS SENSOR REQUIRES 5V!
 *    It will NOT work on 3.3V!
 * 
 * WIRING:
 *   RADAR    →   ESP32
 *   ─────────────────────
 *   VCC      →   VIN (5V)
 *   GND      →   GND
 *   TX       →   GPIO16 (ESP32 RX)
 *   RX       →   GPIO17 (ESP32 TX)
 * 
 * EXPECTED OUTPUT:
 *   - Firmware version displayed
 *   - "PRESENCE DETECTED" when you walk near
 *   - Distance readings in cm
 * 
 * TROUBLESHOOTING:
 *   - No response: Check VCC is 5V (not 3.3V!)
 *   - No detection: Make sure nothing is blocking the sensor
 */

#include <Arduino.h>
#include <ld2410.h>

// UART2 pins
#define RADAR_RX 16
#define RADAR_TX 17
#define RADAR_BAUD 256000

ld2410 radar;
HardwareSerial RadarSerial(2);

void printTroubleshooting() {
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║         TROUBLESHOOTING GUIDE          ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    Serial.println("1. CHECK VOLTAGE:");
    Serial.println("   LD2410C REQUIRES 5V power!");
    Serial.println("   Use VIN, NOT 3V3!");
    Serial.println();
    Serial.println("2. CHECK WIRING:");
    Serial.println("   RADAR VCC → ESP32 VIN (5V)");
    Serial.println("   RADAR GND → ESP32 GND");
    Serial.println("   RADAR TX  → ESP32 GPIO16 (RX2)");
    Serial.println("   RADAR RX  → ESP32 GPIO17 (TX2)");
    Serial.println();
    Serial.println("3. CHECK BAUD RATE:");
    Serial.println("   LD2410C uses 256000 baud (unusual!)");
    Serial.println("   This is handled automatically by the library.");
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║     LD2410C RADAR SENSOR TEST v1.0     ║");
    Serial.println("║     SchoolNFC Hardware Testing         ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    Serial.println("⚠️  REMINDER: Sensor must be powered by 5V!");
    Serial.println("   Using 3.3V will NOT work!");
    Serial.println();
    
    // Initialize UART2 at 256000 baud
    Serial.println("Initializing UART2 at 256000 baud...");
    RadarSerial.begin(RADAR_BAUD, SERIAL_8N1, RADAR_RX, RADAR_TX);
    delay(100);
    
    Serial.println("Connecting to LD2410C radar...");
    
    if (radar.begin(RadarSerial)) {
        Serial.println();
        Serial.println("╔════════════════════════════════════════╗");
        Serial.println("║   ✓ RADAR CONNECTED!                   ║");
        Serial.println("╚════════════════════════════════════════╝");
        Serial.println();
        
        // Print firmware version
        Serial.print("  Firmware Version: ");
        Serial.print(radar.firmware_major_version);
        Serial.print(".");
        Serial.print(radar.firmware_minor_version);
        Serial.print(".");
        Serial.println(radar.firmware_bugfix_version, HEX);
        Serial.println();
        
        Serial.println("═══════════════════════════════════════════");
        Serial.println();
        Serial.println("  Radar is now monitoring...");
        Serial.println("  Walk around in front of the sensor!");
        Serial.println("  Detection range: 0 - 5 meters");
        Serial.println();
        Serial.println("═══════════════════════════════════════════");
        Serial.println();
        
    } else {
        Serial.println();
        Serial.println("╔════════════════════════════════════════╗");
        Serial.println("║   ❌ RADAR NOT FOUND!                  ║");
        Serial.println("╚════════════════════════════════════════╝");
        
        printTroubleshooting();
        
        Serial.println("Halting. Fix the issue and reset.");
        while (1) { delay(1000); }
    }
}

void loop() {
    radar.read();
    
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 500) {
        lastPrint = millis();
        
        if (radar.presenceDetected()) {
            Serial.print("█ PRESENCE | ");
            
            if (radar.movingTargetDetected()) {
                Serial.print("Moving: ");
                Serial.print(radar.movingTargetDistance());
                Serial.print("cm (");
                Serial.print(radar.movingTargetEnergy());
                Serial.print("%) ");
            }
            
            if (radar.stationaryTargetDetected()) {
                Serial.print("Still: ");
                Serial.print(radar.stationaryTargetDistance());
                Serial.print("cm (");
                Serial.print(radar.stationaryTargetEnergy());
                Serial.print("%) ");
            }
            
            Serial.println();
        } else {
            Serial.println("░ No presence detected");
        }
    }
}
