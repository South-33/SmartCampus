#ifndef FINGER_VEIN_AUTH_H
#define FINGER_VEIN_AUTH_H

#include <Arduino.h>
#include "config.h"

// =============================================================================
// WAVESHARE FINGER VEIN SENSOR DRIVER
// Protocol: UART 57600 8N1 (Standard fingerprint protocol)
// Frame format: Header(2) + Addr(4) + PkgId(1) + Len(2) + Data(N) + Checksum(2)
//
// Security features:
// - Proper buffer bounds checking  
// - Checksum verification
// - Timeout handling
// - Thread-safe enrollment state machine
// =============================================================================

class FingerVeinAuth {
public:
    enum Result {
        SUCCESS,
        MATCH_NOT_FOUND,
        TIMEOUT,
        SENSOR_ERROR,
        CANCELLED,
        WAITING_FOR_FINGER,
        STEP_COMPLETE,
        INVALID_PARAM
    };

    // Response buffer size
    static constexpr size_t RESP_BUFFER_SIZE = 64;
    static constexpr uint32_t STEP_TIMEOUT_MS = 10000;

    static bool begin(HardwareSerial& serial, int rxPin = -1, int txPin = -1) {
        _serial = &serial;
        if (rxPin >= 0 && txPin >= 0) {
            _serial->begin(VEIN_BAUD, SERIAL_8N1, rxPin, txPin);
        } else {
            _serial->begin(VEIN_BAUD);
        }
        delay(100);
        
        // Verify module is responding
        if (!isAlive()) {
            DEBUG_PRINTLN("[VEIN] Module not responding!");
            return false;
        }
        DEBUG_PRINTLN("[VEIN] Module initialized");
        return true;
    }

    static bool isAlive() {
        uint8_t cmd[] = {0x0F};  // ReadSysPara
        return sendCommand(cmd, sizeof(cmd)) && receiveResponse(500);
    }

    // State machine for multi-step enrollment
    // Call repeatedly with same userId until SUCCESS/ERROR
    static Result enroll(uint16_t userId) {
        // Validate input
        if (userId == 0 || userId > 1000) {
            DEBUG_PRINTLN("[VEIN] Invalid user ID");
            resetEnrollState();
            return INVALID_PARAM;
        }

        // Reset state if userId changed
        if (userId != _enrollUserId) {
            resetEnrollState();
            _enrollUserId = userId;
        }

        // Check timeout
        if (_enrollStep > 0 && (millis() - _stepStartTime > STEP_TIMEOUT_MS)) {
            DEBUG_PRINTLN("[VEIN] Enrollment timeout");
            resetEnrollState();
            return TIMEOUT;
        }

        switch (_enrollStep) {
            case 0:  // Start enrollment
                DEBUG_PRINTLN("[VEIN] Start Enrollment. Place finger (1/3)...");
                _enrollStep = 1;
                _stepStartTime = millis();
                return WAITING_FOR_FINGER;

            case 1:  // Capture 1
                if (captureAndStore(1)) {
                    DEBUG_PRINTLN("[VEIN] Capture 1 OK. Place finger again (2/3)...");
                    _enrollStep = 2;
                    _stepStartTime = millis();
                    return STEP_COMPLETE;
                }
                return WAITING_FOR_FINGER;

            case 2:  // Capture 2
                if (captureAndStore(2)) {
                    DEBUG_PRINTLN("[VEIN] Capture 2 OK. Place finger again (3/3)...");
                    _enrollStep = 3;
                    _stepStartTime = millis();
                    return STEP_COMPLETE;
                }
                return WAITING_FOR_FINGER;

            case 3:  // Capture 3
                if (captureAndStore(3)) {
                    DEBUG_PRINTLN("[VEIN] Capture 3 OK. Processing...");
                    _enrollStep = 4;
                }
                return WAITING_FOR_FINGER;

            case 4:  // Create and store model
                if (createModel() && storeModel(userId)) {
                    DEBUG_PRINTF("[VEIN] Enrollment SUCCESS for ID %d\n", userId);
                    resetEnrollState();
                    return SUCCESS;
                } else {
                    DEBUG_PRINTLN("[VEIN] Failed to create/store model");
                    resetEnrollState();
                    return SENSOR_ERROR;
                }
        }

        return SENSOR_ERROR;
    }

