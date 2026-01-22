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

## User Flows

### Flow 1: Card Onboarding (One-Time Setup)

When a student registers, they receive a physical NTAG215 card. They must link it to their account:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │     │   App UI    │     │   iPhone    │     │   Server    │
│  gets card  │     │ "Link Card" │     │  NFC Read   │     │  (Convex)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  Opens app        │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │  Clicks "Link Card"                   │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
       │  Taps card to phone                   │                   │
       ├───────────────────────────────────────►  Reads Card UID   │
       │                   │                   ├──────────────────►│
       │                   │                   │                   │
       │                   │                   │   Stores:         │
       │                   │                   │   studentId ↔ cardUID
       │                   │                   │                   │
       │  ✅ "Card Linked!"│                   │                   │
       │◄──────────────────┴───────────────────┴───────────────────┤
       │                                                           │
```

**Database Entry Created:**
```json
{
  "studentId": "stu_12345",
  "cardUID": "04:A3:2B:1C:7D:00:00",
  "linkedAt": "2026-01-22T10:00:00Z",
  "allowedRooms": ["room_101", "room_102"]  // Set by admin
}
```

---

### Flow 2: Physical Card Access

Student taps their linked card to the door reader:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │     │   PN532     │     │   ESP32     │     │   Server    │
│  taps card  │     │  (Reader)   │     │  (Node A)   │     │  (Convex)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  Tap card         │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │                   │  Card UID         │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
       │                   │                   │  POST /validate   │
       │                   │                   │  { cardUID, roomId }
       │                   │                   ├──────────────────►│
       │                   │                   │                   │
       │                   │                   │                   │ Check:
       │                   │                   │                   │ 1. Card exists?
       │                   │                   │                   │ 2. Student enrolled?
       │                   │                   │                   │ 3. Room in allowedRooms?
       │                   │                   │                   │
       │                   │                   │  { valid: true }  │
       │                   │                   │◄──────────────────┤
       │                   │                   │                   │
       │                   │                   │  Trigger Relay    │
       │  🔓 Door Unlocks  │                   │──────────────────►│
       │◄──────────────────┴───────────────────┤                   │
       │                                       │                   │
       │                                       │  Log access       │
       │                                       ├──────────────────►│
```

---

### Flow 3: Phone Access (60-Second Window)

No biometric required—just tap "Open Gate" and go:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │     │   App UI    │     │   PN532     │     │   Server    │
│  opens app  │     │ "Open Gate" │     │  (Target)   │     │  (Convex)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  Clicks "Open Gate"                   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │                   │  Request token    │                   │
       │                   ├───────────────────────────────────────►
       │                   │                   │                   │
       │                   │                   │   Generate token: │
       │                   │                   │   { studentId,    │
       │                   │                   │     roomId,       │
       │                   │                   │     expiresAt,    │  ◄── 60 sec
       │                   │                   │     nonce }       │
       │                   │                   │                   │
       │                   │  Token received   │                   │
       │                   │◄──────────────────────────────────────┤
       │                   │                   │                   │
       │  📱 "Ready! Tap within 60s"           │                   │
       │◄──────────────────┤                   │                   │
       │                   │                   │                   │
       │  ══════════════════════════════════════                   │
       │  ║  iPhone enters NFC WRITER mode    ║                   │
       │  ══════════════════════════════════════                   │
       │                   │                   │                   │
       │  Taps phone to reader                 │                   │
       ├───────────────────────────────────────►                   │
       │                   │                   │                   │
       │                   │   iPhone WRITES   │                   │
       │                   │   token to PN532  │                   │
       │                   │                   │                   │
       │                   │                   │  POST /validate   │
       │                   │                   │  { token, roomId }│
       │                   │                   ├──────────────────►│
       │                   │                   │                   │
       │                   │                   │                   │ Check:
       │                   │                   │                   │ 1. Token valid?
       │                   │                   │                   │ 2. Not expired?
       │                   │                   │                   │ 3. Not replayed?
       │                   │                   │                   │ 4. Room allowed?
       │                   │                   │                   │
       │                   │                   │  { valid: true }  │
       │                   │                   │◄──────────────────┤
       │                   │                   │                   │
       │  🔓 Door Unlocks  │                   │                   │
       │◄──────────────────┴───────────────────┤                   │
