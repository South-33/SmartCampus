# Hardware Inventory & Resource Tracker

> Last Updated: January 2026
> Status: **ACTIVE PROCUREMENT**

---

## Quick Status Dashboard

```
+============================================================================+
|                        SYSTEM RESOURCE OVERVIEW                            |
+============================================================================+

  CONTROLLERS & SENSORS
  ---------------------
  ESP32 Nodes        [##########] 2/2 FULL      No spare controllers
  NFC Modules        [#####-----] 1/2 USED      1 spare for 2nd door
  Radar Sensors      [##########] 1/1 FULL      Buy more for expansion
  Finger Vein        [##########] 1/1 PLANNED   In cart
  Face Recognition   [##########] 1/1 PLANNED   In cart

  ACTUATORS & POWER
  -----------------
  Relay Modules      [##########] 2/2 FULL      Buy more for expansion
  USB-C Cables       [##########] 2/2 FULL      For flashing
  USB-C Breakouts    [#---------] 1/5 PLANNED   4 spare after Node A
  Level Shifters     [##--------] 2/10 PLANNED  8 spare after Node A

  WIRING & PROTOTYPING
  --------------------
  Dupont F-F 30cm    [#######---] 28/40 USED    ~12 spare wires
  Dupont M-M 30cm    [####------] 6/20 USED     ~14 spare wires
  Breadboard Wires   [----------] 0/65 USED     All 65 for testing
  Protoboards        [#---------] 1/6 USED      5 spare boards
  NFC Cards          [----------] 0/10 USED     All 10 for students

+============================================================================+
```

---

## Order Status Overview

| Category | Status | Est. Total |
|----------|--------|------------|
| **Order 1** | ORDERED | $55.51 |
| **Order 2 (Cart)** | TO ORDER | ~$123 |
| **GRAND TOTAL** | | **~$178** |

---

## Part 1: Already Ordered (AliExpress - $55.51)

These items are ordered and cannot be changed.

| # | Item | Qty | Price | Store | Notes |
|---|------|-----|-------|-------|-------|
| 1 | **ESP32 WROOM-32D** (CH340C, TYPE-C) | 2 | $9.29 | A+ Dropship | Main controllers |
| 2 | **PN532 NFC RFID Module V3** (2pcs set) | 2 | $8.37 | EGBO Store | I2C/SPI/HSU modes |
| 3 | **HLK-LD2410C Radar Sensor** | 1 | $2.52 | Shenzhen Hi-Link | mmWave presence |
| 4 | **5V Relay Module** (1-channel, 2pcs) | 2 | $1.32 | TZT 123 Official | Door lock + lights |
| 5 | **NTAG215 NFC Cards** (10pcs black) | 10 | $6.48 | nerina Store | Student ID cards |
| 6 | **Dupont Wire F-to-F** (30cm, 20pin) | 20 | $4.16 | Shop1103734083 | Sensor connections |
| 7 | **USB-C Cable 3A** (1m, black, 2pcs) | 2 | $5.33 | Ugreen Official | Flashing/power |
| 8 | **Soldering Iron 80W** (220V EU plug) | 1 | $12.91 | Firsour Tools | Adjustable temp |

**Order 1 Total:** $55.51 (incl. shipping/discounts)

---

## Part 2: In Cart - To Order (~$112)

These items are in your AliExpress cart, not yet ordered.

### Core Components

| # | Item | Qty | Price | Store | Purpose |
|---|------|-----|-------|-------|---------|
| 1 | **Waveshare Finger Vein Module (A)** | 1 | $29.14 | Ditu Technology | Primary biometric |
| 2 | **HLK-TX510 Face Recognition Test Suit** | 1 | $42.71 | HI-LINK Component | Secondary biometric (with screen) |

### Wiring & Connections

| # | Item | Qty | Price | Store | Purpose |
|---|------|-----|-------|-------|---------|
| 3 | **Dupont Wire M-to-M** (30cm, 20pin) | 20 | $4.26 | Shop1103734083 | Protoboard soldering |
| 4 | **Dupont Wire F-to-F** (30cm, 20pin) | 20 | $4.16 | Shop1103734083 | Sensor connections |
| 5 | **Logic Level Converter 4-ch** (10pcs) | 10 | $1.94 | Si Tai&SH IC | 3.3V <-> 5V safety |
| 6 | **4.7K Resistors** (100pcs) | 100 | $0.80 | Shop911191007 | I2C pull-ups |