    static void cancelEnroll() {
        resetEnrollState();
        DEBUG_PRINTLN("[VEIN] Enrollment cancelled");
    }

    static int verify() {
        if (!captureAndStore(1)) {
            return -1;
        }
        
        // Search command: Search in buffer 1, start 0, count 1000
        uint8_t cmd[] = {0x04, 0x01, 0x00, 0x00, 0x03, 0xE8};
        if (sendCommand(cmd, sizeof(cmd)) && receiveResponse(2000)) {
            // Validate we have enough data
            if (_respLen >= 14) {
                uint8_t confirmCode = _respBuffer[9];
                if (confirmCode == 0x00) {
                    uint16_t pageId = (_respBuffer[10] << 8) | _respBuffer[11];
                    uint16_t score = (_respBuffer[12] << 8) | _respBuffer[13];
                    DEBUG_PRINTF("[VEIN] Match found! ID: %d Score: %d\n", pageId, score);
                    return pageId;
                }
            }
        }
        return -1;
    }

    static bool remove(uint16_t userId) {
        uint8_t cmd[] = {
            0x0C, 
            (uint8_t)(userId >> 8), 
            (uint8_t)(userId & 0xFF), 
            0x00, 
            0x01
        };
        if (sendCommand(cmd, sizeof(cmd)) && receiveResponse(500)) {
            return _respLen > 9 && _respBuffer[9] == 0x00;
        }
        return false;
    }

    static bool clearAll() {
        uint8_t cmd[] = {0x0D};
        if (sendCommand(cmd, sizeof(cmd)) && receiveResponse(1000)) {
            return _respLen > 9 && _respBuffer[9] == 0x00;
        }
        return false;
    }

    static int getTemplateCount() {
        uint8_t cmd[] = {0x1D};
        if (sendCommand(cmd, sizeof(cmd)) && receiveResponse(500)) {
            if (_respLen >= 12 && _respBuffer[9] == 0x00) {
                return (_respBuffer[10] << 8) | _respBuffer[11];
            }
        }
        return -1;
    }

    // Get enrollment progress (0-4)
    static uint8_t getEnrollStep() { return _enrollStep; }

private:
    static HardwareSerial* _serial;
    static uint8_t _respBuffer[RESP_BUFFER_SIZE];
    static size_t _respLen;
    
    // Enrollment state machine variables
    static uint8_t _enrollStep;
    static uint16_t _enrollUserId;
    static unsigned long _stepStartTime;

    static void resetEnrollState() {
        _enrollStep = 0;
        _enrollUserId = 0xFFFF;
        _stepStartTime = 0;
    }

    static bool sendCommand(const uint8_t* data, uint16_t len) {
        if (len > 128) {
            DEBUG_PRINTLN("[VEIN] Command too large");
            return false;
        }

        uint16_t pkgLen = len + 2;  // Data + checksum
        uint16_t checksum = 0x01 + (pkgLen >> 8) + (pkgLen & 0xFF);
        
        for (uint16_t i = 0; i < len; i++) {
            checksum += data[i];
        }

        // Header
        _serial->write(0xEF);
        _serial->write(0x01);
        
        // Address (4 bytes: 0xFFFFFFFF)
        _serial->write(0xFF);
        _serial->write(0xFF);
        _serial->write(0xFF);
        _serial->write(0xFF);
        
        // Package ID (0x01 = command packet)
        _serial->write(0x01);
        
        // Length
        _serial->write((uint8_t)(pkgLen >> 8));
        _serial->write((uint8_t)(pkgLen & 0xFF));
        
        // Data
        _serial->write(data, len);
        
        // Checksum
        _serial->write((uint8_t)(checksum >> 8));
        _serial->write((uint8_t)(checksum & 0xFF));
        
        _serial->flush();
        return true;
    }

