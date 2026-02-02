# Hardware Testing Checklist

Step-by-step guide to assemble and test all components for the SchoolNFC demo.

---

## Prerequisites

- [ ] PlatformIO installed (`pip install platformio`)
- [ ] USB drivers for ESP32 (CP2102/CH340)
- [ ] Serial monitor ready (115200 baud)
- [ ] Multimeter for voltage verification

---

## Phase 1: Individual Component Testing

### 1.1 ESP32 Power & Serial

```
[ ] Power ESP32 via USB-C
[ ] Open Serial Monitor at 115200 baud
[ ] See boot messages (should show memory info, WiFi MAC)
[ ] Upload test sketch: File > Examples > WiFi > WiFiScan
[ ] Verify WiFi networks appear in serial output
```

**Troubleshooting:**
- No serial output? Check COM port, try different USB cable
- Constant reboot? Insufficient power, use data cable not charge-only

---

### 1.2 PN532 NFC Reader (I2C)

**Wiring:**
| PN532 Pin | ESP32 Pin | Notes |
|-----------|-----------|-------|
| VCC | VIN (5V) | Has onboard 3.3V regulator |
| GND | GND | |
| SDA | GPIO21 | Add 4.7K pull-up to 3.3V |
| SCL | GPIO22 | Add 4.7K pull-up to 3.3V |

**DIP Switch Settings (on PN532 board):**
- Set to I2C mode: Switch 1 = OFF, Switch 2 = ON

**Test Steps:**
```
[ ] Wire PN532 as shown above
[ ] Add 4.7K pull-up resistors on SDA and SCL to 3.3V
[ ] Upload Adafruit PN532 example: "readntag215"
[ ] Hold NTAG215 card near reader (within 2cm)
[ ] See UID printed: "Found chip PN532... Card UID: 04 A3 2B 1C 7D 00 00"
[ ] Test with 3+ different cards to verify consistency
```

**Troubleshooting:**
- "Didn't find PN532"? Check wiring, DIP switches, pull-up resistors
- Intermittent reads? Add 10uF capacitor between VCC and GND

---

### 1.3 TX510 Face Recognition (UART1)

**Wiring:**
| TX510 Pin | ESP32 Pin | Notes |
|-----------|-----------|-------|
| VCC | 5V (external) | Needs 500mA+, don't use ESP32 VIN |
| GND | GND | Common ground with ESP32 |
| TX | GPIO4 (RX1) | Direct connect OK |
| RX | GPIO5 (TX1) | Direct connect OK |

**Power Note:** TX510 can draw 500mA during recognition. Use separate 5V supply or USB hub with sufficient current.

**Test Steps:**
```
[ ] Wire TX510 as shown above
[ ] Power on - see TX510 screen/LED activate
[ ] Upload Gatekeeper firmware
[ ] Open Serial Monitor
[ ] Send 'F' command via Serial to test face module
[ ] Should see: "[FACE] Module info: ..." response
[ ] Test enrollment: Send 'E1' (enroll face as ID 1)
[ ] Look at camera, follow prompts (may need to rotate head)
[ ] Test verification: Send 'V' 
[ ] Should see: "[FACE] Match: 1" or "[FACE] No match"
```

**Troubleshooting:**
- No response? Check TX/RX aren't swapped
- Timeout errors? Ensure 5V supply is stable

---

### 1.4 Waveshare Finger Vein Scanner (UART2)

**Wiring:**
| Vein Pin | ESP32 Pin | Notes |
|----------|-----------|-------|
| VCC | 3.3V | Native 3.3V module |
| GND | GND | |
| TX | GPIO16 (RX2) | Direct connect OK |
| RX | GPIO17 (TX2) | Direct connect OK |

**Test Steps:**
```
[ ] Wire finger vein module as shown above
[ ] Power on - see green LED inside scanner
[ ] Upload Gatekeeper firmware
[ ] Open Serial Monitor
[ ] Send 'B' command to test module connection
[ ] Should see: "[VEIN] Module connected, X templates"
[ ] Test enrollment: Send 'N1' (enroll vein as ID 1)
[ ] Insert finger 3 times when prompted
[ ] Test verification: Send 'M'
[ ] Insert enrolled finger
[ ] Should see: "[VEIN] Match: 1" or "[VEIN] No match"
```

**Troubleshooting:**
- No response? Check TX/RX, verify 3.3V (NOT 5V!)
- Enrollment fails? Clean finger, insert deeper into sensor

---

### 1.5 Relay Module

**Wiring:**
| Relay Pin | ESP32 Pin | Notes |
|-----------|-----------|-------|
| VCC | VIN (5V) | |
| GND | GND | |
| IN | GPIO25 | Active HIGH |

**Test Steps:**
```
[ ] Wire relay as shown above
[ ] Upload simple test sketch:
    void setup() { pinMode(25, OUTPUT); }
    void loop() { 
      digitalWrite(25, HIGH); delay(1000);
      digitalWrite(25, LOW); delay(1000);
    }
[ ] Hear relay click every second
[ ] Verify LED on relay board toggles
[ ] Test NO/NC terminals with multimeter (continuity check)
```

---

### 1.6 LD2410 Radar (Watchman only)

**Wiring:**
| LD2410 Pin | ESP32 Pin | Notes |
|------------|-----------|-------|
| VCC | VIN (5V) | MUST be 5V |
| GND | GND | |
| TX | GPIO16 | |
| RX | GPIO17 | |

