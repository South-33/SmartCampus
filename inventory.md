# Hardware Inventory & Resource Tracker

> Last Updated: January 2026
> This document tracks all hardware, connections, GPIO usage, and expansion planning.

---

## Quick Status Dashboard

```
+============================================================================+
|                        SYSTEM RESOURCE OVERVIEW                            |
+============================================================================+

  BASE SYSTEM (AliExpress Cart)
  -----------------------------
  ESP32 Nodes        [##########] 2/2 FULL      No spare controllers
  NFC Modules        [#####-----] 1/2 USED      1 spare for 2nd door
  Radar Sensors      [##########] 1/1 FULL      Buy more for expansion
  Relay Modules      [##########] 2/2 FULL      Buy more for expansion
  USB-C Cables       [##########] 2/2 FULL      Buy more for expansion
  Dupont Wires       [#######---] 14/20 USED    6 spare wires
  NFC Cards          [----------] 0/10 USED     All 10 for students

+============================================================================+
```

---

## Part 1: Hardware Inventory

### What You Bought (AliExpress Cart - $55.51)

| # | Item | Store | Qty | Unit | Total | Status |
|---|------|-------|-----|------|-------|--------|
| 1 | UGREEN USB-C Cable 3A (1m, Black) | Ugreen Official | 2 | $2.67 | $5.33 | In cart |
| 2 | HLK-LD2410C Radar Sensor | Shenzhen Hi-Link | 1 | $2.20 | $2.20 | In cart |
| 3 | ESP32 WROOM-32D (CH340C TYPE-C) | A+ Dropship | 2 | $4.65 | $9.29 | In cart |
| 4 | PN532 NFC RFID Module V3 (2pcs set) | EGBO Store | 1 | $8.37 | $8.37 | In cart |
| 5 | 5V 1-Channel Relay Module (2pcs) | TZT 123 Official | 2 | $0.66 | $1.32 | In cart |
| 6 | 20Pin Dupont Wire F-F (30cm) | Shop1103734083 | 1 | $4.16 | $4.16 | In cart |
| 7 | NTAG215 Rewritable NFC Cards (10pcs) | nerina Store | 1 | $6.48 | $6.48 | In cart |
| 8 | 80W Soldering Iron (220V EU Plug) | Firsour Tools | 1 | $12.91 | $12.91 | In cart |

**Subtotal:** $55.39 + $0.32 shipping - $0.20 discount = **$55.51**

---

## Part 2: Component Allocation Map

### Node Assignment

```
+---------------------------+          +---------------------------+
|     NODE A (Door)         |          |     NODE B (Ceiling)      |
|       "Gatekeeper"        |          |       "Watchman"          |
+---------------------------+          +---------------------------+
|                           |          |                           |
|  [x] ESP32 #1             |  ESP-NOW |  [x] ESP32 #2             |
|  [x] PN532 NFC #1 (I2C)   | <------> |  [x] HLK-LD2410C Radar    |
|  [x] Relay #1             |          |  [x] Relay #2             |
|  [x] USB-C Cable #1       |          |  [x] USB-C Cable #2       |
|                           |          |                           |
|  [ ] PN532 NFC #2 (SPARE) |          |                           |
|                           |          |                           |
+---------------------------+          +---------------------------+
         |                                      |
         v                                      v
   +----------+                          +-------------+
   | Door Lock|                          | Lights/AC   |
   +----------+                          +-------------+
```

### Allocation Table

| Component | Qty Owned | Assigned To | Location | Status |
|-----------|-----------|-------------|----------|--------|
| ESP32 WROOM-32D #1 | 1 | Node A | Door frame | ALLOCATED |
| ESP32 WROOM-32D #2 | 1 | Node B | Ceiling | ALLOCATED |
| PN532 NFC Module #1 | 1 | Node A | Outside door | ALLOCATED |
| PN532 NFC Module #2 | 1 | SPARE | Storage | AVAILABLE |
| HLK-LD2410C Radar | 1 | Node B | Ceiling | ALLOCATED |
| 5V Relay Module #1 | 1 | Node A | Door frame | ALLOCATED |
| 5V Relay Module #2 | 1 | Node B | Electrical box | ALLOCATED |
| USB-C Cable #1 | 1 | ESP32 #1 | Door frame | ALLOCATED |
| USB-C Cable #2 | 1 | ESP32 #2 | Ceiling | ALLOCATED |
| NTAG215 Cards | 10 | Students | Distributed | FOR USERS |
| Dupont Wires | 20 | Both nodes | Wiring | 14 USED / 6 SPARE |

