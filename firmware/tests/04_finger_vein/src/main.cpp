/**
 * Waveshare Finger Vein Sensor - Component Test
 * ==============================================
 * 
 * INCOMING INSPECTION TEST - verify sensor is not defective.
 * Tests: communication, optics, capture, enroll, verify, delete
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
 */

#include <Arduino.h>

// Pin definitions
#define VEIN_RX_PIN 16
#define VEIN_TX_PIN 17
#define VEIN_BAUD 57600

#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

HardwareSerial VeinSerial(2);

// Protocol constants
const uint8_t HEADER[] = {0xEF, 0x01};
const uint8_t ADDR[] = {0xFF, 0xFF, 0xFF, 0xFF};
const uint8_t PKG_CMD = 0x01;

// Response buffer
uint8_t respBuffer[64];
int respLen = 0;

// Confirmation codes
const char* getConfirmationMsg(uint8_t code) {
    switch (code) {
        case 0x00: return "OK";
        case 0x01: return "Packet error";
        case 0x02: return "No finger detected";
        case 0x03: return "Enroll failed";
        case 0x06: return "Image too messy";
        case 0x07: return "Image too small";
        case 0x08: return "No match";
        case 0x09: return "Not found";
        case 0x0A: return "Merge failed";
        case 0x0B: return "ID out of range";
        case 0x0C: return "Template read error";
        case 0x0D: return "Upload error";
        case 0x0E: return "Data packet error";
        case 0x0F: return "Upload image failed";
        case 0x10: return "Delete failed";
        case 0x11: return "Clear database failed";
        case 0x13: return "Wrong password";
        case 0x15: return "Buffer invalid";
        case 0x18: return "Flash write error";
        case 0x1A: return "Invalid register";
        case 0x1B: return "Register config error";
        case 0x1C: return "Notepad page error";
        case 0x1F: return "Fingerprint exists";
        default: return "Unknown error";
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
    }
    Serial.println();
}

bool sendCommand(const uint8_t* cmd, int cmdLen) {
    uint16_t len = cmdLen + 2;
    uint8_t packet[32];
    int idx = 0;
    
    packet[idx++] = HEADER[0];
    packet[idx++] = HEADER[1];
    for (int i = 0; i < 4; i++) packet[idx++] = ADDR[i];
    packet[idx++] = PKG_CMD;
    packet[idx++] = (len >> 8) & 0xFF;
    packet[idx++] = len & 0xFF;
    for (int i = 0; i < cmdLen; i++) packet[idx++] = cmd[i];
    
    uint16_t checksum = PKG_CMD + ((len >> 8) & 0xFF) + (len & 0xFF);
    for (int i = 0; i < cmdLen; i++) checksum += cmd[i];
    packet[idx++] = (checksum >> 8) & 0xFF;
    packet[idx++] = checksum & 0xFF;
    
    while (VeinSerial.available()) VeinSerial.read();
    
    Serial.print("  TX: ");
    printBuffer(packet, idx);
    VeinSerial.write(packet, idx);
    VeinSerial.flush();
    
    return true;
}