### Power & Mounting

| # | Item | Qty | Price | Store | Purpose |
|---|------|-----|-------|-------|---------|
| 7 | **USB-C Breakout Board** (5pcs) | 5 | $4.32 | Practical Tool 47 | Power rail injection |
| 8 | **Waterproof Box IP65** (158x90x60mm, clear) | 1 | $12.25 | AIRLGEE Electrical | Outdoor enclosure |
| 9 | **Cable Glands PG7** (10pcs) | 10 | $4.79 | Home Improvement | Weatherproof cable entry |
| 10 | **Protoboard 7x9cm** (double-sided) | 3 | $2.91 | TZT 123 Official | Main circuit board |
| 11 | **Protoboard 5x7cm** (double-sided) | 3 | $2.10 | TZT 123 Official | Testing/spare |
| 12 | **Heat Shrink Tubing Kit** (164pcs) | 1 | $1.78 | Ammax Franchise | Wire insulation |

### Testing Equipment

| # | Item | Qty | Price | Store | Purpose |
|---|------|-----|-------|-------|---------|
| 13 | **MB-102 Breadboard Kit** (830pt + power module + 65 wires + case) | 1 | $5.44 | DIYUSER | Test before soldering |
| 14 | **ANENG SZ308 Digital Multimeter** (with probes + box) | 1 | $6.80 | ANENG Official | Voltage/continuity testing |

**Cart Total:** ~$123

---

## Part 3: Get Locally

No items - everything is in cart now.

---

## Part 4: Component Allocation Map

### Node Assignment Diagram

```
+---------------------------+          +---------------------------+
|     NODE A (Door)         |          |     NODE B (Ceiling)      |
|       "Gatekeeper"        |          |       "Watchman"          |
+---------------------------+          +---------------------------+
|                           |          |                           |
|  [x] ESP32 #1             |  ESP-NOW |  [x] ESP32 #2             |
|  [x] PN532 NFC #1 (I2C)   | <------> |  [x] HLK-LD2410C Radar    |
|  [x] Finger Vein (UART1)  |          |  [x] Relay #2             |
|  [x] TX510 Face (UART2)   |          |  [x] USB-C Cable #2       |
|  [x] Relay #1             |          |                           |
|  [x] USB-C Cable #1       |          |                           |
|  [x] Level Shifter x2     |          |                           |
|  [x] USB-C Breakout #1    |          |                           |
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

| Component | Qty Owned | Node A | Node B | SPARE | Status |
|-----------|:---------:|:------:|:------:|:-----:|--------|
| ESP32 WROOM-32D | 2 | 1 | 1 | 0 | FULL |
| PN532 NFC Module | 2 | 1 | 0 | 1 | 1 spare |
| HLK-LD2410C Radar | 1 | 0 | 1 | 0 | FULL |
| Finger Vein Module | 1 | 1 | 0 | 0 | FULL |
| TX510 Face Recognition | 1 | 1 | 0 | 0 | FULL |
| 5V Relay Module | 2 | 1 | 1 | 0 | FULL |
| Level Shifter 4-ch | 10 | 2 | 0 | 8 | Plenty spare |
| USB-C Breakout | 5 | 1 | 0 | 4 | Plenty spare |
| Protoboard 7x9cm | 3 | 1 | 0 | 2 | Spare |
| Protoboard 5x7cm | 3 | 0 | 0 | 3 | All spare |

---

## Part 5: GPIO & Interface Resource Tracking

### ESP32 #1 (Node A - Door) GPIO Map

```
                    ESP32 #1 PINOUT
     +------------------------------------------+
     |                                          |
     |  3V3 [POWER]-----> Level Shifter LV      | USED
     |  GND [POWER]-----> Common Ground Bus     | USED
     |  VIN [5V]--------> 5V Power Rail         | USED
     |                                          |
     |  GPIO 21 [I2C SDA]---> PN532 SDA         | USED (NFC)
     |  GPIO 22 [I2C SCL]---> PN532 SCL         | USED (NFC)
     |                                          |
     |  GPIO 16 [UART2 RX]---> Finger Vein TX   | USED (Biometric)
     |  GPIO 17 [UART2 TX]---> Finger Vein RX   | USED (Biometric)
     |                                          |
     |  GPIO 25 [DIGITAL]----> Relay #1 IN      | USED (door lock)
     |                                          |
     |  GPIO 4  [DIGITAL]----> TX510 RX (via LLC)| USED (Face)
     |  GPIO 5  [DIGITAL]----> TX510 TX (via LLC)| USED (Face)
     |                                          |
     |  GPIO 18 [DIGITAL]----> (available)      | FREE
     |  GPIO 19 [DIGITAL]----> (available)      | FREE
     |  GPIO 23 [DIGITAL]----> (available)      | FREE
     |  GPIO 26 [DIGITAL]----> (available)      | FREE
     |  GPIO 27 [DIGITAL]----> (available)      | FREE
     |  GPIO 32 [ADC]---------> (available)     | FREE
     |  GPIO 33 [ADC]---------> (available)     | FREE
     |                                          |
     +------------------------------------------+
