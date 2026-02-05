/**
 * Waveshare Finger Vein Sensor Test
 * ===================================
 * 
 * PURPOSE: Verify finger vein sensor is wired correctly and responding
 * 
 * ⚠️ CRITICAL: THIS SENSOR IS 3.3V ONLY!
 *    Connecting 5V WILL DESTROY the sensor!
 * 
 * WIRING:
 *   VEIN     →   ESP32
 *   ─────────────────────
 *   VCC      →   3V3 (NOT VIN/5V!)
 *   GND      →   GND
 *   TXD      →   GPIO16 (ESP32 RX)
 *   RXD      →   GPIO17 (ESP32 TX)
 * 
 * EXPECTED OUTPUT:
 *   - "Sensor responding!" with parameters
 *   - Template count (number of enrolled fingers)
 * 
 * TROUBLESHOOTING:
 *   - No response: Check TX/RX are cross-connected correctly
 *   - Still no response: VERIFY voltage is 3.3V with multimeter!
 */

#include <Arduino.h>

// UART2 pins
#define VEIN_RX 16  // ESP32 receives on this pin
#define VEIN_TX 17  // ESP32 transmits on this pin
#define VEIN_BAUD 57600

HardwareSerial VeinSerial(2);

// Response buffer
uint8_t respBuffer[64];
size_t respLen = 0;

// Send command to sensor
bool sendCommand(const uint8_t* data, uint16_t len) {
    uint16_t pkgLen = len + 2;  // Data + checksum
    uint16_t checksum = 0x01 + (pkgLen >> 8) + (pkgLen & 0xFF);
    
    for (uint16_t i = 0; i < len; i++) {
        checksum += data[i];
    }
    
    // Header
    VeinSerial.write(0xEF);
    VeinSerial.write(0x01);
    
    // Address (4 bytes: 0xFFFFFFFF)
    VeinSerial.write(0xFF);
    VeinSerial.write(0xFF);
    VeinSerial.write(0xFF);
    VeinSerial.write(0xFF);
    
    // Package ID (0x01 = command packet)
    VeinSerial.write(0x01);
    
    // Length
    VeinSerial.write((uint8_t)(pkgLen >> 8));
    VeinSerial.write((uint8_t)(pkgLen & 0xFF));
    
    // Data
    VeinSerial.write(data, len);
    
    // Checksum
    VeinSerial.write((uint8_t)(checksum >> 8));
    VeinSerial.write((uint8_t)(checksum & 0xFF));
    
    VeinSerial.flush();
    return true;
}

// Receive response
bool receiveResponse(uint32_t timeout) {
    uint32_t start = millis();
    size_t pos = 0;
    respLen = 0;
    
    while (millis() - start < timeout) {
        while (VeinSerial.available() && pos < sizeof(respBuffer)) {
            respBuffer[pos++] = VeinSerial.read();
            
            if (pos >= 9) {
                // Check header
                if (respBuffer[0] != 0xEF || respBuffer[1] != 0x01) {
                    memmove(respBuffer, respBuffer + 1, pos - 1);
                    pos--;
                    continue;
                }
                
                uint16_t expectedLen = (respBuffer[7] << 8) | respBuffer[8];
                size_t totalExpected = 9 + expectedLen;
                
                if (pos >= totalExpected) {
                    respLen = totalExpected;
                    return true;
                }
            }
        }
        yield();
    }
    return false;
}

