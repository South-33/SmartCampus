#ifndef FACE_AUTH_H
#define FACE_AUTH_H

#include <Arduino.h>
#include "config.h"

// =============================================================================
// HLK-TX510 FACE RECOGNITION MODULE DRIVER
// Protocol: UART 115200 8N1
// Frame format: Header(2) + MsgId(2) + Len(2) + Data(N) + Checksum(1) + Tail(2)
// 
// Security features:
// - Proper buffer bounds checking
// - Checksum verification
// - Timeout handling
// - Liveness detection enabled by default
// =============================================================================

class FaceAuth {
public:
    enum State { IDLE, ENROLLING, VERIFYING, ERROR };

    // Response buffer size - must be large enough for any expected response
    static constexpr size_t RESP_BUFFER_SIZE = 64;
    static constexpr uint16_t MAX_DATA_LEN = RESP_BUFFER_SIZE;

    static bool begin(HardwareSerial& serial, int rxPin = -1, int txPin = -1) {
        _serial = &serial;
        if (rxPin >= 0 && txPin >= 0) {
            _serial->begin(FACE_BAUD, SERIAL_8N1, rxPin, txPin);
        } else {
            _serial->begin(FACE_BAUD);
        }
        delay(500);
        
        // Verify module is responding
        if (!queryModuleInfo()) {
            DEBUG_PRINTLN("[FACE] Module not responding!");
            return false;
        }
        
        // Enable liveness detection (anti-spoofing)
        setLiveDetection(true);
        DEBUG_PRINTLN("[FACE] Module initialized with liveness detection");
        return true;
    }

    static bool startEnroll(uint16_t userId) {
        if (userId == 0 || userId > 1000) {
            DEBUG_PRINTLN("[FACE] Invalid user ID for enrollment");
            return false;
        }
        _state = ENROLLING;
        uint8_t data[] = {
            (uint8_t)(userId >> 8), 
            (uint8_t)(userId & 0xFF), 
            0x00  // timeout: 0 = infinite (until cancel)
        };
        return sendFrame(0x0002, data, sizeof(data));
    }

    static bool isEnrollComplete() {
        if (receiveFrame(100)) {
            if (_lastMsgId == 0x0002 && _dataLen > 0 && _respBuffer[0] == 0x00) {
                _state = IDLE;
                DEBUG_PRINTLN("[FACE] Enrollment complete");
                return true;
            }
        }
        return false;
    }

    static int verifyOnce() {
        _state = VERIFYING;
        uint8_t data[] = {0x00}; // timeout
        if (sendFrame(0x0003, data, sizeof(data))) {
            if (receiveFrame(3000)) {
                if (_lastMsgId == 0x0003 && _dataLen >= 3 && _respBuffer[0] == 0x00) {
                    uint16_t matchedId = (_respBuffer[1] << 8) | _respBuffer[2];
                    _state = IDLE;
                    DEBUG_PRINTF("[FACE] Verified: User ID %d\n", matchedId);
                    return matchedId;
                }
            }
        }
        _state = IDLE;
        return -1;
    }

    static void setLiveDetection(bool enabled) {
        uint8_t data[] = {0x01, (uint8_t)(enabled ? 0x01 : 0x00)};
        sendFrame(0x0010, data, sizeof(data));
        receiveFrame(500); // Wait for ACK
    }

    static bool remove(uint16_t userId) {
        uint8_t data[] = {(uint8_t)(userId >> 8), (uint8_t)(userId & 0xFF)};
        if (sendFrame(0x0004, data, sizeof(data)) && receiveFrame(500)) {
            return _dataLen > 0 && _respBuffer[0] == 0x00;
        }
        return false;
    }

    static bool reset() {
        if (sendFrame(0x0005, nullptr, 0) && receiveFrame(1000)) {
            return _dataLen > 0 && _respBuffer[0] == 0x00;
        }
        return false;
    }

    static bool queryModuleInfo() {
        if (sendFrame(0x0000, nullptr, 0) && receiveFrame(1000)) {
            return _lastMsgId == 0x0000 && _dataLen > 0;
        }
        return false;
    }

    static State getState() { return _state; }
    static uint16_t getLastMsgId() { return _lastMsgId; }

private:
    static HardwareSerial* _serial;
    static State _state;
    static uint8_t _respBuffer[RESP_BUFFER_SIZE];
    static uint16_t _lastMsgId;
    static uint16_t _dataLen;

