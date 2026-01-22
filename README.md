# 🏫 Smart Classroom System

A two-node wireless system for secure gate access and intelligent energy management.

## System Overview

| Node | Role | Components |
|------|------|------------|
| **Node A (Gatekeeper)** | Door access control | ESP32 + PN532 NFC + Relay |
| **Node B (Watchman)** | Occupancy monitoring & power control | ESP32 + HLK-LD2410C Radar + Relay |
| **Communication** | ESP-NOW (direct ESP-to-ESP) | ~50m indoor range |

---

## Hardware Inventory

| Component | Qty | Function | Placement |
|-----------|-----|----------|-----------|
| ESP32 WROOM-32 | 2 | Microcontrollers | Door frame / Ceiling |
| PN532 NFC Module | 1 | Reader/Tag Emulation | Outside door |
| HLK-LD2410C | 1 | mmWave Presence Sensor | Ceiling (facing room) |
| 5V Relay Module | 2 | Lock control / Power switch | Door frame / Electrical box |
| NTAG215 Cards | 10 | Physical student keys | Student possession |

---

## Wiring Diagrams

### Node A: Gatekeeper (Door)

```
┌─────────────────────────────────────────────┐
│  ESP32 #1                                   │
├─────────────────────────────────────────────┤
│  PN532 NFC Module          Relay #1 (Lock)  │
│  ├── VCC  → VIN (5V)       ├── VCC  → VIN   │
│  ├── GND  → GND            ├── GND  → GND   │
│  ├── SDA  → GPIO 21        └── IN   → GPIO 4│
│  └── SCL  → GPIO 22                         │
└─────────────────────────────────────────────┘
```

### Node B: Watchman (Ceiling)

```
┌─────────────────────────────────────────────┐
│  ESP32 #2                                   │
├─────────────────────────────────────────────┤
│  HLK-LD2410C Radar         Relay #2 (Power) │
│  ├── VCC  → VIN (5V)       ├── VCC  → VIN   │
│  ├── GND  → GND            ├── GND  → GND   │
│  ├── TX   → GPIO 16 (RX2)  └── IN   → GPIO 5│
│  └── RX   → GPIO 17 (TX2)                   │
└─────────────────────────────────────────────┘
```

> ⚠️ **Critical:** Node B must be powered by a separate always-on circuit. If Relay #2 controls its own power, opening it kills the ESP32.

---

## Operational Logic

### A. Gate Access Flow ("Reverse-Write" Handshake)

Bypasses Apple's NFC reader restrictions by reversing roles:

1. Student authenticates on iPhone (FaceID) and taps "Open Gate"
2. iPhone enters **Writer Mode**
3. Student taps iPhone to PN532
4. iPhone writes encrypted one-time token to PN532 buffer
5. ESP32 #1 validates token via server (WiFi) → triggers Relay #1

```
┌──────────┐    Write Token    ┌──────────┐    Validate    ┌──────────┐
│  iPhone  │ ───────────────►  │  PN532   │ ─────────────► │  Server  │
│ (Writer) │                   │ (Target) │                │ (Convex) │
└──────────┘                   └──────────┘                └──────────┘
                                    │
                                    ▼ Valid?
                               ┌──────────┐
                               │  Relay   │ → Door Unlocks
                               └──────────┘
```

### B. Energy Saving Flow ("15-Minute Watchman")

1. HLK-LD2410C monitors for micro-motion (breathing detection)
2. **Presence detected:** Relay #2 stays CLOSED (power ON)
3. **Absence detected:** 15-minute countdown starts
4. **Timer expires:** Relay #2 OPENS (power OFF to lights/AC)
5. **Motion detected again:** Instant power recovery

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  OCCUPIED   │ ──► │ GRACE_PERIOD│ ──► │   STANDBY   │
│  Power ON   │     │  15min timer│     │  Power OFF  │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │
       └───────────── Motion Detected ─────────┘
```

---

## Security Strategy

| Layer | Implementation |
|-------|----------------|
| **Something you have** | NFC Card / iPhone |
| **Something you are** | FaceID biometric |
| **Somewhere you are** | GPS verification (optional) |
| **Replay protection** | Server tracks "Last Used Token" |
| **Fail-safe (Lock)** | Normally Closed → power fail = locked |
| **Fail-safe (Power)** | Normally Open → system fail = power off |

---

## Software Components

### Firmware (ESP32)

- [ ] Node A: NFC read/write handling + ESP-NOW TX
- [ ] Node B: Radar monitoring + 15-min timer + ESP-NOW RX
- [ ] OTA firmware update support
- [ ] NTP time sync on boot
- [ ] Relay debounce (500ms cooldown)

### Backend (Convex)

- [ ] `accessLogs` table: studentId, timestamp, method, result
- [ ] Token validation endpoint
- [ ] Token generation with replay protection

### Mobile App (iOS)

- [ ] FaceID authentication (LocalAuthentication framework)
- [ ] NFC Writer mode (Core NFC)
- [ ] Demo mode for App Store review (`demo@school.edu`)
- [ ] GPS verification (optional)

---

## App Store Survival Guide

| Strategy | Purpose |
|----------|---------|
| **Demo Mode** | Hard-coded `demo@school.edu` bypasses NFC hardware |
| **LocalAuth** | Biometric data never leaves device |
| **TestFlight** | Skip 2-week public review during semester |

---

## Development Phases

### Phase 1: Hardware Validation ✅
- [x] Order components
- [ ] Verify ESP32 + PN532 communication (I2C)
- [ ] Verify ESP32 + HLK-LD2410C communication (UART)
- [ ] Test ESP-NOW between two ESP32s
- [ ] Test relay actuation

### Phase 2: Core Logic
- [ ] Implement 15-minute timer with state persistence
- [ ] Implement NFC token read/write
- [ ] Set up Convex backend

### Phase 3: Integration
- [ ] Connect Node A ↔ Server ↔ Node B
- [ ] Build iOS app with FaceID + NFC
- [ ] End-to-end testing

### Phase 4: Deployment
- [ ] Install hardware in classroom
- [ ] Wire to actual door lock
- [ ] Production backend deployment

---

## Bill of Materials (Demo)

| Item | Price |
|------|-------|
| USB-C Cables (2) | $5.33 |
| HLK-LD2410C Radar | $2.20 |
| ESP32 WROOM-32 (2pcs) | $9.29 |
| PN532 NFC Module (2pcs) | $8.37 |
| 5V Relay Module (2pcs) | $1.32 |
| Dupont Wires | $3.99 |
| NTAG215 Cards (10pcs) | $6.48 |
| **Total** | **~$37** |

---

## Resources

- [ESP-NOW Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html)
- [PN532 Library (Adafruit)](https://github.com/adafruit/Adafruit-PN532)
- [HLK-LD2410 Library](https://github.com/ncmreynolds/ld2410)
- [Convex Documentation](https://docs.convex.dev/)
