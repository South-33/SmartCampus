/**
 * Waveshare Finger Vein Sensor - Hardware Test
 * =============================================
 * 
 * STANDALONE test - no dependencies on production code.
 * Purpose: Verify wiring and basic UART communication.
 * 
 * CRITICAL: THIS SENSOR IS 3.3V ONLY!
 * Connecting 5V WILL DESTROY the sensor!
 * 
 * WIRING:
 *   SENSOR   ->   ESP32
 *   VCC      ->   3V3 (NOT 5V!)
 *   GND      ->   GND
 *   TXD      ->   GPIO16 (ESP32 RX)
 *   RXD      ->   GPIO17 (ESP32 TX)
 * 
 * PROTOCOL: Standard fingerprint (like R307/FPM10A)
 *   Baud: 57600 8N1
 *   Frame: Header(2) + Addr(4) + PkgId(1) + Len(2) + Data(N) + Checksum(2)
 *   Header: 0xEF 0x01
 *   Address: 0xFF 0xFF 0xFF 0xFF (default)
 * 
 * COMMANDS (Serial Monitor):
 *   1 = Send ReadSysPara (check alive)
 *   2 = Send GetTemplateCount
 *   r = Show raw bytes received
 *   ? = Show menu
 */

#include <Arduino.h>

// Pin definitions
#define VEIN_RX_PIN 16  // ESP32 RX <- Sensor TX
#define VEIN_TX_PIN 17  // ESP32 TX -> Sensor RX
#define VEIN_BAUD 57600

// LED for heartbeat
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

HardwareSerial VeinSerial(2);

// Protocol constants
const uint8_t HEADER[] = {0xEF, 0x01};
const uint8_t ADDR[] = {0xFF, 0xFF, 0xFF, 0xFF};
const uint8_t PKG_CMD = 0x01;  // Command packet

// Response buffer
uint8_t respBuffer[64];
int respLen = 0;

void printHex(uint8_t b) {
    if (b < 0x10) Serial.print("0");
    Serial.print(b, HEX);
}

void printBuffer(uint8_t* buf, int len) {
    for (int i = 0; i < len; i++) {
        printHex(buf[i]);
        Serial.print(" ");
    }
    Serial.println();
}

/**
 * Send a command to the finger vein sensor
 * cmd: command byte(s)
 * cmdLen: length of command
 */
bool sendCommand(const uint8_t* cmd, int cmdLen) {
    // Calculate total length: PkgId(1) + Len(2) + Data(N) + Checksum(2)
    uint16_t len = cmdLen + 2;  // data + checksum
    
    // Build packet
    uint8_t packet[32];
    int idx = 0;
    
    // Header
    packet[idx++] = HEADER[0];
    packet[idx++] = HEADER[1];
    
    // Address
    for (int i = 0; i < 4; i++) packet[idx++] = ADDR[i];
    
    // Package ID
    packet[idx++] = PKG_CMD;
    
    // Length (2 bytes, high byte first)
    packet[idx++] = (len >> 8) & 0xFF;
    packet[idx++] = len & 0xFF;
    
    // Data (command bytes)
    for (int i = 0; i < cmdLen; i++) packet[idx++] = cmd[i];
    
    // Checksum: sum of PkgId + Len + Data
    uint16_t checksum = PKG_CMD + ((len >> 8) & 0xFF) + (len & 0xFF);
    for (int i = 0; i < cmdLen; i++) checksum += cmd[i];
    packet[idx++] = (checksum >> 8) & 0xFF;
    packet[idx++] = checksum & 0xFF;
    
    // Clear RX buffer
    while (VeinSerial.available()) VeinSerial.read();
    
    // Send
    Serial.print("  TX: ");
    printBuffer(packet, idx);
    VeinSerial.write(packet, idx);
    VeinSerial.flush();
    
    return true;
}

/**
 * Read response from sensor
 * Returns number of bytes read, or 0 on timeout
 */