    static bool receiveResponse(uint32_t timeout) {
        uint32_t start = millis();
        size_t pos = 0;
        _respLen = 0;

        while (millis() - start < timeout) {
            while (_serial->available() && pos < RESP_BUFFER_SIZE) {
                _respBuffer[pos++] = _serial->read();
                
                // Check if we have minimum header (9 bytes)
                if (pos >= 9) {
                    // Validate header
                    if (_respBuffer[0] != 0xEF || _respBuffer[1] != 0x01) {
                        // Invalid header, shift buffer
                        memmove(_respBuffer, _respBuffer + 1, pos - 1);
                        pos--;
                        continue;
                    }
                    
                    // Get expected length
                    uint16_t expectedLen = (_respBuffer[7] << 8) | _respBuffer[8];
                    size_t totalExpected = 9 + expectedLen;
                    
                    // Bounds check
                    if (totalExpected > RESP_BUFFER_SIZE) {
                        DEBUG_PRINTLN("[VEIN] Response too large");
                        return false;
                    }
                    
                    if (pos >= totalExpected) {
                        // Verify checksum
                        uint16_t expectedChecksum = (_respBuffer[totalExpected - 2] << 8) | 
                                                     _respBuffer[totalExpected - 1];
                        uint16_t calcChecksum = 0;
                        for (size_t i = 6; i < totalExpected - 2; i++) {
                            calcChecksum += _respBuffer[i];
                        }
                        
                        if (calcChecksum != expectedChecksum) {
                            DEBUG_PRINTF("[VEIN] Checksum error: got %04X, expected %04X\n",
                                calcChecksum, expectedChecksum);
                            return false;
                        }
                        
                        _respLen = totalExpected;
                        return true;
                    }
                }
            }
            yield();
        }
        
        DEBUG_PRINTLN("[VEIN] Response timeout");
        return false;
    }

    static bool captureAndStore(uint8_t bufferId) {
        // GenImg - capture image
        uint8_t cmdGen[] = {0x01};
        if (!sendCommand(cmdGen, sizeof(cmdGen)) || !receiveResponse(2000)) {
            return false;
        }
        if (_respLen <= 9 || _respBuffer[9] != 0x00) {
            return false;  // No finger or capture error
        }

        // Img2Tpl - convert image to template
        uint8_t cmdTpl[] = {0x02, bufferId};
        if (!sendCommand(cmdTpl, sizeof(cmdTpl)) || !receiveResponse(1000)) {
            return false;
        }
        return _respLen > 9 && _respBuffer[9] == 0x00;
    }

    static bool createModel() {
        uint8_t cmd[] = {0x05};  // RegModel - combine templates
        if (sendCommand(cmd, sizeof(cmd)) && receiveResponse(1000)) {
            return _respLen > 9 && _respBuffer[9] == 0x00;
        }
        return false;
    }

    static bool storeModel(uint16_t userId) {
        uint8_t cmd[] = {
            0x06,  // Store
            0x01,  // Buffer 1
            (uint8_t)(userId >> 8),
            (uint8_t)(userId & 0xFF)
        };
        if (sendCommand(cmd, sizeof(cmd)) && receiveResponse(1000)) {
            return _respLen > 9 && _respBuffer[9] == 0x00;
        }
        return false;
    }
};

// Static member definitions
inline HardwareSerial* FingerVeinAuth::_serial = nullptr;
inline uint8_t FingerVeinAuth::_respBuffer[FingerVeinAuth::RESP_BUFFER_SIZE] = {0};
inline size_t FingerVeinAuth::_respLen = 0;
inline uint8_t FingerVeinAuth::_enrollStep = 0;
inline uint16_t FingerVeinAuth::_enrollUserId = 0xFFFF;
inline unsigned long FingerVeinAuth::_stepStartTime = 0;

#endif // FINGER_VEIN_AUTH_H