void printTroubleshooting() {
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║         TROUBLESHOOTING GUIDE          ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    Serial.println("⚠️  CRITICAL: CHECK VOLTAGE FIRST!");
    Serial.println("   Use multimeter to verify VCC is 3.3V, NOT 5V!");
    Serial.println("   If you connected 5V, sensor may be damaged.");
    Serial.println();
    Serial.println("1. CHECK WIRING:");
    Serial.println("   VEIN VCC → ESP32 3V3 (NOT VIN!)");
    Serial.println("   VEIN GND → ESP32 GND");
    Serial.println("   VEIN TXD → ESP32 GPIO16 (RX2)");
    Serial.println("   VEIN RXD → ESP32 GPIO17 (TX2)");
    Serial.println();
    Serial.println("2. TX/RX are CROSS-CONNECTED:");
    Serial.println("   Sensor TX → ESP32 RX");
    Serial.println("   Sensor RX → ESP32 TX");
    Serial.println();
    Serial.println("3. CHECK FOR LIFE SIGNS:");
    Serial.println("   - Green LED should be visible inside sensor");
    Serial.println("   - Sensor should feel slightly warm (not hot)");
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║    FINGER VEIN SENSOR TEST v1.0        ║");
    Serial.println("║    SmartCampus Hardware Testing        ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    Serial.println("⚠️  REMINDER: Sensor must be powered by 3.3V!");
    Serial.println("   Using 5V will destroy the sensor!");
    Serial.println();
    
    // Initialize UART2
    Serial.println("Initializing UART2 at 57600 baud...");
    VeinSerial.begin(VEIN_BAUD, SERIAL_8N1, VEIN_RX, VEIN_TX);
    delay(500);
    
    Serial.println("Sending test command (Read System Parameters)...");
    Serial.println();
    
    // Test command: Read System Parameters (0x0F)
    uint8_t cmd[] = {0x0F};
    sendCommand(cmd, sizeof(cmd));
    
    if (receiveResponse(2000)) {
        Serial.println("╔════════════════════════════════════════╗");
        Serial.println("║   ✓ SENSOR RESPONDING!                 ║");
        Serial.println("╚════════════════════════════════════════╝");
        Serial.println();
        
        // Print raw response
        Serial.print("  Response (");
        Serial.print(respLen);
        Serial.print(" bytes): ");
        for (size_t i = 0; i < respLen; i++) {
            if (respBuffer[i] < 0x10) Serial.print("0");
            Serial.print(respBuffer[i], HEX);
            Serial.print(" ");
        }
        Serial.println();
        
        // Parse confirmation code
        if (respLen > 9) {
            uint8_t confirmCode = respBuffer[9];
            Serial.print("  Confirmation Code: 0x");
            Serial.print(confirmCode, HEX);
            if (confirmCode == 0x00) {
                Serial.println(" (Success)");
            } else {
                Serial.println(" (Error)");
            }
        }
        
        Serial.println();
        
        // Now get template count
        Serial.println("Checking enrolled templates...");
        uint8_t cmdCount[] = {0x1D};
        sendCommand(cmdCount, sizeof(cmdCount));
        
        if (receiveResponse(1000)) {
            if (respLen >= 12 && respBuffer[9] == 0x00) {
                uint16_t count = (respBuffer[10] << 8) | respBuffer[11];
                Serial.print("  Enrolled templates: ");
                Serial.println(count);
            }
        }
        
        Serial.println();
        Serial.println("═══════════════════════════════════════════");
        Serial.println();
        Serial.println("  ✓ Finger Vein sensor is working!");
        Serial.println();
        Serial.println("  Next steps:");
        Serial.println("  - Use main firmware to enroll fingers");
        Serial.println("  - Command: ENROLL:VEIN:1");
        Serial.println();
        Serial.println("═══════════════════════════════════════════");
        
    } else {
        Serial.println("╔════════════════════════════════════════╗");
        Serial.println("║   ❌ NO RESPONSE FROM SENSOR!          ║");
        Serial.println("╚════════════════════════════════════════╝");
        
        printTroubleshooting();
        
        Serial.println("Will keep retrying every 5 seconds...");
    }
}

void loop() {
    static unsigned long lastTry = 0;
    
    // If sensor wasn't found, keep trying
    if (respLen == 0 && millis() - lastTry > 5000) {
        lastTry = millis();
        
        Serial.println("Retrying...");
        uint8_t cmd[] = {0x0F};
        sendCommand(cmd, sizeof(cmd));
        
        if (receiveResponse(2000)) {
            Serial.println("✓ Sensor now responding! Press RESET to restart test.");
        } else {
            Serial.println("✗ Still no response. Check wiring.");
        }
    }
    
    delay(100);
}