---

## Part 3: GPIO & Interface Resource Tracking

### ESP32 #1 (Node A - Door) GPIO Map

```
                    ESP32 #1 PINOUT
     +------------------------------------------+
     |                                          |
     |  3V3 [POWER]-----> (available)           |
     |  GND [POWER]-----> Common Ground Bus     | USED
     |  VIN [5V]-------> PN532 + Relay VCC      | USED
     |                                          |
     |  GPIO 21 [I2C SDA]---> PN532 SDA         | USED (NFC)
     |  GPIO 22 [I2C SCL]---> PN532 SCL         | USED (NFC)
     |                                          |
     |  GPIO 16 [UART2 RX]---> (available)      | FREE
     |  GPIO 17 [UART2 TX]---> (available)      | FREE
     |                                          |
     |  GPIO 4  [DIGITAL]----> Relay #1 IN      | USED (door lock)
     |                                          |
     |  GPIO 5  [DIGITAL]----> (available)      | FREE
     |  GPIO 18 [DIGITAL]----> (available)      | FREE
     |  GPIO 19 [DIGITAL]----> (available)      | FREE
     |  GPIO 23 [DIGITAL]----> (available)      | FREE
     |  GPIO 25 [DIGITAL]----> (available)      | FREE
     |  GPIO 26 [DIGITAL]----> (available)      | FREE
     |  GPIO 27 [DIGITAL]----> (available)      | FREE
     |  GPIO 32 [ADC]--------> (available)      | FREE
     |  GPIO 33 [ADC]--------> (available)      | FREE
     |                                          |
     +------------------------------------------+
```

#### ESP32 #1 Resource Summary

| Interface | Status | Current Use | Can Add |
|-----------|--------|-------------|---------|
| I2C (21/22) | **USED** | PN532 NFC | More I2C devices on same bus |
| UART2 (16/17) | **FREE** | - | 1 UART device |
| UART1 (remap to 25/26) | **FREE** | - | 1 UART device |
| GPIO 4 | **USED** | Relay #1 | - |
| GPIO 5, 18, 19, 23, 25, 26, 27, 32, 33 | **FREE** | - | 9 more digital I/O |

### ESP32 #2 (Node B - Ceiling) GPIO Map

```
                    ESP32 #2 PINOUT
     +------------------------------------------+
     |                                          |
     |  3V3 [POWER]-----> (available)           |
     |  GND [POWER]-----> Common Ground Bus     |
     |  VIN [5V]-------> Radar VCC, Relay VCC   |
     |                                          |
     |  GPIO 21 [I2C SDA]---> (available)       | FREE
     |  GPIO 22 [I2C SCL]---> (available)       | FREE
     |                                          |
     |  GPIO 16 [UART2 RX]---> Radar TX         | USED
     |  GPIO 17 [UART2 TX]---> Radar RX         | USED
     |                                          |
     |  GPIO 5  [DIGITAL]----> Relay #2 IN      | USED (strapping pin*)
     |                                          |
     |  GPIO 4  [DIGITAL]----> (available)      | FREE
     |  GPIO 18 [DIGITAL]----> (available)      | FREE
     |  GPIO 19 [DIGITAL]----> (available)      | FREE
     |  GPIO 23 [DIGITAL]----> (available)      | FREE
     |  GPIO 25 [DIGITAL]----> (available)      | FREE
     |  GPIO 26 [DIGITAL]----> (available)      | FREE
     |  GPIO 27 [DIGITAL]----> (available)      | FREE
     |  GPIO 32 [ADC]--------> (available)      | FREE
     |  GPIO 33 [ADC]--------> (available)      | FREE
     |                                          |
     +------------------------------------------+
```

#### ESP32 #2 Resource Summary