    static bool sendFrame(uint16_t msgId, const uint8_t* data, uint16_t len) {
        if (len > MAX_DATA_LEN) {
            DEBUG_PRINTLN("[FACE] sendFrame: data too large");
            return false;
        }

        uint8_t header[] = {0xEF, 0xAA};
        uint8_t tail[] = {0xFE, 0xFE};
        uint8_t checksum = 0;

        _serial->write(header, 2);
        
        // Message ID
        uint8_t msgIdBytes[] = {(uint8_t)(msgId >> 8), (uint8_t)(msgId & 0xFF)};
        _serial->write(msgIdBytes, 2);
        checksum ^= msgIdBytes[0] ^ msgIdBytes[1];

        // Length
        uint8_t lenBytes[] = {(uint8_t)(len >> 8), (uint8_t)(len & 0xFF)};
        _serial->write(lenBytes, 2);
        checksum ^= lenBytes[0] ^ lenBytes[1];

        // Data
        for (uint16_t i = 0; i < len; i++) {
            _serial->write(data[i]);
            checksum ^= data[i];
        }

        _serial->write(checksum);
        _serial->write(tail, 2);
        _serial->flush();
        return true;
    }

    static bool receiveFrame(uint32_t timeout) {
        uint32_t start = millis();
        uint8_t pos = 0;
        uint16_t dataLen = 0;
        uint8_t stage = 0;  // 0:header, 1:msgId, 2:len, 3:data, 4:checksum, 5:tail
        uint8_t frameChecksum = 0;
        uint8_t calcChecksum = 0;
        uint8_t tempBuf[4];  // Temporary buffer for msgId and len

        _dataLen = 0;
        _lastMsgId = 0;

        while (millis() - start < timeout) {
            if (_serial->available()) {
                uint8_t b = _serial->read();
                
                switch (stage) {
                    case 0: // Header: 0xEF 0xAA
                        if (pos == 0 && b == 0xEF) {
                            pos = 1;
                        } else if (pos == 1 && b == 0xAA) {
                            stage = 1;
                            pos = 0;
                            calcChecksum = 0;
                        } else {
                            pos = 0;
                        }
                        break;

                    case 1: // MsgId (2 bytes)
                        tempBuf[pos++] = b;
                        calcChecksum ^= b;
                        if (pos == 2) {
                            _lastMsgId = (tempBuf[0] << 8) | tempBuf[1];
                            stage = 2;
                            pos = 0;
                        }
                        break;

                    case 2: // Length (2 bytes)
                        tempBuf[pos++] = b;
                        calcChecksum ^= b;
                        if (pos == 2) {
                            dataLen = (tempBuf[0] << 8) | tempBuf[1];
                            // CRITICAL: Validate length to prevent buffer overflow
                            if (dataLen > MAX_DATA_LEN) {
                                DEBUG_PRINTF("[FACE] Frame too large: %d bytes\n", dataLen);
                                return false;
                            }
                            stage = (dataLen > 0) ? 3 : 4;
                            pos = 0;
                        }
                        break;

                    case 3: // Data
                        if (pos < dataLen && pos < RESP_BUFFER_SIZE) {
                            _respBuffer[pos++] = b;
                            calcChecksum ^= b;
                        }
                        if (pos >= dataLen) {
                            _dataLen = dataLen;
                            stage = 4;
                        }
                        break;

                    case 4: // Checksum
                        frameChecksum = b;
                        if (frameChecksum != calcChecksum) {
                            DEBUG_PRINTF("[FACE] Checksum mismatch: got 0x%02X, expected 0x%02X\n", 
                                frameChecksum, calcChecksum);
                            return false;
                        }
                        stage = 5;
                        pos = 0;
                        break;

                    case 5: // Tail: 0xFE 0xFE
                        if (pos == 0 && b == 0xFE) {
                            pos = 1;
                        } else if (pos == 1 && b == 0xFE) {
                            return true;  // Frame received successfully
                        } else {
                            DEBUG_PRINTLN("[FACE] Invalid tail");
                            return false;
                        }
                        break;
                }
            }
            yield();
        }
        
        DEBUG_PRINTLN("[FACE] Receive timeout");
        return false;
    }
};

// Static member definitions
inline HardwareSerial* FaceAuth::_serial = nullptr;
inline FaceAuth::State FaceAuth::_state = FaceAuth::IDLE;
inline uint8_t FaceAuth::_respBuffer[FaceAuth::RESP_BUFFER_SIZE] = {0};
inline uint16_t FaceAuth::_lastMsgId = 0;
inline uint16_t FaceAuth::_dataLen = 0;

#endif // FACE_AUTH_H
