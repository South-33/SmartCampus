/**
 * HLK-TX510 Face Recognition - Component Test
 * ============================================
 * 
 * INCOMING INSPECTION TEST - verify module is not defective.
 * Tests: communication, camera, face detection, enroll, verify, delete
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
 */

#include <Arduino.h>

// Pin definitions
#define FACE_RX_PIN 4
#define FACE_TX_PIN 5
#define FACE_BAUD 115200

#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

HardwareSerial FaceSerial(1);

// Protocol constants
const uint8_t HEADER[] = {0xEF, 0xAA};
const uint8_t TAIL[] = {0x0D, 0x0A};

// Response buffer
uint8_t respBuffer[128];
int respLen = 0;
uint16_t lastMsgId = 0;

// Result codes
const char* getResultMsg(uint8_t code) {
    switch (code) {
        case 0x00: return "Success";
        case 0x01: return "Failed";
        case 0x02: return "Timeout";
        case 0x03: return "No face detected";
        case 0x04: return "Face already exists";
        case 0x05: return "Face not found";
        case 0x06: return "ID invalid";
        case 0x07: return "Direction error";
        case 0x08: return "Camera error";
        case 0x09: return "Low quality";
        case 0x0A: return "Not alive (spoof detected)";
        case 0x0B: return "Memory full";
        case 0x10: return "Processing";
        default: return "Unknown";
    }
}

void printHex(uint8_t b) {
    if (b < 0x10) Serial.print("0");
    Serial.print(b, HEX);
}

void printBuffer(uint8_t* buf, int len) {
    for (int i = 0; i < len; i++) {
        printHex(buf[i]);
        Serial.print(" ");
        if ((i + 1) % 16 == 0) Serial.println();
    }
    if (len % 16 != 0) Serial.println();
}

bool sendFrame(uint16_t msgId, const uint8_t* data, int dataLen) {
    uint8_t packet[64];
    int idx = 0;
    
    packet[idx++] = HEADER[0];
    packet[idx++] = HEADER[1];
    packet[idx++] = (msgId >> 8) & 0xFF;
    packet[idx++] = msgId & 0xFF;
    packet[idx++] = (dataLen >> 8) & 0xFF;
    packet[idx++] = dataLen & 0xFF;
    
    for (int i = 0; i < dataLen; i++) {
        packet[idx++] = data[i];
    }
    
    // Checksum: XOR of bytes 2 to idx-1 (MsgId + Len + Data)
    uint8_t checksum = 0;
    for (int i = 2; i < idx; i++) {
        checksum ^= packet[i];
    }
    packet[idx++] = checksum;
    
    packet[idx++] = TAIL[0];
    packet[idx++] = TAIL[1];
    
    while (FaceSerial.available()) FaceSerial.read();
    
    Serial.print("  TX: ");
    printBuffer(packet, idx);
    FaceSerial.write(packet, idx);
    FaceSerial.flush();
    
    return true;
}

int readResponse(uint32_t timeoutMs) {
    unsigned long start = millis();
    respLen = 0;
    
    while (millis() - start < timeoutMs && respLen < sizeof(respBuffer)) {
        if (FaceSerial.available()) {
            respBuffer[respLen++] = FaceSerial.read();
            
            // Check for complete frame
            if (respLen >= 9 && 
                respBuffer[respLen-2] == 0x0D && 
                respBuffer[respLen-1] == 0x0A) {
                // Verify header
                if (respBuffer[0] == 0xEF && respBuffer[1] == 0xAA) {
                    lastMsgId = (respBuffer[2] << 8) | respBuffer[3];
                    break;
                }
            }
        }
    }
    
    return respLen;
}

// Get data portion of response (starts at byte 6)
uint8_t* getResponseData() {
    return &respBuffer[6];
}

uint16_t getResponseDataLen() {
    if (respLen >= 6) {
        return (respBuffer[4] << 8) | respBuffer[5];
    }
    return 0;
}

void printResult(uint8_t code) {
    if (code == 0x00) {
        Serial.print("  -> OK");
    } else {
        Serial.print("  -> FAIL (0x");
        printHex(code);
        Serial.print("): ");
        Serial.print(getResultMsg(code));
    }
    Serial.println();
}

