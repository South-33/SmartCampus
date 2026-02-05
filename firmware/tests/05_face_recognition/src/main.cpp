/**
 * HLK-TX510 Face Recognition - Hardware Test
 * ===========================================
 * 
 * STANDALONE test - no dependencies on production code.
 * Purpose: Verify wiring and basic UART communication.
 * 
 * WIRING:
 *   TX510    ->   ESP32
 *   VCC      ->   External 5V (needs ~800mA, too much for ESP32)
 *   GND      ->   Common GND (shared with ESP32)
 *   TX (38)  ->   GPIO4 (ESP32 RX)
 *   RX (39)  ->   GPIO5 (ESP32 TX)
 * 
 * PROTOCOL: HLK-TX510 proprietary
 *   Baud: 115200 8N1
 *   Frame: Header(2) + MsgId(2) + Len(2) + Data(N) + Checksum(1) + Tail(2)
 *   Header: 0xEF 0xAA
 *   Tail: 0x0D 0x0A
 * 
 * COMMANDS (Serial Monitor):
 *   1 = Query module info (WHO_AM_I)
 *   2 = Get enrolled face count
 *   r = Show raw bytes received
 *   ? = Show menu
 */

#include <Arduino.h>

// Pin definitions
#define FACE_RX_PIN 4   // ESP32 RX <- TX510 TX (pin 38)
#define FACE_TX_PIN 5   // ESP32 TX -> TX510 RX (pin 39)
#define FACE_BAUD 115200

// LED for heartbeat
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

HardwareSerial FaceSerial(1);

// Protocol constants
const uint8_t HEADER[] = {0xEF, 0xAA};
const uint8_t TAIL[] = {0x0D, 0x0A};

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
 * Calculate checksum: XOR of MsgId + Len + Data
 */
uint8_t calcChecksum(uint8_t* data, int len) {
    uint8_t checksum = 0;
    for (int i = 0; i < len; i++) {
        checksum ^= data[i];
    }
    return checksum;
}

/**
 * Send a frame to the TX510
 * msgId: 2-byte message ID
 * data: payload bytes
 * dataLen: payload length
 */
bool sendFrame(uint16_t msgId, const uint8_t* data, int dataLen) {
    uint8_t packet[32];
    int idx = 0;
    
    // Header
    packet[idx++] = HEADER[0];
    packet[idx++] = HEADER[1];
    
    // Message ID (big endian)
    packet[idx++] = (msgId >> 8) & 0xFF;
    packet[idx++] = msgId & 0xFF;
    
    // Length (big endian)
    packet[idx++] = (dataLen >> 8) & 0xFF;
    packet[idx++] = dataLen & 0xFF;
    
    // Data
    for (int i = 0; i < dataLen; i++) {
        packet[idx++] = data[i];
    }
    
    // Checksum: XOR of MsgId(2) + Len(2) + Data(N)
    uint8_t checksum = 0;
    for (int i = 2; i < idx; i++) {
        checksum ^= packet[i];
    }
    packet[idx++] = checksum;
    
    // Tail
    packet[idx++] = TAIL[0];
    packet[idx++] = TAIL[1];
    
    // Clear RX buffer
    while (FaceSerial.available()) FaceSerial.read();
    
    // Send
    Serial.print("  TX: ");
    printBuffer(packet, idx);
    FaceSerial.write(packet, idx);
    FaceSerial.flush();
    
    return true;
}

/**
 * Read response from module
 * Returns number of bytes read, or 0 on timeout
 */
int readResponse(uint32_t timeoutMs) {
    unsigned long start = millis();
    respLen = 0;
    
    while (millis() - start < timeoutMs && respLen < sizeof(respBuffer)) {
        if (FaceSerial.available()) {
            respBuffer[respLen++] = FaceSerial.read();
            
            // Check for complete frame (ends with 0x0D 0x0A)
            if (respLen >= 9 && 
                respBuffer[respLen-2] == 0x0D && 
                respBuffer[respLen-1] == 0x0A) {
                break;
            }
        }
    }
    
    return respLen;
}

void printMenu() {
    Serial.println();
    Serial.println(F("========================================"));
    Serial.println(F("  HLK-TX510 FACE MODULE TEST"));
    Serial.println(F("========================================"));
    Serial.println(F("  1 = Query module info (WHO_AM_I)"));
    Serial.println(F("  2 = Get enrolled face count"));
    Serial.println(F("  r = Show last raw response"));
    Serial.println(F("  ? = Show this menu"));
    Serial.println(F("========================================"));
    Serial.println();
}

void cmdQueryModuleInfo() {
    Serial.println(F("\n[CMD] Query Module Info (0x0000)"));
    
    // MsgId 0x0000 = Query module info, no data
    uint8_t data[] = {};
    sendFrame(0x0000, data, 0);
    
    int len = readResponse(2000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        // Check if valid response (header = EF AA)
        if (len >= 9 && respBuffer[0] == 0xEF && respBuffer[1] == 0xAA) {
            uint16_t msgId = (respBuffer[2] << 8) | respBuffer[3];
            Serial.print(F("  -> MsgId: 0x"));
            printHex(respBuffer[2]);
            printHex(respBuffer[3]);
            Serial.println();
            
            if (msgId == 0x0000) {
                Serial.println(F("  -> SUCCESS: Module responded!"));
            }
        }
    } else {
        Serial.println(F("  -> TIMEOUT: No response from module"));
        Serial.println(F("     Check:"));
        Serial.println(F("       - External 5V power to TX510"));
        Serial.println(F("       - GND shared between TX510 and ESP32"));
        Serial.println(F("       - TX510 TX(38) -> ESP32 GPIO4"));
        Serial.println(F("       - TX510 RX(39) -> ESP32 GPIO5"));
        Serial.println(F("       - Wait 2-3 sec for TX510 boot"));
    }
}

void cmdGetFaceCount() {
    Serial.println(F("\n[CMD] Get Enrolled Face Count (0x001C)"));
    
    // MsgId 0x001C = Get user count
    uint8_t data[] = {};
    sendFrame(0x001C, data, 0);
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        if (len >= 9 && respBuffer[0] == 0xEF && respBuffer[1] == 0xAA) {
            // Data starts at byte 6
            uint16_t dataLen = (respBuffer[4] << 8) | respBuffer[5];
            if (dataLen >= 2 && len >= 8) {
                uint16_t count = (respBuffer[6] << 8) | respBuffer[7];
                Serial.print(F("  -> Enrolled faces: "));
                Serial.println(count);
            }
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
    Serial.println(F("  TX510 FACE MODULE HARDWARE TEST"));
    Serial.println(F("  Standalone - No Dependencies"));
    Serial.println(F("========================================"));
    Serial.println();
    
    Serial.println(F("NOTE: TX510 needs external 5V (~800mA)"));
    Serial.println(F("      Module takes 2-3 seconds to boot"));
    Serial.println();
    
    Serial.print(F("Initializing UART1 at "));
    Serial.print(FACE_BAUD);
    Serial.println(F(" baud..."));
    
    FaceSerial.begin(FACE_BAUD, SERIAL_8N1, FACE_RX_PIN, FACE_TX_PIN);
    
    Serial.println(F("Waiting for TX510 boot (3 sec)..."));
    delay(3000);
    
    Serial.println(F("Testing module..."));
    Serial.println();
    
    // Auto-test on startup
    cmdQueryModuleInfo();
    
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
                cmdQueryModuleInfo();
                break;
                
            case '2':
                cmdGetFaceCount();
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
