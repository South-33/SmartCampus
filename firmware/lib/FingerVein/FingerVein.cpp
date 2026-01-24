/**
 * Waveshare Finger Vein Scanner Module (A) - ESP32 Library Implementation
 */

#include "FingerVein.h"

FingerVein::FingerVein(HardwareSerial& serial) 
    : _serial(&serial)
    , _deviceAddress(0x00)
    , _timeout(FV_DEFAULT_TIMEOUT)
    , _connected(false)
    , _lastError(FV_ERR_SUCCESS)
    , _statusCallback(nullptr)
{
    memset(_password, '0', 8);
    _password[8] = '\0';
    memset(_txBuffer, 0, FV_PACKET_SIZE);
    memset(_rxBuffer, 0, FV_PACKET_SIZE);
}

bool FingerVein::begin(int rxPin, int txPin, uint8_t deviceAddress) {
    _deviceAddress = deviceAddress;
    _serial->begin(FV_DEFAULT_BAUDRATE, SERIAL_8N1, rxPin, txPin);
    delay(100);  // Allow module to initialize
    clearSerialBuffer();
    return true;
}

void FingerVein::setPassword(const char* password) {
    strncpy(_password, password, 15);
    _password[15] = '\0';
}

void FingerVein::setStatusCallback(FV_StatusCallback callback) {
    _statusCallback = callback;
}

void FingerVein::setTimeout(uint16_t timeoutMs) {
    _timeout = timeoutMs;
}

// ============================================================================
// Connection Methods
// ============================================================================

bool FingerVein::connect() {
    uint8_t data[16] = {0};
    uint8_t passLen = strlen(_password);
    for (uint8_t i = 0; i < passLen && i < 16; i++) {
        data[i] = _password[i];
    }
    
    buildPacket(FV_CMD_CONNECT, data, 8);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    if (getResponseStatus() == FV_ERR_SUCCESS) {
        _connected = true;
        return true;
    }
    
    _lastError = getResponseData()[0];
    return false;
}