**Test Steps:**
```
[ ] Wire LD2410 as shown above
[ ] Upload Watchman firmware
[ ] Open Serial Monitor
[ ] Should see: "[RADAR] Connected, firmware X.X"
[ ] Walk in front of radar (1-5 meters)
[ ] Should see: "[RADAR] Motion detected, distance: XXcm"
[ ] Stand still for 30 seconds
[ ] Should see: "[RADAR] No motion"
```

---

## Phase 2: Integration Testing

### 2.1 NFC + Relay (Simplest Flow)

```
[ ] Wire both PN532 and Relay to same ESP32
[ ] Upload Gatekeeper firmware with TEST_MODE = true in config.h
[ ] Create test whitelist entry in Convex dashboard
[ ] Tap whitelisted card -> Relay clicks ON for 3s -> OFF
[ ] Tap unknown card -> Relay stays OFF, "Denied" in serial
```

### 2.2 NFC + Biometric + Relay (Full Security)

```
[ ] Set TEST_MODE = false in config.h
[ ] Enroll your face/finger as ID 1 on the device
[ ] In Convex dashboard, set your user's biometricId = 1
[ ] Sync whitelist (wait or trigger via serial 'W' command)
[ ] Tap your card -> Biometric prompt -> Show face/finger -> Door opens
[ ] Tap your card -> Show WRONG face -> Door stays locked
[ ] Tap staff card -> Door opens immediately (no biometric)
```

### 2.3 WiFi + Backend Sync

```
[ ] Configure WiFi credentials in firmware
[ ] Power on ESP32
[ ] Should see: "[WIFI] Connected to SSID"
[ ] Should see: "[NET] Device registered" (first boot only)
[ ] Should see: "[SYNC] Whitelist updated: X entries"
[ ] Make a card tap
[ ] Should see: "[SYNC] Logs uploaded" (within 1 minute)
[ ] Verify log appears in Convex dashboard
```

---

## Phase 3: Mobile App Testing

### 3.1 Prerequisites

```
[ ] Expo Go app installed on iPhone
[ ] App running via: cd mobile && npx expo start
[ ] Logged into app with test account
```

### 3.2 Link Card Flow

```
[ ] Open app -> Navigate to "Link Card" screen
[ ] Tap "Scan Card" button
[ ] Hold NTAG215 card to back of phone
[ ] Should see: "Card linked successfully!"
[ ] Verify cardUID appears in Convex user record
```

### 3.3 Open Gate Flow (No Biometric)

```
[ ] Open app -> Tap "Open Gate"
[ ] See 60-second timer start
[ ] Hold phone to PN532 reader (NFC write mode)
[ ] ESP32 should read payload and open door
[ ] App shows "Success!" screen
```

### 3.4 Attendance Flow (With Biometric)

```
[ ] Open app -> Tap "Attendance"
[ ] FaceID/TouchID prompt appears
[ ] Authenticate successfully
[ ] GPS captured (check location permission)
[ ] Hold phone to PN532 reader
[ ] Door opens + attendance logged
[ ] Verify attendance record in Convex
```

---

## Phase 4: Watchman (Radar) Testing

### 4.1 Standalone Watchman

```
[ ] Upload Watchman firmware to second ESP32
[ ] Power on separately from Gatekeeper
[ ] Verify radar detection working (see Phase 1.6)
[ ] Test state transitions:
    - Walk in room -> OCCUPIED (relay ON)
    - Leave room, wait 5 min -> GRACE (relay still ON)
    - Wait 15 min total -> STANDBY (relay OFF)
    - Walk back in -> instant OCCUPIED (relay ON)
```

### 4.2 ESP-NOW Pairing

```
[ ] Power on both Gatekeeper and Watchman
[ ] Ensure same room ID in both configs
[ ] Watchman should see: "[ESPNOW] Beacon received from Gatekeeper"
[ ] Watchman sends pair request
[ ] Gatekeeper should see: "[ESPNOW] Paired with Watchman: XX:XX:XX:XX:XX:XX"
[ ] Test wake command: Tap card on Gatekeeper
[ ] Watchman should see: "[ESPNOW] MSG_WAKE received"
[ ] Watchman relay turns ON if it was in STANDBY
```

---

## Quick Reference: Serial Commands

During testing, you can send these commands via Serial Monitor:

| Command | Action |
|---------|--------|
| `W` | Force whitelist sync |
| `L` | Force log upload |
| `R` | Restart device |
| `D` | Toggle debug mode |
| `F` | Test face module connection |
| `E1` | Enroll face as ID 1 |
| `V` | Verify face (returns matched ID) |
| `B` | Test finger vein connection |
| `N1` | Enroll finger vein as ID 1 |
| `M` | Verify finger vein |
| `C` | Clear all biometric templates |
| `?` | Show help |

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| ESP32 keeps rebooting | Power issue | Use better USB cable, add capacitors |
| PN532 not found | Wiring/I2C | Check SDA/SCL, add pull-ups, verify DIP switches |
| TX510 timeout | Power/wiring | Use separate 5V supply, check TX/RX swap |
| Finger vein no response | Voltage | Must be 3.3V not 5V |
| WiFi won't connect | Credentials | Check SSID/password in config.h |
| Whitelist empty | No homeroom | Assign device to room in Convex |
| Biometric always fails | No bioId | Set user's biometricId in Convex |
| ESP-NOW not pairing | Different PMK | Ensure both devices synced config |

---

## Demo Day Checklist

```
[ ] All components powered and tested
[ ] WiFi credentials configured for demo venue
[ ] Test user accounts created in Convex
[ ] NFC cards linked to test users
[ ] Biometrics enrolled and bioIds set
[ ] Mobile app installed on demo phone
[ ] Backup USB cables and power supplies
[ ] Serial monitor ready for debugging
```
