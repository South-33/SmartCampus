/**
 * SchoolNFC - Node A (Gatekeeper) Finger Vein Example
 * 
 * Demonstrates integration of Waveshare Finger Vein Scanner with ESP32
 * for classroom access control.
 * 
 * Wiring (ESP32 #1):
 * - Finger Vein TX -> GPIO 16 (UART2 RX)
 * - Finger Vein RX -> GPIO 17 (UART2 TX)
 * - Finger Vein VCC -> 3.3V
 * - Finger Vein GND -> GND
 */

#include <Arduino.h>
#include "FingerVein.h"

// Pin definitions for Node A
#define FV_RX_PIN   16  // ESP32 RX <- Module TX
#define FV_TX_PIN   17  // ESP32 TX -> Module RX

// Create FingerVein instance using Serial2
FingerVein fingerVein(Serial2);

// Status callback for enrollment/verification feedback
void onStatusUpdate(uint8_t status, const char* message) {
    Serial.print("[FingerVein] Status: ");
    Serial.println(message);
}

void setup() {
    // Debug serial
    Serial.begin(115200);
    while (!Serial) delay(10);
    
    Serial.println("\n=================================");
    Serial.println("SchoolNFC - Finger Vein Demo");
    Serial.println("=================================\n");
    
    // Initialize finger vein module
    Serial.println("Initializing Finger Vein module...");
    fingerVein.begin(FV_RX_PIN, FV_TX_PIN);
    fingerVein.setStatusCallback(onStatusUpdate);
    fingerVein.setTimeout(5000);
    
    // Connect to module
    Serial.println("Connecting to module...");
    if (fingerVein.connect()) {
        Serial.println("Connected successfully!");
        
        // Get device info
        FV_DeviceInfo info;
        if (fingerVein.getDeviceInfo(info)) {
            Serial.println("\nDevice Information:");
            Serial.printf("  Version: %d.%d\n", info.versionMajor, info.versionMinor);
            Serial.printf("  Device ID: %d\n", info.deviceId);
            Serial.printf("  Security Level: %d\n", info.securityLevel);
            Serial.printf("  Timeout: %d seconds\n", info.timeout);
            Serial.printf("  Duplicate Check: %s\n", info.dupCheck ? "Enabled" : "Disabled");
        }
        
        // Get enrollment statistics
        FV_EnrollInfo enrollInfo;
        if (fingerVein.getEnrollInfo(enrollInfo)) {
            Serial.printf("\nEnrolled Users: %d / %d\n", enrollInfo.userCount, enrollInfo.maxUsers);
        }
    } else {
        Serial.println("Failed to connect to Finger Vein module!");
        Serial.printf("Error: %s\n", fingerVein.getErrorString(fingerVein.getLastError()));
    }
    
    Serial.println("\n--- Ready for commands ---");
    Serial.println("Commands:");
    Serial.println("  e - Enroll new user");
    Serial.println("  v - Verify user (1:N)");
    Serial.println("  c - Check finger presence");
    Serial.println("  i - Show device info");
    Serial.println("  d - Delete all users");
}

void loop() {
    if (Serial.available()) {
        char cmd = Serial.read();
        
        switch (cmd) {
            case 'e':
            case 'E':
                enrollNewUser();
                break;
                
            case 'v':
            case 'V':
                verifyUser();
                break;
                
            case 'c':
            case 'C':
                checkFinger();
                break;
                
            case 'i':
            case 'I':
                showDeviceInfo();
                break;
                
            case 'd':
            case 'D':
                deleteAllUsers();
                break;
        }
    }
    
    delay(10);
}

void enrollNewUser() {
    Serial.println("\n--- Enrolling New User ---");
    
    // Get an available ID
    int32_t emptyId = fingerVein.getEmptyId(1, 100);
    if (emptyId < 0) {
        Serial.println("No empty ID available!");
        return;
    }
    
    Serial.printf("Using ID: %d\n", emptyId);
    Serial.println("Please place your finger 3 times when prompted...\n");
    
    if (fingerVein.enrollUser(emptyId)) {
        Serial.printf("\nUser %d enrolled successfully!\n", emptyId);
    } else {
        Serial.printf("Enrollment failed: %s\n", 
            fingerVein.getErrorString(fingerVein.getLastError()));
    }
}

void verifyUser() {
    Serial.println("\n--- Verifying User (1:N mode) ---");
    Serial.println("Place your finger on the scanner...\n");
    
    int32_t matchedId = fingerVein.verifyUser(0);  // 0 = 1:N mode
    
    if (matchedId >= 0) {
        Serial.printf("\nVerification successful! User ID: %d\n", matchedId);
        Serial.println("ACCESS GRANTED");
        // TODO: Trigger relay to open door
    } else {
        Serial.printf("Verification failed: %s\n",
            fingerVein.getErrorString(fingerVein.getLastError()));
        Serial.println("ACCESS DENIED");
    }
}

void checkFinger() {
    Serial.println("\n--- Checking Finger Presence ---");
    
    if (fingerVein.checkFingerPresent()) {
        Serial.println("Finger detected!");
    } else {
        Serial.println("No finger detected.");
    }
}

void showDeviceInfo() {
    Serial.println("\n--- Device Information ---");
    
    FV_DeviceInfo info;
    if (fingerVein.getDeviceInfo(info)) {
        Serial.printf("Version: %d.%d\n", info.versionMajor, info.versionMinor);
        Serial.printf("Device ID: %d\n", info.deviceId);
        Serial.printf("Baud Rate Index: %d\n", info.baudRate);
        Serial.printf("Security Level: %d\n", info.securityLevel);
        Serial.printf("Timeout: %d seconds\n", info.timeout);
        Serial.printf("Duplicate Check: %s\n", info.dupCheck ? "Yes" : "No");
        Serial.printf("Same Finger Check: %s\n", info.sameFingerCheck ? "Yes" : "No");
    }
    
    FV_EnrollInfo enrollInfo;
    if (fingerVein.getEnrollInfo(enrollInfo)) {
        Serial.printf("Enrolled Users: %d / %d\n", enrollInfo.userCount, enrollInfo.maxUsers);
    }
}

void deleteAllUsers() {
    Serial.println("\n--- Deleting All Users ---");
    Serial.println("WARNING: This will delete all enrolled finger veins!");
    Serial.println("Send 'Y' to confirm...");
    
    // Wait for confirmation
    while (!Serial.available()) delay(10);
    char confirm = Serial.read();
    
    if (confirm == 'Y' || confirm == 'y') {
        if (fingerVein.deleteAllUsers()) {
            Serial.println("All users deleted successfully!");
        } else {
            Serial.println("Failed to delete users!");
        }
    } else {
        Serial.println("Cancelled.");
    }
}
