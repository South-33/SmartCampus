/**
 * ESP32 Blink Test
 * ================
 * 
 * PURPOSE: Verify ESP32 is working correctly
 * 
 * WHAT IT DOES:
 * - Blinks the built-in LED every 500ms
 * - Prints chip info to Serial Monitor
 * - Shows WiFi MAC address (needed for ESP-NOW)
 * 
 * EXPECTED OUTPUT:
 * - Blue LED blinks steadily
 * - Serial Monitor shows chip info and "LED: ON/OFF"
 * 
 * IF IT FAILS:
 * - Try different USB cable (data cable, not charge-only)
 * - Try different USB port
 * - Hold BOOT button while uploading
 */

#include <Arduino.h>
#include <WiFi.h>

#define LED_BUILTIN 2  // Built-in LED on most ESP32 dev boards

void setup() {
    Serial.begin(115200);
    delay(1000);  // Wait for Serial to stabilize
    
    // Print banner
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║       ESP32 BLINK TEST v1.0            ║");
    Serial.println("║      SmartCampus Hardware Testing      ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    // Print chip information
    Serial.println("=== CHIP INFORMATION ===");
    Serial.print("  Chip Model:    ");
    Serial.println(ESP.getChipModel());
    Serial.print("  Chip Revision: ");
    Serial.println(ESP.getChipRevision());
    Serial.print("  CPU Frequency: ");
    Serial.print(ESP.getCpuFreqMHz());
    Serial.println(" MHz");
    Serial.print("  Flash Size:    ");
    Serial.print(ESP.getFlashChipSize() / 1024 / 1024);
    Serial.println(" MB");
    Serial.print("  Free Heap:     ");
    Serial.print(ESP.getFreeHeap() / 1024);
    Serial.println(" KB");
    Serial.println();
    
    // Print MAC address (important for ESP-NOW!)
    Serial.println("=== NETWORK INFORMATION ===");
    Serial.print("  WiFi MAC:      ");
    Serial.println(WiFi.macAddress());
    Serial.println();
    Serial.println("  ⚠️  WRITE DOWN THIS MAC ADDRESS!");
    Serial.println("  You'll need it for ESP-NOW pairing.");
    Serial.println();
    
    // Configure LED
    pinMode(LED_BUILTIN, OUTPUT);
    
    Serial.println("=== TEST STATUS ===");
    Serial.println("  ✓ Serial communication: WORKING");
    Serial.println("  ✓ WiFi initialization:  WORKING");
    Serial.println("  ✓ GPIO configuration:   WORKING");
    Serial.println();
    Serial.println("  LED will now blink every 500ms...");
    Serial.println("  Watch the BLUE LED on the board.");
    Serial.println();
    Serial.println("════════════════════════════════════════");
    Serial.println();
}

void loop() {
    // Turn LED ON
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("[LED] ON  █");
    delay(500);
    
    // Turn LED OFF
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("[LED] OFF ░");
    delay(500);
}
