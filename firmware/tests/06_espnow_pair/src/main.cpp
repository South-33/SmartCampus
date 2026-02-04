/**
 * ESP-NOW Pairing Test
 * =====================
 * 
 * PURPOSE: Verify two ESP32 boards can communicate via ESP-NOW
 * 
 * HOW TO USE:
 * 1. Upload this same code to BOTH ESP32 boards
 * 2. Open Serial Monitor for each (use different COM ports)
 * 3. One board will become SENDER, one will become RECEIVER
 * 4. You can switch roles by typing 'S' or 'R' in Serial Monitor
 * 
 * NO WIRING NEEDED:
 * ESP-NOW is wireless - just power both boards via USB!
 * 
 * EXPECTED OUTPUT:
 * - Both boards show their MAC addresses
 * - Sender shows "Message sent"
 * - Receiver shows "Message received from XX:XX:XX:XX:XX:XX"
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>

// Role: 'S' for sender, 'R' for receiver
char role = 'R';  // Start as receiver (first board to boot)

// Broadcast address (sends to all ESP-NOW devices)
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// Message structure
typedef struct {
    char text[32];
    uint32_t counter;
} Message;

Message outgoing;
Message incoming;

uint32_t messageCount = 0;

// Callback when data is sent
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
    Serial.print("Last send status: ");
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "SUCCESS" : "FAILED");
}

// Callback when data is received
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len) {
    memcpy(&incoming, incomingData, sizeof(incoming));
    
    Serial.println();
    Serial.println("┌──────────────────────────────────────────┐");
    Serial.print("│ 📨 MESSAGE RECEIVED!                     │");
    Serial.println();
    Serial.print("│ From: ");
    for (int i = 0; i < 6; i++) {
        if (mac[i] < 0x10) Serial.print("0");
        Serial.print(mac[i], HEX);
        if (i < 5) Serial.print(":");
    }
    Serial.println();
    Serial.print("│ Text: ");
    Serial.println(incoming.text);
    Serial.print("│ Counter: ");
    Serial.println(incoming.counter);
    Serial.println("└──────────────────────────────────────────┘");
    Serial.println();
}

void printHelp() {
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║            COMMANDS                    ║");
    Serial.println("╠════════════════════════════════════════╣");
    Serial.println("║  S = Switch to SENDER mode             ║");
    Serial.println("║  R = Switch to RECEIVER mode           ║");
    Serial.println("║  T = Send a test message (if sender)   ║");
    Serial.println("║  ? = Show this help                    ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔════════════════════════════════════════╗");
    Serial.println("║      ESP-NOW PAIRING TEST v1.0         ║");
    Serial.println("║      SchoolNFC Hardware Testing        ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println();
    
    // Set device as WiFi Station
    WiFi.mode(WIFI_STA);
    
    // Print MAC address
    Serial.println("═══════════════════════════════════════════");
    Serial.print("  This board's MAC: ");
    Serial.println(WiFi.macAddress());
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
    
    // Initialize ESP-NOW
    if (esp_now_init() != ESP_OK) {
        Serial.println("❌ Error initializing ESP-NOW");
        return;
    }
    
    // Register callbacks
    esp_now_register_send_cb(OnDataSent);
    esp_now_register_recv_cb(OnDataRecv);
    
    // Add broadcast peer
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, broadcastAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        Serial.println("❌ Failed to add broadcast peer");
        return;
    }
    
    Serial.println("✓ ESP-NOW initialized successfully!");
    Serial.println();
    Serial.println("═══════════════════════════════════════════");
    Serial.println();
    Serial.println("  HOW TO TEST:");
    Serial.println();
    Serial.println("  1. Upload this to BOTH ESP32 boards");
    Serial.println("  2. Open Serial Monitor for each");
    Serial.println("  3. On one board, type 'S' to make it SENDER");
    Serial.println("  4. The sender will transmit every 2 seconds");
    Serial.println("  5. The receiver will show incoming messages");
    Serial.println();
    Serial.println("═══════════════════════════════════════════");
    
    printHelp();
    
    Serial.print("Current mode: ");
    Serial.println(role == 'S' ? "SENDER" : "RECEIVER");
    Serial.println();
}

void loop() {
    // Check for serial commands
    if (Serial.available()) {
        char cmd = toupper(Serial.read());
        
        if (cmd == 'S') {
            role = 'S';
            Serial.println("═══ Switched to SENDER mode ═══");
            Serial.println("Will send messages every 2 seconds...");
        } else if (cmd == 'R') {
            role = 'R';
            Serial.println("═══ Switched to RECEIVER mode ═══");
            Serial.println("Waiting for messages...");
        } else if (cmd == 'T' && role == 'S') {
            // Send test message immediately
            messageCount++;
            sprintf(outgoing.text, "Test from %s", WiFi.macAddress().c_str() + 9);
            outgoing.counter = messageCount;
            
            Serial.println("📤 Sending test message...");
            esp_now_send(broadcastAddress, (uint8_t *)&outgoing, sizeof(outgoing));
        } else if (cmd == '?') {
            printHelp();
        }
    }
    
    // If sender, transmit every 2 seconds
    static unsigned long lastSend = 0;
    if (role == 'S' && millis() - lastSend > 2000) {
        lastSend = millis();
        messageCount++;
        
        sprintf(outgoing.text, "Hello from %s", WiFi.macAddress().c_str() + 9);
        outgoing.counter = messageCount;
        
        Serial.print("📤 Sending message #");
        Serial.println(messageCount);
        
        esp_now_send(broadcastAddress, (uint8_t *)&outgoing, sizeof(outgoing));
    }
    
    delay(10);
}
