#ifndef FACE_AUTH_H
#define FACE_AUTH_H

#include <Arduino.h>

/**
 * FaceAuth is a skeleton wrapper for the TX510 Face Recognition module.
 * It handles the UART protocol commands for face enrollment and verification.
 */
class FaceAuth {
  public:
    enum State {
      IDLE,
      ENROLLING,
      VERIFYING,
      ERROR
    };

    /**
     * Initializes the TX510 on the specified hardware serial.
     */
    static bool begin(HardwareSerial& serial) {
      // Set baud rate (usually 115200) and init module
      return true;
    }

    /**
     * Puts the module into enrollment mode for a specific user ID.
     */
    static bool startEnroll(uint16_t userId) {
      Serial.printf("FaceAuth: Starting enrollment for User %d\n", userId);
      // Send START_ENROLL command
      return true;
    }

    /**
     * Polls the module for enrollment status.
     * Returns true when enrollment is finished successfully.
     */
    static bool isEnrollComplete() {
      // Check for ENROLL_SUCCESS packet
      return false;
    }

    /**
     * Triggers a single verification attempt.
     * Returns matched userId or -1 if no match/failure.
     */
    static int verifyOnce() {
      // Send VERIFY command and wait for response
      return -1;
    }

    /**
     * Sets whether the module should perform "Live Detection" 
     * (preventing photos/screens from being used).
     */
    static void setLiveDetection(boolean enabled) {
      Serial.printf("FaceAuth: Live detection set to %s\n", enabled ? "ON" : "OFF");
      // Send configuration packet
    }

    /**
     * Deletes a face template from the module's database.
     */
    static bool remove(uint16_t userId) {
      Serial.printf("FaceAuth: Deleting User %d\n", userId);
      // Send DELETE command
      return true;
    }

    /**
     * Wipes all face data from the module.
     */
    static bool reset() {
      Serial.println("FaceAuth: Wiping all face data!");
      // Send RESET command
      return true;
    }
};

#endif