```

#### ESP32 #1 Resource Summary

| Interface | Status | Current Use | Available |
|-----------|--------|-------------|-----------|
| I2C (21/22) | **USED** | PN532 NFC | Can add more I2C devices |
| UART2 (16/17) | **USED** | Finger Vein | - |
| GPIO 4/5 | **USED** | TX510 (software UART) | - |
| GPIO 25 | **USED** | Relay #1 | - |
| GPIO 18,19,23,26,27,32,33 | **FREE** | - | 7 GPIOs available |

### ESP32 #2 (Node B - Ceiling) GPIO Map

```
                    ESP32 #2 PINOUT
     +------------------------------------------+
     |                                          |
     |  3V3 [POWER]-----> (available)           |
     |  GND [POWER]-----> Common Ground Bus     | USED
     |  VIN [5V]--------> Radar VCC, Relay VCC  | USED
     |                                          |
     |  GPIO 21 [I2C SDA]---> (available)       | FREE
     |  GPIO 22 [I2C SCL]---> (available)       | FREE
     |                                          |
     |  GPIO 16 [UART2 RX]---> Radar TX         | USED (Radar)
     |  GPIO 17 [UART2 TX]---> Radar RX         | USED (Radar)
     |                                          |
     |  GPIO 26 [DIGITAL]----> Relay #2 IN      | USED (lights)
     |                                          |
     |  GPIO 4  [DIGITAL]----> (available)      | FREE
     |  GPIO 5  [DIGITAL]----> (available)      | FREE
     |  GPIO 18 [DIGITAL]----> (available)      | FREE
     |  GPIO 19 [DIGITAL]----> (available)      | FREE
     |  GPIO 23 [DIGITAL]----> (available)      | FREE
     |  GPIO 25 [DIGITAL]----> (available)      | FREE
     |  GPIO 27 [DIGITAL]----> (available)      | FREE
     |  GPIO 32 [ADC]---------> (available)     | FREE
     |  GPIO 33 [ADC]---------> (available)     | FREE
     |                                          |
     +------------------------------------------+
```

#### ESP32 #2 Resource Summary

| Interface | Status | Current Use | Available |
|-----------|--------|-------------|-----------|
| I2C (21/22) | **FREE** | - | Can add I2C sensors |
| UART2 (16/17) | **USED** | Radar | - |
| GPIO 26 | **USED** | Relay #2 | - |
| GPIO 4,5,18,19,23,25,27,32,33 + I2C | **FREE** | - | 11 GPIOs available |

---

## Part 6: Wire Budget & Connections

### Total Wire Inventory

| Type | Ordered | In Cart | Kit | Total | For |
|------|:-------:|:-------:|:---:|:-----:|-----|
| F-to-F 30cm | 20 | 20 | - | **40** | Sensor connections |
| M-to-M 30cm | - | 20 | - | **20** | Protoboard work |
| Breadboard jumpers | - | - | 65 | **65** | Testing on breadboard |
| **GRAND TOTAL** | | | | **125 wires** | |

### Wire Usage Breakdown

```
NODE A WIRING (Door)
====================