```

---

### Flow 4: Attendance (Biometric Required)

Attendance uses the same "Gate" tab but requires biometric verification:

```
┌─────────────┐     ┌─────────────────────────────────────────────────────────┐
│   Student   │     │                      App Logic                          │
│  opens app  │     │                                                         │
└──────┬──────┘     └──────────────────────────┬──────────────────────────────┘
       │                                       │
       │  Clicks "Attendance"                  │
       ├──────────────────────────────────────►│
       │                                       │
       │                              ┌────────▼────────┐
       │                              │ Check: Does     │
       │                              │ device have     │
       │                              │ biometric HW?   │
       │                              └────────┬────────┘
       │                                       │
       │                          ┌────────────┴────────────┐
       │                          │                         │
       │                     NO   ▼                    YES  ▼
       │              ┌───────────────────┐    ┌───────────────────┐
       │              │ ❌ "Your device   │    │ Check: Is         │
       │              │ doesn't support   │    │ biometric set up? │
       │              │ biometric auth"   │    └─────────┬─────────┘
       │              └───────────────────┘              │
       │                                     ┌───────────┴───────────┐
       │                                     │                       │
       │                                NO   ▼                  YES  ▼
       │                      ┌───────────────────┐    ┌───────────────────┐
       │                      │ ⚠️ "Please set up │    │ Prompt FaceID /   │
       │                      │ FaceID/Fingerprint│    │ Fingerprint       │
       │                      │ in Settings"      │    └─────────┬─────────┘
       │                      └───────────────────┘              │
       │                                                         │
       │                                              ┌──────────┴──────────┐
       │                                              │                     │
       │                                         FAIL ▼               SUCCESS
       │                                   ┌──────────────┐              │
       │                                   │ ❌ "Auth     │              │
       │                                   │   failed"    │              │
       │                                   └──────────────┘              │
       │                                                                 │
       │◄────────────────────────────────────────────────────────────────┤
       │  📱 "Ready! Tap within 60s"                                     │
       │                                                                 │
       │  ══════════════════════════════════════════════════════════════ │
       │  ║  Token includes:                                           ║ │
       │  ║  • studentId                                               ║ │
       │  ║  • timestamp                                               ║ │
       │  ║  • GPS coordinates                                         ║ │
       │  ║  • action: ["OPEN_GATE", "ATTENDANCE"]                     ║ │
       │  ══════════════════════════════════════════════════════════════ │
       │                                                                 │
       │  Taps phone to reader → Opens gate + Records attendance         │
       │                                                                 │
```

**Token Payload Comparison:**

| Action | Payload |
|--------|---------|
| **Open Gate** (no biometric) | `{ studentId, action: ["OPEN_GATE"] }` |
| **Attendance** (biometric required) | `{ studentId, timestamp, gps: {lat, lng}, action: ["OPEN_GATE", "ATTENDANCE"] }` |

**Biometric Check Logic (iOS):**

```swift
import LocalAuthentication

