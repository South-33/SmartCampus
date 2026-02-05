/**
 * HLK-TX510 Face Recognition Test
 * ================================
 * 
 * PURPOSE: Verify TX510 face recognition module is responding and communicating
 * 
 * WIRING:
 *   TX510    →   ESP32
 *   ─────────────────────
 *   VCC      →   External 5V (USB-C Breakout)
 *   GND      →   Common GND
 *   TX (38)  →   GPIO4 (ESP32 RX)
 *   RX (39)  →   GPIO5 (ESP32 TX)
 * 
 * ⚠️ CRITICAL: TX510 needs 5V @ 800mA peak. 
 *    Power it via an external 5V source, NOT from the ESP32 VIN pin.
 *    GND must be shared between external power, TX510, and ESP32.
 * 
 * EXPECTED OUTPUT:
 *   - "TX510 initialized"
 *   - Hex data appearing when face is detected
 * 
 * TROUBLESHOOTING:
 *   - No data: Check TX/RX swap (GPIO4/5)
 *   - Module screen black: Check external power supply and CC resistors
 */

#include <Arduino.h>

// UART1 pins for TX510
#define FACE_RX 4   // ESP32 receives from TX510's TX
#define FACE_TX 5   // ESP32 transmits to TX510's RX
#define FACE_BAUD 115200

HardwareSerial FaceSerial(1);

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║    HLK-TX510 FACE RECOGNITION TEST     ║");
    Serial.println("║      SmartCampus Hardware Testing      ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    Serial.println("Initializing UART1 for TX510...");
    FaceSerial.begin(FACE_BAUD, SERIAL_8N1, FACE_RX, FACE_TX);
    
    Serial.println("Waiting for TX510 to boot (approx 2 seconds)...");
    delay(2000);
    
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
    Serial.println("  ✓ Monitoring Face Module...");
    Serial.println("  Try these actions:");
    Serial.println("  1. Look at the camera");
    Serial.println("  2. Press buttons on the module");
    Serial.println("  3. Wave hand near the IR sensors");
    Serial.println();
    Serial.println("  If you see HEX DATA below, it's WORKING!");
    Serial.println();
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
}

void loop() {
    // Read from TX510 and print to Serial Monitor
    if (FaceSerial.available()) {
        Serial.print("TX510 -> ");
        while (FaceSerial.available()) {
            uint8_t b = FaceSerial.read();
            if (b < 0x10) Serial.print("0");
            Serial.print(b, HEX);
            Serial.print(" ");
        }
        Serial.println();
    }

    // Forward Serial Monitor input to TX510 (for sending commands)
    if (Serial.available()) {
        while (Serial.available()) {
            FaceSerial.write(Serial.read());
        }
    }
}