ESP32 #1          PN532 NFC           Relay #1        Finger Vein
---------         ---------           --------        -----------
VIN (5V) -------> VCC                 VCC <---+       VCC <-- 3.3V
                                              |
GND ----------+-> GND                 GND <---+------ GND
              |                               |
GPIO 21 ------+-> SDA (+ 4.7K pull-up)        |
GPIO 22 ------+-> SCL (+ 4.7K pull-up)        |
                                              |
GPIO 25 ----------------------------------------> IN
                                              
GPIO 16 <---------------------------------------- TX
GPIO 17 ----------------------------------------> RX


              TX510 Face (via Level Shifter)
              ------------------------------
              VCC <-- 5V Rail (from USB-C Breakout)
              GND <-- Common Ground
              
GPIO 4 -----> LLC LV1 ----> LLC HV1 -----> TX510 RX
GPIO 5 <----- LLC LV2 <---- LLC HV2 <----- TX510 TX


NODE B WIRING (Ceiling)
=======================

ESP32 #2          Radar               Relay #2
---------         ---------           --------
VIN (5V) -------> VCC                 VCC <---+
                                              |
GND ----------+-> GND                 GND <---+-- Common Ground
              |                               |
GPIO 16 <-----+-- TX (Radar TX to ESP RX)     |
GPIO 17 ------+-> RX (ESP TX to Radar RX)     |
                                              |
GPIO 26 ----------------------------------------> IN
```

### Wire Count Per Node

| Node | Component | Wires | Type |
|------|-----------|:-----:|------|
| A | PN532 NFC | 4 | F-F (VCC, GND, SDA, SCL) |
| A | Finger Vein | 4 | F-F (VCC, GND, TX, RX) |
| A | TX510 Face | 4 | F-F (VCC, GND, TX, RX) |
| A | Level Shifter | 6 | F-F (HV, LV, GND x2, signals x2) |
| A | Relay #1 | 3 | F-F (VCC, GND, IN) |
| A | USB-C Breakout | 4 | M-M (solder to protoboard) |
| A | Pull-up resistors | 2 | Resistor leads |
| **Node A Total** | | **~27** | |
| B | Radar | 4 | F-F (VCC, GND, TX, RX) |
| B | Relay #2 | 3 | F-F (VCC, GND, IN) |
| **Node B Total** | | **~7** | |
| **TOTAL USED** | | **~34** | |

### Wire Budget Summary

```
WIRE BUDGET
===========

F-to-F 30cm:     40 total - 28 used = 12 SPARE
M-to-M 30cm:     20 total - 6 used  = 14 SPARE
Breadboard:      65 total - 0 used  = 65 SPARE (for testing)

VERDICT: Sufficient wires for the project.
```

---

## Part 7: Technical Specifications

### Verified Specifications (HIGH CONFIDENCE)

| Component | Voltage | Logic Level | Level Shifter? | Baud Rate | Source |
|-----------|---------|-------------|----------------|-----------|--------|
| **Finger Vein (A)** | 3.3V | 3.3V UART | NO | 57600 | Waveshare Wiki |
| **PN532 NFC V3** | 3.3-5V VCC | 3.3V I2C | NO | - | Adafruit docs |
| **HLK-LD2410C** | 5V | 3.3V UART | NO | 256000 | HiLink docs |
| **5V Relay** | 5V | 3.3V trigger OK | NO | - | Common spec |

### Uncertain Specifications (LOW CONFIDENCE)

| Component | What's Unknown | Best Guess | Risk Mitigation |
|-----------|----------------|------------|-----------------|
| **HLK-TX510** | UART logic voltage | Likely 3.3V | Using level shifter anyway |
| **HLK-TX510** | Peak current draw | ~1A budget | USB-C breakout for power |
| **HLK-TX510** | Baud rate | 115200 | From Blakadder review |

> **Note:** TX510 UART voltage is not officially documented. Blakadder connected ESP32 directly without issues. Using level shifter as cheap insurance ($0.16 each).

### I2C Address Map

| Address | Device | Node | Notes |
|---------|--------|------|-------|
| 0x24 or 0x48 | PN532 NFC | A | Check jumpers on board |
| (free) | - | B | Available for expansion |

---

## Part 8: Power Architecture

### Power Distribution (Node A)

```
[ Power Bank / USB Adapter ]
       |
       | (USB-C Cable)
       v