int readResponse(uint32_t timeoutMs) {
    unsigned long start = millis();
    respLen = 0;
    
    while (millis() - start < timeoutMs) {
        if (VeinSerial.available()) {
            uint8_t b = VeinSerial.read();
            respBuffer[respLen++] = b;
            
            if (respLen >= 9) {
                uint16_t dataLen = (respBuffer[7] << 8) | respBuffer[8];
                int totalLen = 9 + dataLen;
                
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

// Get confirmation code from response (byte 9)
uint8_t getConfirmCode() {
    if (respLen >= 10) return respBuffer[9];
    return 0xFF;
}

void printResult(uint8_t code) {
    if (code == 0x00) {
        Serial.print("  -> OK");
    } else {
        Serial.print("  -> FAIL (0x");
        printHex(code);
        Serial.print("): ");
        Serial.print(getConfirmationMsg(code));
    }
    Serial.println();
}

void printMenu() {
    Serial.println();
    Serial.println(F("================================================"));
    Serial.println(F("  FINGER VEIN COMPONENT TEST - Incoming Inspection"));
    Serial.println(F("================================================"));
    Serial.println(F("  1 = Check alive (ReadSysPara)"));
    Serial.println(F("  2 = Get template count"));
    Serial.println(F("  3 = Capture image test (verify optics)"));
    Serial.println(F("  4 = Enroll finger to ID 1"));
    Serial.println(F("  5 = Verify finger (search)"));
    Serial.println(F("  6 = Delete all templates"));
    Serial.println(F("  r = Show raw response"));
    Serial.println(F("  ? = Show this menu"));
    Serial.println(F("================================================"));
    Serial.println(F("  Test sequence: 1 -> 2 -> 3 -> 4 -> 5 -> 6"));
    Serial.println(F("  All pass = sensor is good"));
    Serial.println(F("================================================"));
    Serial.println();
}

// ============== TEST COMMANDS ==============

void cmdCheckAlive() {
    Serial.println(F("\n[TEST 1] ReadSysPara - Check sensor alive"));
    uint8_t cmd[] = {0x0F};
    sendCommand(cmd, sizeof(cmd));
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        printResult(getConfirmCode());
    } else {
        Serial.println(F("  -> TIMEOUT: No response"));
        Serial.println(F("     Check wiring: VCC=3.3V, TX->GPIO16, RX->GPIO17"));
    }
}

void cmdGetTemplateCount() {
    Serial.println(F("\n[TEST 2] GetTemplateCount - Check storage"));
    uint8_t cmd[] = {0x1D};
    sendCommand(cmd, sizeof(cmd));
    
    int len = readResponse(1000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        if (getConfirmCode() == 0x00 && len >= 14) {
            uint16_t count = (respBuffer[10] << 8) | respBuffer[11];
            Serial.print(F("  -> OK: "));
            Serial.print(count);
            Serial.println(F(" templates stored"));
        } else {
            printResult(getConfirmCode());
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void cmdCaptureImage() {
    Serial.println(F("\n[TEST 3] GenImg - Capture image (tests optics)"));
    Serial.println(F("  Place finger on sensor NOW..."));
    
    // Try a few times
    for (int attempt = 1; attempt <= 3; attempt++) {
        Serial.print(F("  Attempt "));
        Serial.print(attempt);
        Serial.println(F("/3..."));
        
        uint8_t cmd[] = {0x01};  // GenImg
        sendCommand(cmd, sizeof(cmd));
        
        int len = readResponse(3000);
        if (len > 0) {
            Serial.print("  RX: ");
            printBuffer(respBuffer, len);
            
            uint8_t code = getConfirmCode();
            if (code == 0x00) {
                Serial.println(F("  -> OK: Image captured! Optics working."));
                return;
            } else if (code == 0x02) {
                Serial.println(F("  -> No finger detected, try again..."));
                delay(1000);
            } else {
                printResult(code);
                return;
            }
        } else {
            Serial.println(F("  -> TIMEOUT"));
            return;
        }
    }
    Serial.println(F("  -> FAIL: Could not capture after 3 attempts"));
}

void cmdEnroll() {
    Serial.println(F("\n[TEST 4] Enroll - Full enrollment to ID 1"));
    Serial.println(F("  This tests: capture, feature extraction, storage"));
    Serial.println();
    
    // Step 1: Capture first image
    Serial.println(F("  Step 1/4: Place finger..."));
    uint8_t genImg[] = {0x01};
    sendCommand(genImg, 1);
    if (readResponse(5000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Capture 1 failed"));
        printResult(getConfirmCode());
        return;
    }
    Serial.println(F("  -> Captured"));
    
    // Step 2: Generate char from image to buffer 1
    Serial.println(F("  Step 2/4: Generating features (buffer 1)..."));
    uint8_t img2Tz1[] = {0x02, 0x01};  // Img2Tz, buffer 1
    sendCommand(img2Tz1, 2);
    if (readResponse(2000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Feature extraction failed"));
        printResult(getConfirmCode());
        return;
    }
    Serial.println(F("  -> Features extracted"));
    
    // Step 3: Capture second image
    Serial.println(F("  Step 3/4: Remove and place finger again..."));
    delay(2000);
    
    sendCommand(genImg, 1);
    if (readResponse(5000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Capture 2 failed"));
        printResult(getConfirmCode());
        return;
    }
    Serial.println(F("  -> Captured"));
    
    // Step 4: Generate char to buffer 2
    Serial.println(F("  Step 4/4: Generating features (buffer 2)..."));
    uint8_t img2Tz2[] = {0x02, 0x02};  // Img2Tz, buffer 2
    sendCommand(img2Tz2, 2);
    if (readResponse(2000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Feature extraction failed"));
        printResult(getConfirmCode());
        return;
    }
    Serial.println(F("  -> Features extracted"));
    
    // Step 5: Create model (merge buffers)
    Serial.println(F("  Creating template model..."));
    uint8_t regModel[] = {0x05};
    sendCommand(regModel, 1);
    if (readResponse(2000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Model creation failed (fingers didn't match?)"));
        printResult(getConfirmCode());
        return;
    }
    Serial.println(F("  -> Model created"));
    
    // Step 6: Store model at ID 1
    Serial.println(F("  Storing to ID 1..."));
    uint8_t store[] = {0x06, 0x01, 0x00, 0x01};  // Store, buffer 1, ID 1
    sendCommand(store, 4);
    if (readResponse(2000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Storage failed"));
        printResult(getConfirmCode());
        return;
    }
    
    Serial.println(F("  ==================================="));
    Serial.println(F("  -> OK: Enrollment complete!"));
    Serial.println(F("  ==================================="));
}

void cmdVerify() {
    Serial.println(F("\n[TEST 5] Verify - Search for matching finger"));
    Serial.println(F("  Place enrolled finger on sensor..."));
    
    // Capture
    uint8_t genImg[] = {0x01};
    sendCommand(genImg, 1);
    if (readResponse(5000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Capture failed"));
        printResult(getConfirmCode());
        return;
    }
    
    // Generate features
    uint8_t img2Tz[] = {0x02, 0x01};
    sendCommand(img2Tz, 2);
    if (readResponse(2000) == 0 || getConfirmCode() != 0x00) {
        Serial.println(F("  -> FAIL: Feature extraction failed"));
        printResult(getConfirmCode());
        return;
    }
    
    // Search
    Serial.println(F("  Searching database..."));
    uint8_t search[] = {0x04, 0x01, 0x00, 0x00, 0x00, 0xFF};  // Search buffer 1, ID 0-255
    sendCommand(search, 6);
    
    int len = readResponse(3000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        
        if (getConfirmCode() == 0x00 && len >= 14) {
            uint16_t matchId = (respBuffer[10] << 8) | respBuffer[11];
            uint16_t score = (respBuffer[12] << 8) | respBuffer[13];
            Serial.println(F("  ==================================="));
            Serial.print(F("  -> MATCH! ID: "));
            Serial.print(matchId);
            Serial.print(F(", Score: "));
            Serial.println(score);
            Serial.println(F("  ==================================="));
        } else if (getConfirmCode() == 0x09) {
            Serial.println(F("  -> No match found (finger not enrolled?)"));
        } else {
            printResult(getConfirmCode());
        }
    } else {
        Serial.println(F("  -> TIMEOUT"));
    }
}

void cmdDeleteAll() {
    Serial.println(F("\n[TEST 6] Empty - Delete all templates"));
    uint8_t cmd[] = {0x0D};
    sendCommand(cmd, sizeof(cmd));
    
    int len = readResponse(2000);
    if (len > 0) {
        Serial.print("  RX: ");
        printBuffer(respBuffer, len);
        printResult(getConfirmCode());
        if (getConfirmCode() == 0x00) {
            Serial.println(F("  Database cleared."));
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
    Serial.println(F("  FINGER VEIN SENSOR - INCOMING INSPECTION"));
    Serial.println(F("================================================"));
    Serial.println();
    Serial.println(F("!! CRITICAL: Sensor must be powered by 3.3V !!"));
    Serial.println(F("   Using 5V will DESTROY the sensor!"));
    Serial.println();
    
    VeinSerial.begin(VEIN_BAUD, SERIAL_8N1, VEIN_RX_PIN, VEIN_TX_PIN);
    delay(100);
    
    Serial.println(F("Running initial check..."));
    cmdCheckAlive();
    
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
            case '1': cmdCheckAlive(); break;
            case '2': cmdGetTemplateCount(); break;
            case '3': cmdCaptureImage(); break;
            case '4': cmdEnroll(); break;
            case '5': cmdVerify(); break;
            case '6': cmdDeleteAll(); break;
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
