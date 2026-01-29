#ifndef FINGER_VEIN_AUTH_H
#define FINGER_VEIN_AUTH_H

#include <Arduino.h>

/**
 * FingerVeinAuth is a skeleton wrapper for the Waveshare Finger Vein sensor.
 * Implementation will use the Waveshare serial protocol once hardware arrives.
 */
class FingerVeinAuth {
  public:
    enum Result {
      SUCCESS,
      MATCH_NOT_FOUND,
      TIMEOUT,
      SENSOR_ERROR,
      CANCELLED
    };

    /**
     * Initializes the sensor on the specified hardware serial.
     */
    static bool begin(HardwareSerial& serial) {
      // Hardware initialization logic will go here
      return true;
    }

    /**
     * Enrolls a new user and assigns them a template ID.
     * Blocks until completion or timeout.
     */
    static Result enroll(uint16_t templateId) {
      Serial.printf("FingerVein: Starting enrollment for ID %d\n", templateId);
      // Enrollment protocol logic
      return SUCCESS;
    }

    /**
     * Verifies a user against the stored templates.
     * Returns the matched template ID or -1 if no match.
     */
    static int verify() {
      Serial.println("FingerVein: Waiting for finger...");
      // Verification protocol logic
      return -1; // Placeholder
    }

    /**
     * Deletes a specific template from the sensor's memory.
     */
    static bool remove(uint16_t templateId) {
      Serial.printf("FingerVein: Deleting ID %d\n", templateId);
      return true;
    }

    /**
     * Clears all stored templates from the sensor.
     */
    static bool clearAll() {
      Serial.println("FingerVein: Clearing all templates");
      return true;
    }

    /**
     * Checks if the sensor is responsive.
     */
    static bool isAlive() {
      // Send heartbeat command to sensor
      return true;
    }
};

#endif