int readResponse(uint32_t timeoutMs) {
    unsigned long start = millis();
    respLen = 0;
    
    // Wait for header
    while (millis() - start < timeoutMs) {
        if (VeinSerial.available()) {
            uint8_t b = VeinSerial.read();
            respBuffer[respLen++] = b;
            
            // Once we have header + addr + pkgid + len, we know total length
            if (respLen >= 9) {
                uint16_t dataLen = (respBuffer[7] << 8) | respBuffer[8];
                int totalLen = 9 + dataLen;  // header(2) + addr(4) + pkgid(1) + len(2) + data + checksum
                
                // Read remaining bytes
                while (respLen < totalLen && respLen < sizeof(respBuffer) && millis() - start < timeoutMs) {
                    if (VeinSerial.available()) {
                        respBuffer[respLen++] = VeinSerial.read();
                    }
                }
                break;
            }
        }
    }
    
    return respLen;
}

void printMenu() {
    Serial.println();
    Serial.println(F("========================================"));
    Serial.println(F("  FINGER VEIN SENSOR TEST"));
    Serial.println(F("========================================"));
    Serial.println(F("  1 = ReadSysPara (check alive)"));
    Serial.println(F("  2 = GetTemplateCount"));
    Serial.println(F("  r = Show last raw response"));
    Serial.println(F("  ? = Show this menu"));
    Serial.println(F("========================================"));
    Serial.println();
}

void cmdReadSysPara() {
    Serial.println(F("\n[CMD] ReadSysPara (0x0F)"));
    uint8_t cmd[] = {0x0F};
    sendCommand(cmd, sizeof(cmd));
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        // Check confirmation code (byte 9)
        if (len >= 12 && respBuffer[9] == 0x00) {
            Serial.println(F("  -> SUCCESS: Sensor responded!"));
        } else if (len >= 10) {
            Serial.print(F("  -> Response code: 0x"));
            printHex(respBuffer[9]);
            Serial.println();
        }
    } else {
        Serial.println(F("  -> TIMEOUT: No response from sensor"));
        Serial.println(F("     Check: VCC=3.3V, TX->GPIO16, RX->GPIO17"));
    }
}

void cmdGetTemplateCount() {
    Serial.println(F("\n[CMD] GetTemplateCount (0x1D)"));
    uint8_t cmd[] = {0x1D};
    sendCommand(cmd, sizeof(cmd));
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        if (len >= 14 && respBuffer[9] == 0x00) {
            uint16_t count = (respBuffer[10] << 8) | respBuffer[11];
            Serial.print(F("  -> Enrolled templates: "));
            Serial.println(count);
        } else if (len >= 10) {
            Serial.print(F("  -> Response code: 0x"));
            printHex(respBuffer[9]);
            Serial.println();
        }
    } else {
        Serial.println(F("  -> TIMEOUT: No response"));
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);
    delay(1000);
    
    Serial.println();
    Serial.println(F("========================================"));
    Serial.println(F("  FINGER VEIN HARDWARE TEST"));
    Serial.println(F("  Standalone - No Dependencies"));
    Serial.println(F("========================================"));
    Serial.println();
    
    Serial.println(F("!! CRITICAL: Sensor must be 3.3V !!"));
    Serial.println(F("   5V will DESTROY it!"));
    Serial.println();
    
    Serial.print(F("Initializing UART2 at "));
    Serial.print(VEIN_BAUD);
    Serial.println(F(" baud..."));
    
    VeinSerial.begin(VEIN_BAUD, SERIAL_8N1, VEIN_RX_PIN, VEIN_TX_PIN);
    delay(100);
    
    Serial.println(F("UART ready. Testing sensor..."));
    Serial.println();
    
    // Auto-test on startup
    cmdReadSysPara();
    
    printMenu();
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
            case '1':
                cmdReadSysPara();
                break;
                
            case '2':
                cmdGetTemplateCount();
                break;
                
            case 'r':
            case 'R':
                Serial.println(F("\n[Last Response]"));
                if (respLen > 0) {
                    Serial.print("  ");
                    printBuffer(respBuffer, respLen);
                } else {
                    Serial.println(F("  (empty)"));
                }
                break;
                
            case '?':
            case 'h':
            case 'H':
                printMenu();
                break;
                
            case '\n':
            case '\r':
                break;
                
            default:
                Serial.print(F("Unknown: "));
                Serial.println(cmd);
                break;
        }
    }
}
