/**
 * PN532 NFC Reader Test
 * ======================
 * 
 * PURPOSE: Verify PN532 NFC module is wired correctly and responding
 * 
 * WIRING:
 *   PN532    →   ESP32
 *   ─────────────────────
 *   VCC      →   VIN (5V)
 *   GND      →   GND
 *   SDA      →   GPIO21 (+ 4.7K pull-up to 3.3V)
 *   SCL      →   GPIO22 (+ 4.7K pull-up to 3.3V)
 * 
 * DIP SWITCHES (on PN532 board):
 *   Switch 1: OFF
 *   Switch 2: ON
 *   (This sets I2C mode)
 * 
 * EXPECTED OUTPUT:
 *   - "PN532 found!" with firmware version
 *   - Card UID printed when you tap a card
 * 
 * TROUBLESHOOTING:
 *   - "PN532 not found": Check wiring, DIP switches, pull-up resistors
 *   - Card not read: Hold card within 2cm of reader
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

// I2C pins
#define SDA_PIN 21
#define SCL_PIN 22

// Create NFC object (I2C mode)
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);

// Track cards read
uint32_t cardsRead = 0;

void printTroubleshooting() {
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║         TROUBLESHOOTING GUIDE          ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    Serial.println("1. CHECK WIRING:");
    Serial.println("   PN532 VCC → ESP32 VIN (5V)");
    Serial.println("   PN532 GND → ESP32 GND");
    Serial.println("   PN532 SDA → ESP32 GPIO21");
    Serial.println("   PN532 SCL → ESP32 GPIO22");
    Serial.println();
    Serial.println("2. CHECK DIP SWITCHES:");
    Serial.println("   Switch 1: OFF (down)");
    Serial.println("   Switch 2: ON  (up)");
    Serial.println();
    Serial.println("3. CHECK PULL-UP RESISTORS:");
    Serial.println("   4.7K from SDA to 3.3V");
    Serial.println("   4.7K from SCL to 3.3V");
    Serial.println();
    Serial.println("4. TRY:");
    Serial.println("   - Power cycle the PN532");
    Serial.println("   - Press ESP32 reset button");
    Serial.println("   - Check for loose connections");
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║       PN532 NFC READER TEST v1.0       ║");
    Serial.println("║       SchoolNFC Hardware Testing       ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    Serial.println("Initializing I2C on GPIO21 (SDA) and GPIO22 (SCL)...");
    Wire.begin(SDA_PIN, SCL_PIN);
    
    Serial.println("Searching for PN532 module...");
    nfc.begin();
    
    // Get firmware version
    uint32_t versiondata = nfc.getFirmwareVersion();
    
    if (!versiondata) {
        Serial.println();
        Serial.println("╔════════════════════════════════════════╗");
        Serial.println("║   ❌ ERROR: PN532 NOT FOUND!           ║");
        Serial.println("╚════════════════════════════════════════╝");
        
        printTroubleshooting();
        
        Serial.println("Halting. Fix the issue and reset.");
        while (1) { 
            delay(1000); 
        }
    }
    
    // Print firmware info
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║   ✓ PN532 FOUND!                       ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    Serial.print("  Chip:     PN5");
    Serial.println((versiondata >> 24) & 0xFF, HEX);
    Serial.print("  Firmware: ");
    Serial.print((versiondata >> 16) & 0xFF, DEC);
    Serial.print(".");
    Serial.println((versiondata >> 8) & 0xFF, DEC);
    Serial.println();
    
    // Configure for reading NFC cards
    nfc.SAMConfig();
    
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
    Serial.println("  NFC Reader is ready!");
    Serial.println("  Hold an NFC card within 2cm of the reader...");
    Serial.println();
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
}

void loop() {
    uint8_t uid[7] = {0};
    uint8_t uidLength = 0;
    
    // Try to read a card (100ms timeout)
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
        cardsRead++;
        
        Serial.println("┌──────────────────────────────────────────┐");
        Serial.print("│ CARD #");
        Serial.print(cardsRead);
        Serial.println(" DETECTED!                        │");
        Serial.println("├──────────────────────────────────────────┤");
        
        // Print UID length
        Serial.print("│ UID Length: ");
        Serial.print(uidLength);
        Serial.println(" bytes                      │");
        
        // Print UID as hex string
        Serial.print("│ UID (hex):  ");
        char uidStr[22] = {0};
        for (uint8_t i = 0; i < uidLength && i < 7; i++) {
            char buf[4];
            sprintf(buf, "%02X", uid[i]);
            strcat(uidStr, buf);
            if (i < uidLength - 1) strcat(uidStr, ":");
        }
        Serial.print(uidStr);
        // Pad to align
        for (int i = strlen(uidStr); i < 20; i++) Serial.print(" ");
        Serial.println("    │");
        
        // Print UID as decimal
        Serial.print("│ UID (dec):  ");
        for (uint8_t i = 0; i < uidLength && i < 7; i++) {
            Serial.print(uid[i]);
            if (i < uidLength - 1) Serial.print(".");
        }
        Serial.println();
        
        Serial.println("└──────────────────────────────────────────┘");
        Serial.println();
        
        // Debounce
        delay(1000);
    }
}
