/**
 * Relay Module Test
 * ==================
 * 
 * PURPOSE: Verify relay module is wired correctly and switching
 * 
 * WIRING:
 *   RELAY    →   ESP32
 *   ─────────────────────
 *   VCC      →   VIN (5V)
 *   GND      →   GND
 *   IN       →   GPIO25 (Gatekeeper) or GPIO26 (Watchman)
 * 
 * EXPECTED OUTPUT:
 *   - Relay clicks every 2 seconds
 *   - Relay LED toggles with click
 *   - Serial Monitor shows "ON" / "OFF"
 * 
 * TESTING WITH MULTIMETER:
 *   - Set multimeter to continuity mode (beep mode)
 *   - Touch probes to COM and NO terminals
 *   - When relay is OFF: no beep
 *   - When relay is ON: beep!
 */

#include <Arduino.h>

// Change this pin based on which node you're testing:
// - Gatekeeper (Node A): GPIO25
// - Watchman (Node B): GPIO26
#define RELAY_PIN 25  // Change to 26 for Watchman

// Some relays are "Active LOW" - they turn ON when signal is LOW
// Set this to true if your relay behaves backwards
#define ACTIVE_LOW false

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║       RELAY MODULE TEST v1.0           ║");
    Serial.println("║       SchoolNFC Hardware Testing       ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    Serial.print("Testing relay on GPIO");
    Serial.println(RELAY_PIN);
    Serial.print("Active LOW mode: ");
    Serial.println(ACTIVE_LOW ? "YES" : "NO");
    Serial.println();
    
    pinMode(RELAY_PIN, OUTPUT);
    
    // Start with relay OFF
    digitalWrite(RELAY_PIN, ACTIVE_LOW ? HIGH : LOW);
    
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
    Serial.println("  WHAT TO LOOK FOR:");
    Serial.println("  1. Listen for CLICK sound every 2 seconds");
    Serial.println("  2. Watch relay board LED toggle");
    Serial.println("  3. Use multimeter on COM-NO to verify switching");
    Serial.println();
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
    Serial.println("  If relay doesn't click:");
    Serial.println("  - Check VCC is connected to 5V");
    Serial.println("  - Check GND is connected");
    Serial.println("  - Try setting ACTIVE_LOW = true in code");
    Serial.println();
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
}

void loop() {
    // Turn relay ON
    Serial.println("┌─────────────────────────────────────┐");
    Serial.println("│  🔔 RELAY: ON                       │");
    Serial.println("│     (You should hear a CLICK!)      │");
    Serial.println("│     COM-NO: CONNECTED               │");
    Serial.println("│     COM-NC: DISCONNECTED            │");
    Serial.println("└─────────────────────────────────────┘");
    
    digitalWrite(RELAY_PIN, ACTIVE_LOW ? LOW : HIGH);
    delay(2000);
    
    // Turn relay OFF
    Serial.println("┌─────────────────────────────────────┐");
    Serial.println("│  ░░ RELAY: OFF                      │");
    Serial.println("│     (You should hear a CLICK!)      │");
    Serial.println("│     COM-NO: DISCONNECTED            │");
    Serial.println("│     COM-NC: CONNECTED               │");
    Serial.println("└─────────────────────────────────────┘");
    Serial.println();
    
    digitalWrite(RELAY_PIN, ACTIVE_LOW ? HIGH : LOW);
    delay(2000);
}