func checkBiometricCapability() -> BiometricStatus {
    let context = LAContext()
    var error: NSError?
    
    // Check if hardware exists
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
        return .ready  // Has biometric and it's enrolled
    }
    
    switch error?.code {
    case LAError.biometryNotEnrolled.rawValue:
        return .notEnrolled  // "Please set up FaceID in Settings"
    case LAError.biometryNotAvailable.rawValue:
        return .noHardware   // "Device doesn't support biometric"
    default:
        return .unavailable
    }
}
```

---

### Flow 5: Energy Saving ("15-Minute Watchman")

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

## Access Control Model

### Room-Based Permissions

Students can only access rooms they're enrolled in:

```
┌─────────────────────────────────────────────────────────────────┐
│  students                                                       │
├─────────────────────────────────────────────────────────────────┤
│  _id: "stu_12345"                                               │
│  name: "John Doe"                                               │
│  cardUID: "04:A3:2B:1C:7D:00:00"                                │
│  allowedRooms: ["room_101", "room_102", "room_lab_a"]           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  rooms                                                          │
├─────────────────────────────────────────────────────────────────┤
│  _id: "room_101"                                                │
│  name: "Computer Lab 101"                                       │
│  nodeId: "esp32_node_a_001"  // Which ESP32 controls this door  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  accessLogs                                                     │
├─────────────────────────────────────────────────────────────────┤
│  studentId: "stu_12345"                                         │
│  roomId: "room_101"                                             │
│  method: "card" | "phone"                                       │
│  result: "granted" | "denied"                                   │
│  timestamp: "2026-01-22T10:30:00Z"                              │
│  reason?: "room_not_allowed"  // If denied                      │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Logic (Server-Side)

```typescript
async function validateAccess(
  identifier: { cardUID?: string; token?: string },
  roomId: string
): Promise<{ valid: boolean; reason?: string }> {
  
  // 1. Find student
  const student = identifier.cardUID
    ? await db.query("students").filter(s => s.cardUID === identifier.cardUID).first()
    : await validateTokenAndGetStudent(identifier.token);
  
  if (!student) return { valid: false, reason: "student_not_found" };
  
  // 2. Check room access
  if (!student.allowedRooms.includes(roomId)) {
    return { valid: false, reason: "room_not_allowed" };
  }
  
  // 3. Log and grant
  await db.insert("accessLogs", { ... });
  return { valid: true };
}
```

---

## Offline Mode

The system works **100% offline** for door access. Attendance can also work offline with sync-on-reconnect.

### Online vs Offline Decision Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT TAPS READER                          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   ESP32 checks WiFi     │
                    └─────────────┬───────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
         ONLINE                                   OFFLINE
              │                                       │
              ▼                                       ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│  Validate via Server    │             │  Validate via Local     │
│  timestampServer = now  │             │  Whitelist (NVS)        │
│  Sync immediately       │             │  timestampLocal = now   │
└─────────────────────────┘             │  Queue for later sync   │
                                        └─────────────────────────┘
```

### Timestamp Handling

| Mode | Timestamp Source | Label | Accuracy |
|------|------------------|-------|----------|
| **Online** | Server's `Date.now()` | `timestampServer` | ✅ Accurate |
| **Offline** | ESP32's internal clock | `timestampLocal` | ⚠️ May drift |

**On reconnect:** ESP32 syncs with NTP, calculates offset, corrects all `timestampLocal` records.

---

### Offline Attendance Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Phone   │     │  PN532   │     │  ESP32   │     │  Server  │
│  (App)   │     │ (Reader) │     │ (NVS)    │     │ (Convex) │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  1. Biometric  │                │                │
     │     Success ✓  │                │                │
     │                │                │                │
     │  2. Generate payload            │                │
     │  ┌─────────────────────────┐    │                │
     │  │ studentId: "stu_123"   │    │                │
     │  │ deviceTime: 1706012345  │    │                │
     │  │ gps: {lat, lng}         │    │                │
     │  │ action: "ATTENDANCE"    │    │                │
     │  └─────────────────────────┘    │                │
     │                │                │                │
     │  3. NFC Write  │                │                │
     ├───────────────►│                │                │
     │                │                │                │
     │                │  4. Forward    │                │
     │                ├───────────────►│                │
     │                │                │                │
     │                │                │  5. Store      │
     │                │                │  ┌──────────────────────┐
     │                │                │  │ scanOrder: 1         │
     │                │                │  │ studentId: "stu_123" │
     │                │                │  │ deviceTime: ...      │
     │                │                │  │ espTime: ...         │
     │                │                │  │ gps: {...}           │
     │                │                │  │ synced: false        │
     │                │                │  └──────────────────────┘
     │                │                │                │
     │                │                │  6. Check WiFi │
     │                │                │────────────────┤
     │                │                │                │
     │           ┌────┴────────────────┴────┐          │
     │           │                          │          │
     │       ONLINE                     OFFLINE        │
     │           │                          │          │
     │           ▼                          ▼          │
     │   ┌───────────────┐        ┌───────────────┐   │
     │   │ POST /attend  │        │ Queue in NVS  │   │
     │   │ + serverTime  │        │ Sync later    │   │
     │   └───────────────┘        └───────────────┘   │
     │                │                │                │
     │  7. Door Opens │                │                │
     │◄───────────────┴────────────────┤                │
```