void printMenu() {
    Serial.println();
    Serial.println(F("================================================"));
    Serial.println(F("  TX510 FACE MODULE TEST - Incoming Inspection"));
    Serial.println(F("================================================"));
    Serial.println(F("  1 = Query module info (WHO_AM_I)"));
    Serial.println(F("  2 = Get enrolled face count"));
    Serial.println(F("  3 = Detect face (test camera)"));
    Serial.println(F("  4 = Enroll face to ID 1"));
    Serial.println(F("  5 = Verify face (search)"));
    Serial.println(F("  6 = Delete all faces"));
    Serial.println(F("  7 = Set/check liveness detection"));
    Serial.println(F("  r = Show raw response"));
    Serial.println(F("  ? = Show this menu"));
    Serial.println(F("================================================"));
    Serial.println(F("  Test sequence: 1 -> 2 -> 3 -> 4 -> 5 -> 6"));
    Serial.println(F("  All pass = module is good"));
    Serial.println(F("================================================"));
    Serial.println();
}

// ============== TEST COMMANDS ==============

void cmdQueryInfo() {
    Serial.println(F("\n[TEST 1] Query Module Info"));
    uint8_t data[] = {};
    sendFrame(0x0000, data, 0);
    
    int len = readResponse(2000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        if (lastMsgId == 0x0000) {
            Serial.println(F("  -> OK: Module responded"));
        } else {
            Serial.print(F("  -> Unexpected MsgId: 0x"));
            Serial.println(lastMsgId, HEX);
        }
    } else {
        Serial.println(F("  -> TIMEOUT: No response"));
        Serial.println(F("     Check:"));
        Serial.println(F("       - External 5V power (800mA needed)"));
        Serial.println(F("       - GND shared with ESP32"));
        Serial.println(F("       - TX510 TX(38) -> ESP32 GPIO4"));
        Serial.println(F("       - TX510 RX(39) -> ESP32 GPIO5"));
        Serial.println(F("       - Wait 3 sec for module boot"));
    }
}