[ USB-C Breakout Board ] (Soldered to Protoboard)
       |      |
       | VCC  | GND
       v      v
   [ 5V RAIL ] [ GND RAIL ]  <-- The Main Power Bus
       |            |
       +---> ESP32 VIN
       +---> TX510 (5V, ~1A peak)
       +---> PN532 VCC (5V input, 3.3V internal)
       +---> Relay VCC (5V)
       |
       +---> Level Shifter HV side (5V)
       
   [ 3V3 from ESP32 ]
       |
       +---> Level Shifter LV side (3.3V)
       +---> Finger Vein VCC (3.3V)
```

### Why USB-C Breakout?

The ESP32's onboard voltage regulator can only supply ~500mA safely. The TX510 may draw ~1A during face recognition. Connecting high-power devices directly to ESP32 VIN risks:
- Overheating the ESP32's regulator
- Brownouts during peak current
- Unstable operation

The USB-C breakout provides clean 5V directly from the power source, bypassing the ESP32's limitations.

---

## Part 9: Expansion Capacity

### What You Can Still Add

| Resource | Currently Free | Can Add |
|----------|----------------|---------|
| ESP32 #1 GPIOs | 7 pins | Buttons, LEDs, buzzers, more sensors |
| ESP32 #2 GPIOs | 11 pins | Environmental sensors (temp, humidity) |
| ESP32 #2 I2C | Full bus free | OLED display, I2C sensors |
| Level Shifters | 8 spare | More 5V sensors |
| USB-C Breakouts | 4 spare | Additional power injection points |
| Protoboards | 5 spare | More circuit boards |
| PN532 NFC | 1 spare | Second door reader |

### Expansion Examples

| Want to Add | Requirements | Available? |
|-------------|--------------|------------|
| Status LED on door | 1 GPIO + LED | YES (GPIO 18) |
| Buzzer for feedback | 1 GPIO + buzzer | YES (GPIO 19) |
| Temperature sensor (I2C) | I2C bus | YES (Node B has free I2C) |
| Second NFC reader | 1 PN532 + I2C | YES (spare PN532) |
| Emergency button | 1 GPIO | YES (multiple free) |

---

## Part 10: Checklist

### While Waiting for Delivery
- [ ] Watch soldering tutorials (first-time solderer)
- [ ] Read component datasheets

### After Delivery - Testing Phase
- [ ] Test each ESP32 with blink sketch
- [ ] Test PN532 I2C connection (add 4.7K pull-ups)
- [ ] Test Finger Vein UART (57600 baud)
- [ ] Test TX510 UART (115200 baud)
- [ ] Test Radar UART (256000 baud)
- [ ] Test Relay actuation
- [ ] Test ESP-NOW between two ESP32s

### Build Phase
- [ ] Only after ALL tests pass on breadboard
- [ ] Draw final wiring diagram
- [ ] Label all wires before soldering
- [ ] Solder to protoboard
- [ ] Mount in waterproof box
- [ ] Install cable glands

---

## Documentation Links

| Component | Documentation |
|-----------|---------------|
| Waveshare Finger Vein | [Wiki](https://www.waveshare.com/wiki/Finger_Vein_Scanner_Module_(A)) |
| Finger Vein Protocol | [PDF](https://files.waveshare.com/wiki/Finger_Vein_Scanner_Module_B/Finger_Vein_Module_Communication_Protocol_EN.pdf) |
| HLK-TX510 | [GitHub Repo](https://github.com/blakadder/HLK-TX510) |
| HLK-TX510 Review | [Blakadder](https://blakadder.com/hlk-tx510/) |
| PN532 Library | [Adafruit](https://github.com/adafruit/Adafruit-PN532) |
| HLK-LD2410 Library | [GitHub](https://github.com/ncmreynolds/ld2410) |
| ESP-NOW | [Espressif Docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html) |

---

*End of Inventory Document*