bool FingerVein::disconnect() {
    buildPacket(FV_CMD_DISCONNECT, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    if (getResponseStatus() == FV_ERR_SUCCESS) {
        _connected = false;
        return true;
    }
    return false;
}

bool FingerVein::isConnected() {
    return _connected;
}

// ============================================================================
// Device Info Methods
// ============================================================================

bool FingerVein::getDeviceInfo(FV_DeviceInfo& info) {
    buildPacket(FV_CMD_GET_SYSTEM_INFO, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    uint8_t* data = getResponseData();
    if (data[0] == FV_ERR_SUCCESS) {
        info.versionMajor = data[1];
        info.versionMinor = data[2];
        info.deviceId = data[3];
        info.baudRate = data[4];
        info.securityLevel = data[5];
        info.timeout = data[6];
        info.dupCheck = data[7] != 0;
        info.sameFingerCheck = data[8] != 0;
        return true;
    }
    
    _lastError = data[0];
    return false;
}

bool FingerVein::getEnrollInfo(FV_EnrollInfo& info) {
    buildPacket(FV_CMD_GET_ENROLL_INFO, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    uint8_t* data = getResponseData();
    if (data[0] == FV_ERR_SUCCESS) {
        info.userCount = data[1] | (data[2] << 8) | (data[3] << 16) | (data[4] << 24);
        info.maxUsers = data[9] | (data[10] << 8) | (data[11] << 16) | (data[12] << 24);
        return true;
    }
    
    _lastError = data[0];
    return false;
}

bool FingerVein::reboot() {
    buildPacket(FV_CMD_REBOOT, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    _connected = false;
    return getResponseStatus() == FV_ERR_SUCCESS;
}

bool FingerVein::factoryReset() {
    buildPacket(FV_CMD_FACTORY_RESET, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

// ============================================================================
// Settings Methods
// ============================================================================

bool FingerVein::setDeviceId(uint8_t newId) {
    uint8_t data[1] = {newId};
    buildPacket(FV_CMD_SET_DEVICE_ID, data, 1);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    if (getResponseStatus() == FV_ERR_SUCCESS) {
        _deviceAddress = newId;
        return true;
    }
    return false;
}

bool FingerVein::setBaudRate(FV_BaudRate baudRate) {
    uint8_t data[1] = {(uint8_t)baudRate};
    buildPacket(FV_CMD_SET_BAUDRATE, data, 1);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

bool FingerVein::setSecurityLevel(FV_SecurityLevel level) {
    uint8_t data[1] = {(uint8_t)level};
    buildPacket(FV_CMD_SET_SECURITY_LEVEL, data, 1);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

bool FingerVein::setFingerTimeout(uint8_t seconds) {
    if (seconds < 1) seconds = 1;
    uint8_t data[1] = {seconds};
    buildPacket(FV_CMD_SET_TIMEOUT, data, 1);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

bool FingerVein::setDuplicateCheck(bool enable) {
    uint8_t data[1] = {enable ? 1 : 0};
    buildPacket(FV_CMD_SET_DUP_CHECK, data, 1);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

bool FingerVein::setSameFingerCheck(bool enable) {
    uint8_t data[1] = {enable ? 1 : 0};
    buildPacket(FV_CMD_SET_SAME_FINGER, data, 1);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

// ============================================================================
// Finger Operations
// ============================================================================

bool FingerVein::checkFingerPresent() {
    buildPacket(FV_CMD_FINGER_STATUS, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    uint8_t* data = getResponseData();
    if (data[0] == FV_ERR_SUCCESS) {
        return data[1] == 1;  // 1 = finger detected
    }
    return false;
}

int32_t FingerVein::getEmptyId(uint32_t startId, uint32_t endId) {
    uint8_t data[8];
    data[0] = startId & 0xFF;
    data[1] = (startId >> 8) & 0xFF;
    data[2] = (startId >> 16) & 0xFF;
    data[3] = (startId >> 24) & 0xFF;
    data[4] = endId & 0xFF;
    data[5] = (endId >> 8) & 0xFF;
    data[6] = (endId >> 16) & 0xFF;
    data[7] = (endId >> 24) & 0xFF;
    
    buildPacket(FV_CMD_GET_EMPTY_ID, data, 8);
    if (!sendPacket()) return -1;
    if (!receivePacket()) return -1;
    
    uint8_t* respData = getResponseData();
    if (respData[0] == FV_ERR_SUCCESS) {
        return respData[1] | (respData[2] << 8) | (respData[3] << 16) | (respData[4] << 24);
    }
    
    _lastError = respData[0];
    return -1;
}

bool FingerVein::enrollUser(uint32_t userId, uint8_t groupId, uint8_t tempNum) {
    uint8_t data[6];
    data[0] = userId & 0xFF;
    data[1] = (userId >> 8) & 0xFF;
    data[2] = (userId >> 16) & 0xFF;
    data[3] = (userId >> 24) & 0xFF;
    data[4] = groupId;
    data[5] = tempNum;  // Number of successful scans required (usually 3)
    
    buildPacket(FV_CMD_ENROLL, data, 6);
    if (!sendPacket()) return false;
    
    // Enrollment requires multiple responses (place finger, release, repeat)
    while (true) {
        if (!receivePacket(10000)) {  // Longer timeout for finger placement
            _lastError = FV_ERR_TIMEOUT;
            return false;
        }
        
        uint8_t* respData = getResponseData();
        uint8_t status = respData[0];
        
        if (status == FV_ERR_SUCCESS) {
            if (_statusCallback) _statusCallback(status, "Enrollment successful");
            return true;
        }
        else if (status == FV_STATUS_INPUT_FINGER) {
            if (_statusCallback) _statusCallback(status, "Place finger");
        }
        else if (status == FV_STATUS_RELEASE_FINGER) {
            if (_statusCallback) _statusCallback(status, "Release finger");
        }
        else {
            _lastError = respData[1];
            if (_statusCallback) {
                _statusCallback(status, getErrorString(_lastError));
            }
            return false;
        }
    }
}

int32_t FingerVein::verifyUser(uint32_t userId) {
    uint8_t data[4];
    data[0] = userId & 0xFF;
    data[1] = (userId >> 8) & 0xFF;
    data[2] = (userId >> 16) & 0xFF;
    data[3] = (userId >> 24) & 0xFF;
    
    buildPacket(FV_CMD_VERIFY, data, 4);
    if (!sendPacket()) return -1;
    
    // Verification may send status updates before final result
    while (true) {
        if (!receivePacket(10000)) {
            _lastError = FV_ERR_TIMEOUT;
            return -1;
        }
        
        uint8_t* respData = getResponseData();
        uint8_t status = respData[0];
        
        if (status == FV_ERR_SUCCESS) {
            // Return matched user ID
            uint32_t matchedId = respData[1] | (respData[2] << 8) | 
                                 (respData[3] << 16) | (respData[4] << 24);
            if (_statusCallback) _statusCallback(status, "Verification successful");
            return matchedId;
        }
        else if (status == FV_STATUS_INPUT_FINGER) {
            if (_statusCallback) _statusCallback(status, "Place finger");
        }
        else if (status == FV_STATUS_RELEASE_FINGER) {
            if (_statusCallback) _statusCallback(status, "Release finger");
        }
        else {
            _lastError = respData[1];
            if (_statusCallback) {
                _statusCallback(status, getErrorString(_lastError));
            }
            return -1;
        }
    }
}

bool FingerVein::deleteUser(uint32_t userId) {
    uint8_t data[4];
    data[0] = userId & 0xFF;
    data[1] = (userId >> 8) & 0xFF;
    data[2] = (userId >> 16) & 0xFF;
    data[3] = (userId >> 24) & 0xFF;
    
    buildPacket(FV_CMD_CLEAR_ENROLL, data, 4);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    uint8_t* respData = getResponseData();
    if (respData[0] == FV_ERR_SUCCESS) {
        return true;
    }
    
    _lastError = respData[0];
    return false;
}

bool FingerVein::deleteAllUsers() {
    buildPacket(FV_CMD_CLEAR_ALL_ENROLL, nullptr, 0);
    if (!sendPacket()) return false;
    if (!receivePacket(5000)) return false;  // Longer timeout for bulk delete
    
    return getResponseStatus() == FV_ERR_SUCCESS;
}

bool FingerVein::getUserInfo(uint32_t userId, uint8_t& templateCount) {
    uint8_t data[4];
    data[0] = userId & 0xFF;
    data[1] = (userId >> 8) & 0xFF;
    data[2] = (userId >> 16) & 0xFF;
    data[3] = (userId >> 24) & 0xFF;
    
    buildPacket(FV_CMD_GET_ID_INFO, data, 4);
    if (!sendPacket()) return false;
    if (!receivePacket()) return false;
    
    uint8_t* respData = getResponseData();
    if (respData[0] == FV_ERR_SUCCESS) {
        templateCount = respData[1];
        return true;
    }
    
    _lastError = respData[0];
    return false;
}

// ============================================================================
// Error Handling
// ============================================================================

uint8_t FingerVein::getLastError() {
    return _lastError;
}

const char* FingerVein::getErrorString(uint8_t errorCode) {
    switch (errorCode) {
        case FV_ERR_SUCCESS:         return "Success";
        case FV_ERR_FAIL:            return "Operation failed";
        case FV_ERR_COM:             return "Communication error";
        case FV_ERR_DATA:            return "Data checksum error";
        case FV_ERR_INVALID_PWD:     return "Invalid password";
        case FV_ERR_INVALID_PARAM:   return "Invalid parameter";
        case FV_ERR_INVALID_ID:      return "Invalid ID";
        case FV_ERR_EMPTY_ID:        return "ID is empty";
        case FV_ERR_NOT_ENOUGH:      return "Not enough space";
        case FV_ERR_NO_SAME_FINGER:  return "Not the same finger";
        case FV_ERR_DUPLICATION_ID:  return "Duplicate ID";
        case FV_ERR_TIMEOUT:         return "Timeout";
        case FV_ERR_VERIFY:          return "Verification failed";
        case FV_ERR_NO_NULL_ID:      return "No empty ID available";
        case FV_ERR_BREAK_OFF:       return "Communication interrupted";
        case FV_ERR_NO_CONNECT:      return "Not connected";
        case FV_ERR_NO_SUPPORT:      return "Not supported";
        case FV_ERR_NO_VEIN:         return "No vein detected";
        case FV_ERR_MEMORY:          return "Memory error";
        case FV_ERR_NO_DEV:          return "Device not found";
        default:                     return "Unknown error";
    }
}

// ============================================================================
// Internal Methods
// ============================================================================

void FingerVein::buildPacket(uint8_t command, const uint8_t* data, uint8_t dataLen) {
    memset(_txBuffer, 0, FV_PACKET_SIZE);
    
    // Prefix (little-endian 0xAABB)
    _txBuffer[0] = 0xBB;
    _txBuffer[1] = 0xAA;
    
    // Address
    _txBuffer[2] = _deviceAddress;
    
    // Command
    _txBuffer[3] = command;
    
    // Encode (reserved)
    _txBuffer[4] = 0x00;
    
    // Data length
    _txBuffer[5] = dataLen;
    
    // Data
    if (data != nullptr && dataLen > 0) {
        for (uint8_t i = 0; i < dataLen && i < FV_DATA_SIZE; i++) {
            _txBuffer[6 + i] = data[i];
        }
    }
    
    // Checksum
    uint16_t checksum = calculateChecksum(_txBuffer);
    _txBuffer[22] = checksum & 0xFF;
    _txBuffer[23] = (checksum >> 8) & 0xFF;
}

bool FingerVein::sendPacket() {
    clearSerialBuffer();
    size_t written = _serial->write(_txBuffer, FV_PACKET_SIZE);
    _serial->flush();
    return written == FV_PACKET_SIZE;
}

bool FingerVein::receivePacket(uint16_t timeout) {
    if (timeout == 0) timeout = _timeout;
    
    uint32_t startTime = millis();
    uint8_t bytesRead = 0;
    
    memset(_rxBuffer, 0, FV_PACKET_SIZE);
    
    while (bytesRead < FV_PACKET_SIZE) {
        if (millis() - startTime > timeout) {
            _lastError = FV_ERR_TIMEOUT;
            return false;
        }
        
        if (_serial->available()) {
            _rxBuffer[bytesRead++] = _serial->read();
        }
    }
    
    return validateResponse();
}

uint16_t FingerVein::calculateChecksum(const uint8_t* buffer) {
    uint16_t checksum = 0;
    for (uint8_t i = 0; i < 22; i++) {
        checksum += buffer[i];
    }
    return checksum;
}

bool FingerVein::validateResponse() {
    // Check prefix
    if (_rxBuffer[0] != 0xBB || _rxBuffer[1] != 0xAA) {
        _lastError = FV_ERR_COM;
        return false;
    }
    
    // Check checksum
    uint16_t expectedChecksum = _rxBuffer[22] | (_rxBuffer[23] << 8);
    uint16_t calculatedChecksum = calculateChecksum(_rxBuffer);
    
    if (expectedChecksum != calculatedChecksum) {
        _lastError = FV_ERR_DATA;
        return false;
    }
    
    return true;
}

void FingerVein::clearSerialBuffer() {
    while (_serial->available()) {
        _serial->read();
    }
}

uint8_t FingerVein::getResponseStatus() {
    return _rxBuffer[6];  // First byte of data is status
}

uint8_t* FingerVein::getResponseData() {
    return &_rxBuffer[6];  // Data starts at byte 6
}
