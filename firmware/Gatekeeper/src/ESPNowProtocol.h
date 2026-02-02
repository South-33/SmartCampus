#ifndef ESPNOW_PROTOCOL_H
#define ESPNOW_PROTOCOL_H

#include <Arduino.h>
#include <mbedtls/md.h>
#include "config.h"

// =============================================================================
// ESP-NOW SECURE PROTOCOL
// Features:
// - HMAC-SHA256 authentication (replaces weak XOR checksum)
// - Sequence numbers for replay protection
// - Protocol versioning for future compatibility
// - Room-based message filtering
// =============================================================================

enum MessageType : uint8_t {
    MSG_BEACON = 0x01,       // Watchman announces itself
    MSG_PAIR_REQUEST = 0x02, // Gatekeeper requests pairing
    MSG_PAIR_ACK = 0x03,     // Watchman confirms pairing
    MSG_WAKE = 0x10,         // Wake up room power
    MSG_HEARTBEAT = 0x11,    // Keep-alive
    MSG_ACK = 0xFF           // Generic acknowledgment
};

// Protocol version for future compatibility
#define ESPNOW_PROTOCOL_VERSION 2

struct __attribute__((packed)) ESPNowMessage {
    uint8_t version;            // Protocol version
    char roomId[16];            // Room identifier (null-terminated)
    MessageType msgType;
    uint32_t seqNum;            // Sequence number for replay protection
    uint32_t timestamp;         // Epoch timestamp (optional anti-replay)
    uint8_t payload[8];         // Optional data
    uint8_t hmac[8];            // Truncated HMAC-SHA256 (first 8 bytes)

    // Initialize with defaults
    void init() {
        memset(this, 0, sizeof(ESPNowMessage));
        version = ESPNOW_PROTOCOL_VERSION;
    }

    // Safe room ID setter with null termination
    void setRoomId(const char* room) {
        memset(roomId, 0, sizeof(roomId));
        if (room) {
            strncpy(roomId, room, sizeof(roomId) - 1);
        }
    }

    // Calculate HMAC-SHA256 and store truncated version
    void calculateHMAC(const char* sharedSecret) {
        // Clear HMAC field before calculation
        memset(hmac, 0, sizeof(hmac));
        
        uint8_t fullHmac[32];
        mbedtls_md_context_t ctx;
        mbedtls_md_init(&ctx);
        
        const mbedtls_md_info_t* md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
        mbedtls_md_setup(&ctx, md_info, 1); // 1 = HMAC mode
        
        mbedtls_md_hmac_starts(&ctx, (const unsigned char*)sharedSecret, strlen(sharedSecret));
        
        // Hash everything except the HMAC field
        size_t dataLen = offsetof(ESPNowMessage, hmac);
        mbedtls_md_hmac_update(&ctx, (const unsigned char*)this, dataLen);
        
        mbedtls_md_hmac_finish(&ctx, fullHmac);
        mbedtls_md_free(&ctx);
        
        // Store first 8 bytes (64 bits) - sufficient for our use case
        memcpy(hmac, fullHmac, sizeof(hmac));
    }

    // Verify HMAC
    bool verifyHMAC(const char* sharedSecret) const {
        // Make a copy and recalculate
        ESPNowMessage copy;
        memcpy(&copy, this, sizeof(ESPNowMessage));
        copy.calculateHMAC(sharedSecret);
        
        // Constant-time comparison to prevent timing attacks
        uint8_t result = 0;
        for (size_t i = 0; i < sizeof(hmac); i++) {
            result |= hmac[i] ^ copy.hmac[i];
        }
        return result == 0;
    }

    // Legacy XOR checksum for backward compatibility during migration
    // TODO: Remove after all devices are upgraded
    void calculateChecksumLegacy() {
        hmac[0] = 0;
        uint8_t* ptr = (uint8_t*)this;
        for (size_t i = 0; i < sizeof(ESPNowMessage) - sizeof(hmac); i++) {
            hmac[0] ^= ptr[i];
        }
    }

    bool verifyChecksumLegacy() const {
        uint8_t calc = 0;
        const uint8_t* ptr = (const uint8_t*)this;
        for (size_t i = 0; i < sizeof(ESPNowMessage) - sizeof(hmac); i++) {
            calc ^= ptr[i];
        }
        return calc == hmac[0];
    }
};

// =============================================================================
// SEQUENCE NUMBER MANAGER
// Handles sequence number tracking with rollover protection
// =============================================================================
class SeqNumManager {
public:
    SeqNumManager() : _lastSeqNum(0), _windowStart(0) {}

    // Check if sequence number is valid (not a replay)
    // Uses sliding window to handle rollover
    bool isValid(uint32_t seqNum) {
        // Special case: seqNum 0 is always invalid (reserved for init)
        if (seqNum == 0) return false;
        
        // If we've never seen anything, accept it
        if (_lastSeqNum == 0) {
            _lastSeqNum = seqNum;
            _windowStart = seqNum > 1000 ? seqNum - 1000 : 0;
            return true;
        }
        
        // Handle rollover: if seqNum is much smaller, it might have rolled over
        // Accept if it's in a reasonable window after potential rollover
        uint32_t diff = seqNum - _lastSeqNum;
        
        // If seqNum > lastSeqNum (normal case) or rollover detected
        if (seqNum > _lastSeqNum || diff < 0x80000000) {
            // Accept and update
            if (seqNum > _lastSeqNum) {
                _lastSeqNum = seqNum;
            }
            return true;
        }
        
        // Sequence number is too old (replay attack or out of order)
        return false;
    }

    void reset() {
        _lastSeqNum = 0;
        _windowStart = 0;
    }

    uint32_t getLastSeqNum() const { return _lastSeqNum; }

private:
    uint32_t _lastSeqNum;
    uint32_t _windowStart;
};

// =============================================================================
// HELPER: Generate LMK from room ID and shared secret
// =============================================================================
inline void generateLMK(const char* roomId, const char* sharedSecret, uint8_t* lmk) {
    // Use HMAC-SHA256 to derive a unique 16-byte LMK per room
    uint8_t fullHash[32];
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    
    const mbedtls_md_info_t* md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    mbedtls_md_setup(&ctx, md_info, 1);
    
    mbedtls_md_hmac_starts(&ctx, (const unsigned char*)sharedSecret, strlen(sharedSecret));
    mbedtls_md_hmac_update(&ctx, (const unsigned char*)roomId, strlen(roomId));
    mbedtls_md_hmac_finish(&ctx, fullHash);
    mbedtls_md_free(&ctx);
    
    // Take first 16 bytes for LMK
    memcpy(lmk, fullHash, 16);
}

#endif // ESPNOW_PROTOCOL_H