void cmdGetFaceCount() {
    Serial.println(F("\n[TEST 2] Get Enrolled Face Count"));
    uint8_t data[] = {};
    sendFrame(0x001C, data, 0);
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        uint16_t dataLen = getResponseDataLen();
        if (dataLen >= 2) {
            uint8_t* d = getResponseData();
            uint16_t count = (d[0] << 8) | d[1];
            Serial.print(F("  -> OK: "));
            Serial.print(count);
            Serial.println(F(" faces enrolled"));
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void cmdDetectFace() {
    Serial.println(F("\n[TEST 3] Detect Face (test camera/algorithm)"));
    Serial.println(F("  Look at the camera..."));
    Serial.println(F("  (Watch TX510 LCD for face box)"));
    
    // Start verify which will detect face
    uint8_t data[] = {0x05};  // 5 second timeout
    sendFrame(0x0012, data, 1);  // Verify (will detect but may not match)
    
    // Wait for response
    int len = readResponse(8000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        uint8_t* d = getResponseData();
        uint16_t dataLen = getResponseDataLen();
        
        if (dataLen > 0) {
            uint8_t result = d[0];
            if (result == 0x00) {
                Serial.println(F("  -> Face detected AND matched (already enrolled)"));
            } else if (result == 0x05) {
                Serial.println(F("  -> OK: Face detected but not enrolled (expected)"));
                Serial.println(F("     Camera is working!"));
            } else if (result == 0x03) {
                Serial.println(F("  -> No face detected - check camera or positioning"));
            } else {
                printResult(result);
            }
        }
    } else {
        Serial.println(F("  -> TIMEOUT (no face presented?)"));
    }
}

void cmdEnroll() {
    Serial.println(F("\n[TEST 4] Enroll Face to ID 1"));
    Serial.println(F("  Look at camera, follow LCD prompts..."));
    Serial.println(F("  (May ask for multiple angles)"));
    
    // Enroll user ID 1
    uint8_t data[] = {0x00, 0x01, 0x00, 0x00, 0x0A};  // ID=1, timeout=10sec
    sendFrame(0x0013, data, 5);
    
    // Enrollment can take a while with multiple captures
    int len = readResponse(30000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        uint8_t* d = getResponseData();
        uint16_t dataLen = getResponseDataLen();
        
        if (dataLen > 0) {
            uint8_t result = d[0];
            if (result == 0x00) {
                Serial.println(F("  ==================================="));
                Serial.println(F("  -> OK: Enrollment complete!"));
                Serial.println(F("  ==================================="));
            } else {
                printResult(result);
            }
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void cmdVerify() {
    Serial.println(F("\n[TEST 5] Verify Face (search database)"));
    Serial.println(F("  Look at the camera..."));
    
    uint8_t data[] = {0x0A};  // 10 second timeout
    sendFrame(0x0012, data, 1);
    
    int len = readResponse(15000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        uint8_t* d = getResponseData();
        uint16_t dataLen = getResponseDataLen();
        
        if (dataLen >= 3) {
            uint8_t result = d[0];
            if (result == 0x00) {
                uint16_t matchId = (d[1] << 8) | d[2];
                Serial.println(F("  ==================================="));
                Serial.print(F("  -> MATCH! User ID: "));
                Serial.println(matchId);
                Serial.println(F("  ==================================="));
            } else {
                printResult(result);
            }
        } else if (dataLen > 0) {
            printResult(d[0]);
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void cmdDeleteAll() {
    Serial.println(F("\n[TEST 6] Delete All Faces"));
    uint8_t data[] = {};
    sendFrame(0x0021, data, 0);  // Delete all
    
    int len = readResponse(3000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        uint8_t* d = getResponseData();
        if (getResponseDataLen() > 0 && d[0] == 0x00) {
            Serial.println(F("  -> OK: All faces deleted"));
        } else if (getResponseDataLen() > 0) {
            printResult(d[0]);
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void cmdLiveness() {
    Serial.println(F("\n[TEST 7] Check/Set Liveness Detection"));
    Serial.println(F("  Enabling liveness (anti-spoofing)..."));
    
    // Set liveness level (0=off, 1=low, 2=mid, 3=high)
    uint8_t data[] = {0x02};  // Medium
    sendFrame(0x0028, data, 1);
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        uint8_t* d = getResponseData();
        if (getResponseDataLen() > 0 && d[0] == 0x00) {
            Serial.println(F("  -> OK: Liveness set to MEDIUM"));
            Serial.println(F("     Photo/video attacks should be rejected"));
        } else if (getResponseDataLen() > 0) {
            printResult(d[0]);
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);
    delay(1000);
    
    Serial.println();
    Serial.println(F("================================================"));
    Serial.println(F("  TX510 FACE MODULE - INCOMING INSPECTION"));
    Serial.println(F("================================================"));
    Serial.println();
    Serial.println(F("NOTE: TX510 needs external 5V (~800mA)"));
    Serial.println(F("      Module takes 2-3 seconds to boot"));
    Serial.println(F("      Watch the LCD for visual feedback"));
    Serial.println();
    
    FaceSerial.begin(FACE_BAUD, SERIAL_8N1, FACE_RX_PIN, FACE_TX_PIN);
    
    Serial.println(F("Waiting for TX510 boot (3 sec)..."));
    delay(3000);
    
    Serial.println(F("Running initial check..."));
    cmdQueryInfo();
    
    printMenu();
}

void loop() {
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 500) {
        lastBlink = millis();
        digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    }
    
    if (Serial.available()) {
        char cmd = Serial.read();
        
        switch (cmd) {
            case '1': cmdQueryInfo(); break;
            case '2': cmdGetFaceCount(); break;
            case '3': cmdDetectFace(); break;
            case '4': cmdEnroll(); break;
            case '5': cmdVerify(); break;
            case '6': cmdDeleteAll(); break;
            case '7': cmdLiveness(); break;
            case 'r':
            case 'R':
                Serial.println(F("\n[Raw Response]"));
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