| Interface | Status | Current Use | Can Add |
|-----------|--------|-------------|---------|
| I2C (21/22) | **FREE** | - | I2C sensors (temp, humidity, etc.) |
| UART2 (16/17) | **USED** | Radar | - |
| UART1 (remap to 25/26) | **FREE** | - | 1 UART device |
| GPIO 5 | **USED** | Relay #2 | - |
| GPIO 4, 18, 19, 23, 25, 26, 27, 32, 33 | **FREE** | - | 9 more digital I/O |

---

## Part 4: Wiring Connections

### Base System Wiring (14 wires total)

```
WIRE MAP - NODE A (Door)
========================

ESP32 #1          PN532 NFC           Relay #1
---------         ---------           ---------
VIN (5V) -------> VCC                 VCC <---+
                                              |
GND ----------+-> GND                 GND <---+-- Common Ground
              |                               |
GPIO 21 ------+-> SDA                         |
GPIO 22 ------+-> SCL                         |
                                              |
GPIO 4 ------------------------------------> IN


WIRE MAP - NODE B (Ceiling)
===========================

ESP32 #2          Radar               Relay #2
---------         ---------           ---------
VIN (5V) -------> VCC                 VCC <---+
                                              |
GND ----------+-> GND                 GND <---+-- Common Ground
              |                               |
GPIO 16 <-----+-- TX (Radar TX to ESP RX)     |
GPIO 17 ------+-> RX (ESP TX to Radar RX)     |
                                              |
GPIO 5 ------------------------------------> IN
```

### Wire Count Summary

| Node | Device | Connection | Wires |
|------|--------|------------|-------|
| A | PN532 NFC | VCC, GND, SDA, SCL | 4 |
| A | Relay #1 | VCC, GND, IN | 3 |
| B | Radar | VCC, GND, TX, RX | 4 |
| B | Relay #2 | VCC, GND, IN | 3 |
| **TOTAL** | | | **14 wires** |

### Wire Inventory

```
DUPONT WIRE INVENTORY
=====================

Have:     20 wires (30cm F-F)
Used:     14 wires
Spare:    6 wires
```

---

## Part 5: Quick Reference

### GPIO Cheat Sheet

```
ESP32 #1 (Door)                        ESP32 #2 (Ceiling)
===============                        ==================
GPIO 4  = Relay #1 IN                  GPIO 5  = Relay #2 IN
GPIO 21 = PN532 SDA (I2C)              GPIO 16 = Radar TX -> ESP RX
GPIO 22 = PN532 SCL (I2C)              GPIO 17 = ESP TX -> Radar RX

FREE: 5,16,17,18,19,23,25,26,27,32,33  FREE: 4,18,19,21,22,23,25,26,27,32,33
```

### Power Connections

```
ESP32 #1 VIN (Node A):
  - PN532 VCC
  - Relay #1 VCC

ESP32 #2 VIN (Node B):
  - Radar VCC
  - Relay #2 VCC

GND Bus (common ground):
  - ALL device GNDs must connect together
```

### I2C Addresses In Use

| Address | Device | Node |
|---------|--------|------|
| 0x48 | PN532 NFC | A |
| (free) | - | B |

---

## Part 6: Maintenance Checklist

### Before Installing

- [ ] Test each ESP32 with blink sketch
- [ ] Test PN532 with I2C scanner
- [ ] Test radar with serial monitor
- [ ] Verify relay clicks with digital write test
- [ ] Label all wires before connecting

### After Installing

- [ ] Note wire colors used in this doc
- [ ] Record actual GPIO pins if changed from plan
- [ ] Test door lock actuation
- [ ] Test radar motion detection
- [ ] Verify ESP-NOW communication

---

## Notes

**\* Strapping pin:** GPIO 5 is an ESP32 strapping pin (per Espressif docs). It may output a brief signal during boot. The relay may click momentarily on ESP32 reboot.

**I2C pull-ups:** PN532 I2C mode requires external pull-up resistors on SDA/SCL (per Adafruit guide). ESP32 internal pull-ups (~45K) may work for short wires, but 4.7K external resistors are recommended if I2C is unreliable.

---

*End of Inventory Document*