---

### Scan Order: The Anti-Cheat Mechanism

Students can lie about their device timestamp. They **cannot** lie about their position in line.

```
┌────────────────────────────────────────────────────────────────────┐
│  ESP32 Storage (NVS)                                               │
├──────────┬───────────┬─────────────┬─────────────┬────────────────┤
│ scanOrder│ studentId │ deviceTime  │ espTime     │ status         │
├──────────┼───────────┼─────────────┼─────────────┼────────────────┤
│    1     │ stu_007   │ 09:01:23    │ 09:01:25    │ ✅ Consistent  │
│    2     │ stu_003   │ 09:01:45    │ 09:01:30    │ ✅ Consistent  │
│    3     │ stu_012   │ 08:55:00    │ 09:01:35    │ 🚨 SUSPICIOUS  │
│    4     │ stu_001   │ 09:02:10    │ 09:01:40    │ ✅ Consistent  │
└──────────┴───────────┴─────────────┴─────────────┴────────────────┘
                              ▲
                              │
              Student #3 claims 08:55 but is position 3
              → deviceTime is IGNORED, use espTime
```

**Server validation on sync:**
```typescript
function validateAttendance(records: AttendanceRecord[]) {
  // Sort by scanOrder (immutable truth)
  const sorted = records.sort((a, b) => a.scanOrder - b.scanOrder);
  
  for (const record of sorted) {
    // Flag if deviceTime differs from espTime by > 5 minutes
    if (Math.abs(record.deviceTime - record.espTime) > 300_000) {
      record.flag = "TIMESTAMP_MISMATCH";
    }
    
    // Use espTime as canonical, ignore deviceTime for ordering
    record.canonicalTime = record.espTime;
  }
}
```

---

### Local Whitelist Management

Each ESP32 stores only the students allowed in **its room**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ESP32 (Room 101) - Local Whitelist                                 │
├─────────────────────────────────────────────────────────────────────┤
│  whitelistVersion: 42                                               │
│  lastSync: "2026-01-22T08:00:00Z"                                   │
│  entries: [                                                         │
│    { cardUID: "04:A3:2B:1C:7D:00:00", studentId: "stu_001" },       │
│    { cardUID: "04:B7:3C:2D:8E:11:11", studentId: "stu_007" },       │
│    { cardUID: "04:C8:4D:3E:9F:22:22", studentId: "stu_012" },       │
│    ... (max ~10,000 entries)                                        │
│  ]                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Sync flow:**
```
┌──────────┐                              ┌──────────┐
│  ESP32   │                              │  Server  │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  GET /whitelist?room=101&version=42     │
     ├────────────────────────────────────────►│
     │                                         │
     │◄─ 304 Not Modified (if same version)    │
     │                                         │
     │◄─ 200 + new list (if version changed)   │
     │   { version: 43, entries: [...] }       │
     │                                         │
     │  Store to NVS, update version           │
     │                                         │
```

---

### Offline Security Summary

| Threat | Mitigation |
|--------|------------|
| **Fake studentId** | Check against local whitelist |
| **Fake timestamp** | Use `scanOrder` + `espTime` as truth |
| **Fake GPS** | Flag if > 100m from room coordinates |
| **Replay attack** | Store `lastScan[studentId]`, reject if < 30 min |
| **Stolen ESP32** | Whitelist only—no signing keys stored |
| **Power loss** | All data in NVS (flash), not RAM |

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
