/**
 * Waveshare Finger Vein Scanner Module (A) - ESP32 Library
 * 
 * Based on official Waveshare protocol documentation
 * UART: 57600 baud, 8N1
 * Voltage: 3.3V
 * 
 * Protocol: 24-byte fixed packet structure
 * - Prefix: 0xBB 0xAA (little-endian 0xAABB)
 * - Address: 1 byte (default 0x00)
 * - Command: 1 byte
 * - Encode: 1 byte (reserved)
 * - DataLen: 1 byte
 * - Data: 16 bytes
 * - Checksum: 2 bytes (sum of first 22 bytes, little-endian)
 */

#ifndef FINGER_VEIN_H
#define FINGER_VEIN_H

#include <Arduino.h>
#include <HardwareSerial.h>

// Protocol constants
#define FV_PREFIX_CODE      0xAABB
#define FV_PACKET_SIZE      24
#define FV_DATA_SIZE        16
#define FV_DEFAULT_BAUDRATE 57600
#define FV_DEFAULT_TIMEOUT  3000  // ms

// Command codes
#define FV_CMD_CONNECT              0x01
#define FV_CMD_DISCONNECT           0x02
#define FV_CMD_GET_SYSTEM_INFO      0x03
#define FV_CMD_FACTORY_RESET        0x04
#define FV_CMD_SET_DEVICE_ID        0x05
#define FV_CMD_SET_BAUDRATE         0x06
#define FV_CMD_SET_SECURITY_LEVEL   0x07
#define FV_CMD_SET_TIMEOUT          0x08
#define FV_CMD_SET_DUP_CHECK        0x09
#define FV_CMD_SET_PASSWORD         0x0A
#define FV_CMD_CHECK_PASSWORD       0x0B
#define FV_CMD_REBOOT               0x0C
#define FV_CMD_SET_SAME_FINGER      0x0D
#define FV_CMD_FINGER_STATUS        0x10
#define FV_CMD_CLEAR_ENROLL         0x11
#define FV_CMD_CLEAR_ALL_ENROLL     0x12
#define FV_CMD_GET_EMPTY_ID         0x13
#define FV_CMD_GET_ENROLL_INFO      0x14
#define FV_CMD_GET_ID_INFO          0x15
#define FV_CMD_ENROLL               0x16
#define FV_CMD_VERIFY               0x17

// Error codes
#define FV_ERR_SUCCESS              0x00
#define FV_ERR_FAIL                 0x01
#define FV_ERR_COM                  0x02
#define FV_ERR_DATA                 0x03
#define FV_ERR_INVALID_PWD          0x04
#define FV_ERR_INVALID_PARAM        0x05
#define FV_ERR_INVALID_ID           0x06
#define FV_ERR_EMPTY_ID             0x07
#define FV_ERR_NOT_ENOUGH           0x08
#define FV_ERR_NO_SAME_FINGER       0x09
#define FV_ERR_DUPLICATION_ID       0x0A
#define FV_ERR_TIMEOUT              0x0B
#define FV_ERR_VERIFY               0x0C
#define FV_ERR_NO_NULL_ID           0x0D
#define FV_ERR_BREAK_OFF            0x0E
#define FV_ERR_NO_CONNECT           0x0F
#define FV_ERR_NO_SUPPORT           0x10
#define FV_ERR_NO_VEIN              0x11
#define FV_ERR_MEMORY               0x12
#define FV_ERR_NO_DEV               0x13

// Status codes (during enrollment/verification)
#define FV_STATUS_INPUT_FINGER      0x20
#define FV_STATUS_RELEASE_FINGER    0x21

// Baud rate options
enum FV_BaudRate {
    FV_BAUD_9600   = 0,
    FV_BAUD_19200  = 1,
    FV_BAUD_38400  = 2,
    FV_BAUD_57600  = 3,  // Default
    FV_BAUD_115200 = 4
};

// Security levels
enum FV_SecurityLevel {
    FV_SECURITY_LOW    = 0,
    FV_SECURITY_MEDIUM = 1,
    FV_SECURITY_HIGH   = 2
};

// Device info structure
struct FV_DeviceInfo {
    uint8_t versionMajor;
    uint8_t versionMinor;
    uint8_t deviceId;
    uint8_t baudRate;
    uint8_t securityLevel;
    uint8_t timeout;
    bool dupCheck;
    bool sameFingerCheck;
};

// Enrollment info structure
struct FV_EnrollInfo {
    uint32_t userCount;
    uint32_t maxUsers;
};

// Callback type for enrollment/verification status
typedef void (*FV_StatusCallback)(uint8_t status, const char* message);

class FingerVein {
public:
    FingerVein(HardwareSerial& serial);
    
    // Initialization
    bool begin(int rxPin = 16, int txPin = 17, uint8_t deviceAddress = 0x00);
    void setPassword(const char* password);
    void setStatusCallback(FV_StatusCallback callback);
    void setTimeout(uint16_t timeoutMs);
    
    // Connection
    bool connect();
    bool disconnect();
    bool isConnected();
    
    // Device info
    bool getDeviceInfo(FV_DeviceInfo& info);
    bool getEnrollInfo(FV_EnrollInfo& info);
    bool reboot();
    bool factoryReset();
    
    // Settings
    bool setDeviceId(uint8_t newId);
    bool setBaudRate(FV_BaudRate baudRate);
    bool setSecurityLevel(FV_SecurityLevel level);
    bool setFingerTimeout(uint8_t seconds);
    bool setDuplicateCheck(bool enable);
    bool setSameFingerCheck(bool enable);
    
    // Finger operations
    bool checkFingerPresent();
    int32_t getEmptyId(uint32_t startId = 0, uint32_t endId = 100);
    bool enrollUser(uint32_t userId, uint8_t groupId = 1, uint8_t tempNum = 3);
    int32_t verifyUser(uint32_t userId = 0);  // 0 = 1:N mode, >0 = 1:1 mode
    bool deleteUser(uint32_t userId);
    bool deleteAllUsers();
    bool getUserInfo(uint32_t userId, uint8_t& templateCount);
    
    // Error handling
    uint8_t getLastError();
    const char* getErrorString(uint8_t errorCode);
    
private:
    HardwareSerial* _serial;
    uint8_t _deviceAddress;
    char _password[16];
    uint16_t _timeout;
    bool _connected;
    uint8_t _lastError;
    FV_StatusCallback _statusCallback;
    
    // Packet buffers
    uint8_t _txBuffer[FV_PACKET_SIZE];
    uint8_t _rxBuffer[FV_PACKET_SIZE];
    
    // Internal methods
    void buildPacket(uint8_t command, const uint8_t* data, uint8_t dataLen);
    bool sendPacket();
    bool receivePacket(uint16_t timeout = 0);
    uint16_t calculateChecksum(const uint8_t* buffer);
    bool validateResponse();
    void clearSerialBuffer();
    
    // Response data access
    uint8_t getResponseStatus();
    uint8_t* getResponseData();
};

#endif // FINGER_VEIN_H
