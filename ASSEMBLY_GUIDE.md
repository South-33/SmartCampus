# Complete Hardware Assembly Guide

> **For Absolute Beginners** - No prior electronics experience required
> 
> Last Updated: February 2026 | SmartCampus Project v2.0

---

## Table of Contents

1. [Before You Begin](#1-before-you-begin)
2. [Safety & ESD Protection](#2-safety--esd-protection)
3. [Your Tools & What They Do](#3-your-tools--what-they-do)
4. [Workspace Setup](#4-workspace-setup)
5. [Understanding Your Components](#5-understanding-your-components)
6. [ESP32 First Boot](#6-esp32-first-boot)
7. [Breadboard Fundamentals](#7-breadboard-fundamentals)
8. [Component Testing - PN532 NFC Reader](#8-component-testing---pn532-nfc-reader)
9. [Component Testing - Relay Module](#9-component-testing---relay-module)
10. [Component Testing - Finger Vein Sensor](#10-component-testing---finger-vein-sensor)
11. [Component Testing - TX510 Face Recognition](#11-component-testing---tx510-face-recognition)
12. [Component Testing - LD2410 Radar](#12-component-testing---ld2410-radar)
13. [Integration Testing - Gatekeeper Node](#13-integration-testing---gatekeeper-node)
14. [Integration Testing - Watchman Node](#14-integration-testing---watchman-node)
15. [ESP-NOW Pairing](#15-esp-now-pairing)
16. [Soldering Tutorial](#16-soldering-tutorial)
17. [Permanent Assembly](#17-permanent-assembly)
18. [Enclosure & Mounting](#18-enclosure--mounting)
19. [Troubleshooting Encyclopedia](#19-troubleshooting-encyclopedia)
20. [Quick Reference Cards](#20-quick-reference-cards)

---

# 1. Before You Begin

## The Golden Rules

```
+===========================================================================+
|                         THE 5 GOLDEN RULES                                 |
+===========================================================================+
|                                                                           |
|  1. POWER OFF before connecting/disconnecting ANYTHING                    |
|                                                                           |
|  2. DOUBLE-CHECK wiring BEFORE powering on                                |
|                                                                           |
|  3. TEST each component INDIVIDUALLY before combining                     |
|                                                                           |
|  4. When in doubt, STOP and ASK                                           |
|                                                                           |
|  5. If something smells burning, UNPLUG IMMEDIATELY                       |
|                                                                           |
+===========================================================================+
```

## What You're Building

You're building a **two-node wireless access control system**:

```
    NODE A (Gatekeeper)                    NODE B (Watchman)
    ==================                     ==================
    Location: Door Frame                   Location: Ceiling
    
    +------------------+                   +------------------+
    |     ESP32 #1     |    ESP-NOW        |     ESP32 #2     |
    |                  | <===============> |                  |
    | + NFC Reader     |    (wireless)     | + Radar Sensor   |
    | + Finger Vein    |                   | + Power Relay    |
    | + Face Camera    |                   |                  |
    | + Door Relay     |                   |                  |
    +--------|---------+                   +--------|---------+
             |                                      |
             v                                      v
        Door Lock                            Room Lights/AC
```

## Estimated Time

| Phase | Time | Difficulty |
|-------|------|------------|
| ESP32 First Boot | 30 min | Easy |
| Individual Component Tests | 2-3 hours | Easy |
| Integration Tests | 2-3 hours | Medium |
| Soldering & Assembly | 4-6 hours | Medium |
| Enclosure & Mounting | 2-3 hours | Medium |
| **Total** | **10-15 hours** | - |

> **Tip:** Don't rush. Take breaks. Mistakes happen when you're tired.

---

# 2. Safety & ESD Protection

## Electrical Safety

### Voltage Levels in This Project

| Voltage | Source | Danger Level | Components |
|---------|--------|--------------|------------|
| **5V DC** | USB | Safe | ESP32, NFC, Radar, TX510, Relay coil |
| **3.3V DC** | ESP32 output | Safe | Finger Vein, logic signals |
| **120/240V AC** | Wall outlet | **LETHAL** | Only if connecting real door lock |

> **WARNING:** This guide covers only the LOW VOLTAGE (5V/3.3V) portion.  
> If you need to connect to mains voltage (door locks, AC lights), **hire a licensed electrician**.

### Safety Rules

1. **Never work on a powered circuit** - Always unplug USB before making changes
2. **Keep drinks away** - Water + electronics = bad
3. **Work in good lighting** - You need to see what you're doing
4. **Don't force connections** - If it doesn't fit, you're doing it wrong
5. **Touch ground first** - Discharge static before handling components

## ESD (Electrostatic Discharge) Protection

Your body can hold **thousands of volts** of static electricity. You won't feel it, but it can destroy sensitive electronics instantly.

### The Static Problem

```
You (standing on carpet, wearing socks):  +3,000 volts
ESP32 maximum tolerance:                  ~20 volts

Result: Dead ESP32
```

### How to Protect Your Components

**Minimum Protection (Do This At Least):**
1. Touch a **grounded metal object** before handling any component
   - Metal computer case (while plugged in but off)
   - Metal water pipe
   - Radiator
2. Don't shuffle your feet while working
3. Avoid working on carpet if possible

**Better Protection:**
1. Work on a **wooden or tile floor**
2. Use a **metal table** and touch it frequently
3. Keep components in their **anti-static bags** until needed

**Best Protection (Recommended for Cold/Dry Climates):**
1. Buy an **anti-static wrist strap** (~$5)
2. Clip it to your wrist, connect the other end to:
   - The metal case of a plugged-in computer
   - A grounded outlet's screw
   - Any grounded metal pipe

### Your Anti-Static Routine

Before touching any component:
```
1. Stand up from chair
2. Touch metal table/computer case with whole palm (not just fingertip)
3. Wait 1 second
4. Pick up component by its edges (avoid touching chips)
```

---

# 3. Your Tools & What They Do

## Tools From Your Orders

### Multimeter (ANENG SZ308)

Your **most important tool** for debugging. It measures voltage, current, resistance, and continuity.

```
                    ANENG SZ308 MULTIMETER
                    
                       +-----------+
                       |   LCD     |
                       |  DISPLAY  |
                       +-----------+
                       |           |
    MODE DIAL -------> |  [DIAL]   |
                       |           |
                       +-----+-----+
                             |
              +--------------+---------------+
              |              |               |
           [COM]          [VΩmA]          [10A]
              |              |               |
         Black Probe    Red Probe      (Don't use)
```

**Dial Positions You'll Use:**

| Symbol | What It Measures | When to Use |
|--------|------------------|-------------|
| **V⎓** (V with ⎓) | DC Voltage | Check power rails (5V, 3.3V) |
| **Ω** | Resistance | Check resistor values, short circuits |
| **)))** (Sound waves) | Continuity | Test if two points are connected |

**How to Use:**
1. Insert **black probe** into **COM** port
2. Insert **red probe** into **VΩmA** port
3. Turn dial to desired mode
4. Touch probes to circuit

### Breadboard (MB-102 Kit)

A board for **temporary circuits** - no soldering required.

```
        MB-102 BREADBOARD LAYOUT
        
    Power Rails (horizontal)
    ========================
    + + + + + + + + + + + + +  <-- Red line = Positive (5V or 3.3V)
    - - - - - - - - - - - - -  <-- Blue line = Ground (GND)
    
    Terminal Strips (vertical)
    ==========================
    a b c d e | | f g h i j
    +---------+ +---------+
    | 1 1 1 1 | | 1 1 1 1 |    <-- Row 1: a-e connected, f-j connected
    | 2 2 2 2 | | 2 2 2 2 |    <-- Row 2: a-e connected, f-j connected
    | 3 3 3 3 | | 3 3 3 3 |    <-- Row 3: etc...
    |   ...   | |   ...   |
    | 30 30 30| |30 30 30 |
    +---------+ +---------+
       GAP (not connected)
```

**Key Concepts:**
- **Power rails** (+ and -) run **horizontally** across the board
- **Terminal strips** (a-e and f-j) run **vertically** in groups of 5
- The **center gap** separates left and right - they're NOT connected
- Push components' legs into holes - they grip automatically

### Soldering Iron (80W)

For **permanent connections** after testing works on breadboard.

```
                SOLDERING IRON ANATOMY
                
    Handle                 Heating Element    Tip
    [=====================================]====>
                |
                v
           Temperature
           Control Dial
```

**Temperature Settings:**
| Material | Temperature |
|----------|-------------|
| Thin wires, small components | 300-320°C |
| Thick wires, large pads | 350-380°C |
| Lead-free solder (harder) | 370-400°C |

> **You won't use this until Phase 4 (Permanent Assembly)**. Focus on breadboard testing first.

### Dupont Wires

Pre-made jumper wires with connectors on each end:

```
    DUPONT WIRE TYPES
    
    Female-to-Female (F-F)        Male-to-Male (M-M)
    [===]----------[===]          |---|----------|---|
    
    Use F-F for:                  Use M-M for:
    - Connecting TO modules       - Breadboard connections
    - Sensor connections          - Bridging power rails
```

### USB-C Cables

You have 2 USB-C cables. Keep them labeled:

```
    Cable #1: "ESP32 #1" (Gatekeeper)
    Cable #2: "ESP32 #2" (Watchman)
```

> **Important:** Not all USB-C cables are equal. Your cables are **data cables** (can transfer data).  
> Cheap cables are often **charge-only** (won't work for programming).

---

# 4. Workspace Setup

## Ideal Setup

```
+===========================================================================+
|                           WORKSPACE LAYOUT                                 |
+===========================================================================+
|                                                                           |
|     +----------------+          +-------------------+                     |
|     |    COMPUTER    |          |   WELL-LIT AREA   |                     |
|     |  (Serial Mon.) |          |   (your work)     |                     |
|     +-------+--------+          +-------------------+                     |
|             |                            |                                |
|             |   USB Cable                |                                |
|             +----------------------------+                                |
|                                                                           |
|     +------------------+    +------------------+    +------------------+  |
|     | COMPONENT TRAY   |    |   BREADBOARD     |    |    MULTIMETER    |  |
|     | (organized)      |    |   (work area)    |    |   (within reach) |  |
|     +------------------+    +------------------+    +------------------+  |
|                                                                           |
|     +------------------------------------------------------------------+  |
|     |                    ANTI-STATIC MAT (optional)                     |  |
|     +------------------------------------------------------------------+  |
|                                                                           |
+===========================================================================+
```

## Minimum Requirements

- [ ] **Good lighting** - desk lamp or window
- [ ] **Flat, stable surface** - not your bed
- [ ] **Computer nearby** - for Serial Monitor
- [ ] **Phone/tablet** - to read this guide while working
- [ ] **Small containers** - to organize parts (egg cartons work great)

## Organize Your Components

Before starting, lay out all your components:

```
+-----------------------------------------------------------------------+
|  TRAY 1: Controllers          |  TRAY 2: Sensors                      |
|  - ESP32 #1                   |  - PN532 NFC Module                   |
|  - ESP32 #2                   |  - Finger Vein Sensor                 |
|  - USB-C Cables               |  - TX510 Face Module                  |
|                               |  - LD2410 Radar                       |
+-----------------------------------------------------------------------+
|  TRAY 3: Actuators            |  TRAY 4: Wiring & Misc                |
|  - Relay Module #1            |  - Dupont Wires (F-F and M-M)         |
|  - Relay Module #2            |  - Resistors (4.7K)                   |
|  - NFC Cards (NTAG215)        |  - USB-C Breakout Boards              |
|                               |  - Breadboard + Power Module          |
+-----------------------------------------------------------------------+
```

---

# 5. Understanding Your Components

## ESP32 WROOM-32D

Your **main microcontroller** - the brain of each node.

```
                         ESP32 WROOM-32D PINOUT
                         
                             ANTENNA
                           ___________
                          |           |
              EN/RST ----o|           |o---- GPIO23
             GPIO36 -----o|           |o---- GPIO22  (I2C SCL)
             GPIO39 -----o|           |o---- GPIO1   (TX0)
             GPIO34 -----o|           |o---- GPIO3   (RX0)
             GPIO35 -----o|           |o---- GPIO21  (I2C SDA)
             GPIO32 -----o|           |o---- GND
             GPIO33 -----o|   ESP32   |o---- GPIO19
             GPIO25 -----o|           |o---- GPIO18
             GPIO26 -----o|           |o---- GPIO5
             GPIO27 -----o|           |o---- GPIO17  (UART2 TX)
             GPIO14 -----o|           |o---- GPIO16  (UART2 RX)
             GPIO12 -----o|           |o---- GPIO4
                GND -----o|           |o---- GPIO2   (Built-in LED)
             GPIO13 -----o|           |o---- GPIO15
               SD2  -----o|           |o---- SD1
               SD3  -----o|   USB-C   |o---- SD0
               CMD  -----o|___________|o---- CLK
                                |
                            +---+---+
                            | USB-C |
                            +-------+
                           
        3V3 -----o                         o----- VIN (5V input)
        GND -----o                         o----- GND
```

**Power Options:**
| Pin | Voltage | When to Use |
|-----|---------|-------------|
| **VIN** | 5V | Powering via USB or external 5V supply |
| **3V3** | 3.3V | Output - powers 3.3V sensors |
| **GND** | Ground | Always connect to circuit ground |

**GPIOs We Use:**

| GPIO | Function in Gatekeeper | Function in Watchman |
|------|------------------------|----------------------|
| 21 | I2C SDA (NFC) | - |
| 22 | I2C SCL (NFC) | - |
| 16 | UART2 RX (Finger Vein) | UART2 RX (Radar) |
| 17 | UART2 TX (Finger Vein) | UART2 TX (Radar) |
| 4 | UART1 RX (TX510 Face) | - |
| 5 | UART1 TX (TX510 Face) | - |
| 25 | Relay Control | - |
| 26 | - | Relay Control |
| 2 | Built-in LED | Built-in LED |

**GPIOs to Avoid:**
| GPIO | Why |
|------|-----|
| 0, 1, 3 | Used for boot/serial |
| 6-11 | Connected to flash memory |
| 12 | Boot mode (must be LOW at boot) |

## PN532 NFC Module

**Purpose:** Reads NFC cards (NTAG215) and phone NFC signals.

```
                    PN532 NFC MODULE V3
                    
    +-------------------------------------------+
    |                                           |
    |   +-------+     +------------------+      |
    |   |  MCU  |     |   NFC ANTENNA    |      |
    |   +-------+     |                  |      |
    |                 |   (coil area)    |      |
    |                 +------------------+      |
    |                                           |
    |  [LED]                                    |
    |                                           |
    +-----+-------------------------------------+
          |
    +-----+-----+
    |  DIP SW   |   <-- Mode selection switches
    |  1   2    |
    +-----+-----+
          |
    +-----+-------------------------------------------+
    | VCC | GND | SDA | SCL | RSTPDN | IRQ | RQST    |
    +-----+-----+-----+-----+--------+-----+---------+
      5V   GND  Data  Clock  (unused for I2C mode)
```

**DIP Switch Settings for I2C Mode:**
```
    +-------+
    | 1 | 2 |
    +---+---+
    |OFF|ON |  <-- This is correct for I2C
    +---+---+
```

## Relay Module (5V 1-Channel)

**Purpose:** Switches high-power devices (door lock, lights) using low-power signal.

```
                    5V RELAY MODULE
                    
    Control Side (Low Voltage)      Load Side (High Voltage)
    ==========================      ========================
    
    +---------------------------+---+---+---+
    |                           |COM|NC |NO |
    |   +-----+                 +---+---+---+
    |   |RELAY|                   |   |   |
    |   |     |                   |   |   +--- Normally Open
    |   +-----+                   |   +------- Normally Closed
    |                             +----------- Common
    |   [LED] [LED]                           
    |   PWR   ACTIVE                          
    +-------+-------+-------+                 
            |       |       |                 
          [VCC]   [GND]   [IN]                
            |       |       |                 
           5V     Ground  Signal              
                          (GPIO)              
```

**Terminals Explained:**
| Terminal | Meaning | State When Relay OFF | State When Relay ON |
|----------|---------|---------------------|---------------------|
| **COM** | Common | - | - |
| **NC** | Normally Closed | Connected to COM | Disconnected |
| **NO** | Normally Open | Disconnected | Connected to COM |

**For Door Lock (Fail-Safe):**
- Connect lock between **COM** and **NC**
- When power fails, door **unlocks** (fire safety)

## Waveshare Finger Vein Sensor

**Purpose:** Biometric authentication using finger vein patterns (more secure than fingerprint).

```
                FINGER VEIN SENSOR MODULE (A)
                
    +-----------------------------------------+
    |                                         |
    |   +---------------+     +-----------+   |
    |   |    IR LEDs    |     | PROCESSOR |   |
    |   +---------------+     +-----------+   |
    |                                         |
    |   +---------------+                     |
    |   |    CAMERA     |                     |
    |   +---------------+                     |
    |                                         |
    |   [====== FINGER SLOT ======]           |
    |                                         |
    +----+-----+-----+-----+----+-----+-------+
         |     |     |     |    |     |
        VCC   GND   TXD   RXD  IRQ  WAKEUP
         |     |     |     |
       3.3V   GND   -->   <--
                    to    from
                  ESP32  ESP32
```

> **CRITICAL:** This module runs on **3.3V ONLY**.  
> Connecting 5V will **permanently damage** it!

**UART Settings:**
- Baud Rate: 57600
- Data Bits: 8
- Stop Bits: 1
- Parity: None

## HLK-TX510 Face Recognition

**Purpose:** 3D face recognition with infrared liveness detection (prevents photo spoofing).

```
                    HLK-TX510 MODULE (with Test Kit)
                    
    +------------------------------------------------+
    |                                                |
    |  +--------+  +--------+  +--------+            |
    |  |  RGB   |  | 3D IR  |  |  LCD   |            |
    |  | Camera |  | Camera |  |Display |            |
    |  +--------+  +--------+  +--------+            |
    |                                                |
    |                                                |
    |  [USB-C]    [Speaker]                          |
    |                                                |
    +-------+----+----+----+----+----+---------------+
            |    |    |    |    |    |
           VCC  GND  TX   RX  ...   ...
            |    |    |    |
           5V   GND   |    |
                      |    |
               to GPIO4   from GPIO5
               (ESP RX)   (ESP TX)
```

**Power Requirements:**
- Voltage: **5V**
- Current: **500-800mA peak** (needs external power, not from ESP32)

**UART Settings (UART1 on pins 38/39):**
- Baud Rate: 115200
- Data Bits: 8
- Stop Bits: 1
- Parity: None

## HLK-LD2410C Radar

**Purpose:** Detects human presence using 24GHz mmWave radar (works through walls, in darkness).

```
                    HLK-LD2410C RADAR
                    
    +------------------------+
    |                        |
    |   [=== ANTENNA ===]    |   <-- Radar detection area
    |                        |       (up to 5 meters)
    |   +----------------+   |
    |   |   PROCESSOR    |   |
    |   +----------------+   |
    |                        |
    +---+----+----+----+-----+
        |    |    |    |
       VCC  GND  TX   RX
        |    |    |    |
       5V   GND   |    |
                  |    |
           to GPIO16  from GPIO17
           (ESP RX)   (ESP TX)
```

> **CRITICAL:** This module requires **5V power**.  
> It will NOT work on 3.3V!

**UART Settings:**
- Baud Rate: 256000
- Data Bits: 8
- Stop Bits: 1
- Parity: None

---

# 6. ESP32 First Boot

## What You'll Achieve

By the end of this section, you will:
- [ ] Have PlatformIO installed
- [ ] Successfully connect ESP32 to your computer
- [ ] Upload a "blink" program
- [ ] See output in Serial Monitor

## Step 6.1: Install Software

### Install VS Code

1. Download from: https://code.visualstudio.com/
2. Install with default options
3. Launch VS Code

### Install PlatformIO Extension

1. In VS Code, click the **Extensions** icon (left sidebar, looks like 4 squares)
2. Search for "**PlatformIO IDE**"
3. Click **Install**
4. Wait for installation (may take 5-10 minutes)
5. Restart VS Code when prompted

```
    VS Code with PlatformIO
    
    +--------------------------------------------------+
    |  File  Edit  View  ...                           |
    +--------------------------------------------------+
    |     |                                            |
    | [E] |    Welcome to PlatformIO!                  |
    | [X] |                                            |
    | [P] | <-- PlatformIO icon (ant/alien head)       |
    |     |                                            |
    +--------------------------------------------------+
```

### Install USB Driver (if needed)

Your ESP32 uses a **CH340** USB-to-serial chip. Most modern systems auto-install drivers, but if it doesn't work:

**Windows:**
1. Download CH340 driver: https://www.wch.cn/downloads/CH341SER_EXE.html
2. Run installer
3. Restart computer

**Mac:**
1. Usually works automatically on macOS 10.12+
2. If not: https://www.wch.cn/downloads/CH341SER_MAC_ZIP.html

## Step 6.2: First Connection

### Connect ESP32

1. **Pick up ESP32 by edges** (avoid touching the metal shield)
2. Plug USB-C cable into ESP32
3. Plug other end into your computer
4. Look for:
   - Red LED on ESP32 (power indicator)
   - On Windows: "ding" sound for new device

### Find the COM Port

**Windows:**
1. Open **Device Manager** (search in Start menu)
2. Expand "**Ports (COM & LPT)**"
3. Look for "**USB-SERIAL CH340 (COM#)**"
4. Note the COM number (e.g., COM3)

```
    Device Manager
    
    > Audio inputs and outputs
    > Bluetooth
    v Ports (COM & LPT)
        USB-SERIAL CH340 (COM3)  <-- This is your ESP32
    > Processors
```

**Mac:**
1. Open Terminal
2. Type: `ls /dev/tty.usb*`
3. Look for something like `/dev/tty.usbserial-1420`

**If you don't see it:**
- Try a different USB port
- Try a different USB-C cable (some are charge-only)
- Install the CH340 driver (see above)

## Step 6.3: Create Test Project

### Create New Project

1. Click the **PlatformIO** icon (left sidebar)
2. Click "**PIO Home**" > "**Open**"
3. Click "**+ New Project**"

```
    New Project Settings:
    
    Name:           ESP32_Blink_Test
    Board:          Espressif ESP32 Dev Module
    Framework:      Arduino
    Location:       [Use default or choose folder]
```

4. Click "**Finish**" (wait for project creation)

### Write Blink Code

1. Open the project in `firmware/tests/01_esp32_blink` using VS Code.
2. Review the code in `src/main.cpp`. It's designed to verify your ESP32's basic functionality and show its MAC address.
3. Save the file if you made any changes.

### Upload the Code

1. Click the **checkmark** icon in the bottom toolbar (Build)
2. Wait for "SUCCESS" message
3. Click the **arrow** icon in the bottom toolbar (Upload)
4. Watch the progress...

```
    PlatformIO Toolbar (bottom of VS Code):
    
    [✓] [→] [🔌] [🗑️]
     |   |    |    |
    Build  Upload  Serial Monitor  Clean
```

**Expected Upload Output:**
```
Connecting........_____
Chip is ESP32-D0WDQ6 (revision 1)
Uploading stub...
Running stub...
Changing baud rate to 921600
Changed.
Writing at 0x00001000... (100 %)
Writing at 0x00008000... (100 %)
Writing at 0x0000e000... (100 %)
Writing at 0x00010000... (100 %)
Leaving...
Hard resetting via RTS pin...
=== [SUCCESS] ===
```

## Step 6.4: Open Serial Monitor

1. Click the **plug** icon in the bottom toolbar (Serial Monitor)
2. Or press: `Ctrl+Alt+S` (Windows) / `Cmd+Shift+P` > "PlatformIO: Monitor"
3. **Check baud rate is 115200** (bottom right of monitor window)

**Expected Output:**
```
========================================
ESP32 Blink Test
========================================
Chip Model: ESP32-D0WDQ6
Chip Revision: 1
Flash Size: 4 MB
Free Heap: 294 KB
MAC Address: 24:6F:28:XX:XX:XX
========================================
LED should be blinking now...

LED: ON
LED: OFF
LED: ON
LED: OFF
...
```

### Verify LED is Blinking

Look at your ESP32 board:
- The **blue LED** (near GPIO2) should blink every 500ms
- If the red LED is on but blue isn't blinking, there's a problem

## Step 6.5: Troubleshooting First Boot

| Problem | Cause | Solution |
|---------|-------|----------|
| "No COM port found" | Driver not installed | Install CH340 driver |
| "Failed to connect" | ESP32 not in boot mode | Hold BOOT button while uploading |
| "Permission denied" | Port in use | Close other programs using serial |
| Upload starts but hangs | Cable issue | Try different USB cable |
| Serial Monitor shows garbage | Wrong baud rate | Set to 115200 |
| No LED blinking | Wrong pin | Some boards use different LED pin |

### The BOOT Button Trick

If uploads fail, try this:
1. Click Upload
2. When you see "Connecting........", **hold the BOOT button** on ESP32
3. Keep holding until upload starts
4. Release BOOT button

```
                     ESP32 Buttons
                     
    [EN/RST]                    [BOOT]
       |                           |
    Restarts                   Hold during
    the board                  "Connecting..."
```

## Checkpoint: First Boot Complete

Before proceeding, verify:
- [ ] ESP32 LED is blinking
- [ ] Serial Monitor shows chip info
- [ ] You see "LED: ON" / "LED: OFF" messages
- [ ] You noted the MAC address (you'll need it later)

> **Write down your MAC address:**  
> ESP32 #1: `__:__:__:__:__:__`  
> (Do the same for ESP32 #2 later)

---

# 7. Breadboard Fundamentals

## How a Breadboard Works

The MB-102 breadboard has **internal metal strips** that connect certain holes:

```
            BREADBOARD INTERNAL CONNECTIONS
            
     Power Rails (horizontal connections)
     =====================================
     
     + + + + + + + + + + + + + + + + + + + + + + + + + +
     |_______________________________________________|  <-- All connected!
     
     - - - - - - - - - - - - - - - - - - - - - - - - - -
     |_______________________________________________|  <-- All connected!
     
     
     Terminal Area (vertical connections)
     ====================================
     
        a   b   c   d   e       f   g   h   i   j
     +---+---+---+---+---+     +---+---+---+---+---+
     | 1 | 1 | 1 | 1 | 1 |     | 1 | 1 | 1 | 1 | 1 |  Row 1
     |___|___|___|___|___|     |___|___|___|___|___|
          Connected               Connected
          
     | 2 | 2 | 2 | 2 | 2 |     | 2 | 2 | 2 | 2 | 2 |  Row 2
     |___|___|___|___|___|     |___|___|___|___|___|
     
                   GAP - NOT CONNECTED
```

**Key Rules:**
1. Power rails (+/-) run **horizontally** - great for distributing power
2. Terminal rows run **vertically** in groups of 5 (a-e and f-j)
3. **Center gap** separates left and right sides
4. A chip straddles the gap so each pin is isolated

## Setting Up Power Rails

### Power Module (from MB-102 kit)

Your kit includes a power module that provides regulated 5V and 3.3V:

```
          MB-102 POWER MODULE
          
    +---------------------------+
    |   [5V] [OFF] [3.3V]      |  <-- Voltage selectors (jumpers)
    |         LEFT  RIGHT       |      Set BOTH to 5V for now
    +---------------------------+
    |   [USB]       [DC Jack]   |  <-- Power input options
    +---------------------------+
            |           |
            |  Pins     |
            v           v
    +-----+-----+-----+-----+
    |  +  |  -  |  +  |  -  |  <-- These plug into breadboard
    +-----+-----+-----+-----+     power rails
```

### Setting Up Power

1. **Set both jumpers to 5V** (for now)
2. **Plug the power module** into the breadboard power rails:
   - The 4 pins should fit into + - + - of the power rails
   - Make sure + goes to + and - goes to -!

3. **Connect a USB cable** to the power module (not yet - do this after wiring)

```
    BREADBOARD WITH POWER MODULE
    
    +---[POWER MODULE]---+
    |                    |
    v                    v
    + + + + + + + + + + + +  <-- 5V (red)
    - - - - - - - - - - - -  <-- GND (blue)
    
    a b c d e   f g h i j
    [... terminal area ...]
    
    - - - - - - - - - - - -  <-- GND (blue)
    + + + + + + + + + + + +  <-- 5V (red)
```

### Verify Power with Multimeter

**Before connecting any components:**

1. Turn on multimeter, set to **V⎓** (DC Voltage)
2. Touch **black probe** to any **-** (blue) hole
3. Touch **red probe** to any **+** (red) hole
4. Display should show **~5.0V** (4.8-5.2V is acceptable)

```
    MEASURING VOLTAGE
    
                        Multimeter
                      +-----------+
                      |   5.02V   |
                      +-----------+
                           / \
                    red   /   \ black
                    probe/     \probe
                        /       \
                       +         -
    Power Rail:  + + + + + + + + - - - - - - - -
```

---

# 8. Component Testing - PN532 NFC Reader

## What You'll Achieve

By the end of this section, you will:
- [ ] Wire PN532 to ESP32 correctly
- [ ] Add required pull-up resistors
- [ ] Read an NFC card's UID
- [ ] Understand I2C communication

## Understanding I2C

I2C (Inter-Integrated Circuit) is a communication protocol using just 2 wires:
- **SDA** (Serial Data): Carries the actual data
- **SCL** (Serial Clock): Keeps sender and receiver in sync

```
    I2C COMMUNICATION
    
    ESP32 (Master)              PN532 (Slave)
    +-------------+             +-------------+
    |             |    SDA      |             |
    |         SDA |------------>|  SDA        |
    |             |    SCL      |             |
    |         SCL |------------>|  SCL        |
    +-------------+             +-------------+
                    
                 Both lines need PULL-UP resistors!
```

**Why Pull-Up Resistors?**
- I2C lines are "open-drain" - they can only pull LOW
- Pull-up resistors bring them HIGH when not actively driven
- Without them: random failures, no communication

## Wiring Diagram

```
                    PN532 NFC to ESP32 WIRING
                    
                                        +3.3V (from ESP32)
                                          |
                                    +-----+-----+
                                    |           |
                              [4.7K]R1    [4.7K]R2   <-- Pull-up resistors
                                    |           |
    PN532               +-----------+-----------+
    +-------+           |           |           |
    |  VCC  |-----------+-----------|-----------|------ VIN (5V from ESP32)
    |  GND  |------------------------------------ GND (ESP32)
    |  SDA  |----------------------------------+- GPIO21 (ESP32)
    |  SCL  |-----------------------------+      GPIO22 (ESP32)
    +-------+                             |
                                          +------ (also to R1)
```

### Step-by-Step Wiring

**What You Need:**
- ESP32 (already tested from Section 6)
- PN532 NFC Module
- 2x 4.7K resistors (from your order)
- 4x Female-to-Female Dupont wires

**Step 1: Set DIP Switches**

On the back of the PN532, find the DIP switches:
```
    DIP SWITCH SETTINGS
    
    +-------+
    | 1 | 2 |
    +---+---+
    |OFF|ON |  <-- Correct for I2C mode
    +---+---+
      ^   ^
      |   |
    Down  Up
```

**Step 2: Wire Power**

```
    Connection 1: PN532 VCC → ESP32 VIN (5V)
    Connection 2: PN532 GND → ESP32 GND
```

**Step 3: Wire Data Lines**

```
    Connection 3: PN532 SDA → ESP32 GPIO21
    Connection 4: PN532 SCL → ESP32 GPIO22
```

**Step 4: Add Pull-Up Resistors (Maybe)**

> **IMPORTANT: Check your specific board first!**
> 
> Your PN532 V3 module from AliExpress may already have built-in pull-up resistors.
> 
> **Before adding external pull-ups:**
> 1. Try connecting WITHOUT any external resistors first
> 2. Run the NFC test sketch
> 3. If it works → you don't need external pull-ups (your board has them built-in)
> 4. If "PN532 not found" → add 4.7K pull-ups as shown below
> 5. Still not working? → try two 4.7K in parallel (~2.35K) for stronger pull-up
>
> Many generic PN532 boards have onboard pull-ups. Adding more can actually cause problems.

**If you need to add pull-ups**, the 4.7K resistors look like this:
```
    4.7K Resistor Color Code:
    
    +----[////]----+
    |  Y  V  R  G  |
    |  e  i  e  o  |
    |  l  o  d  l  |
    |  l  l     d  |
    |  o  e        |
    |  w  t        |
    +----[////]----+
    
    Yellow = 4
    Violet = 7
    Red = x100
    Gold = ±5%
    
    = 47 × 100 = 4700Ω = 4.7KΩ
```

**On Breadboard:**
```
    Pull-Up Resistor Placement
    
                3.3V rail (use a wire from ESP32 3V3 pin)
    + + + + + + + + + + + + + + + + +
              |           |
           [4.7K]      [4.7K]
              |           |
    - - - - - | - - - - - | - - - - -
              |           |
          SDA wire    SCL wire
          (GPIO21)    (GPIO22)
```

Alternatively, if not using breadboard:
1. Twist one leg of each resistor together
2. Connect twisted legs to 3.3V
3. Connect other leg of R1 to SDA wire
4. Connect other leg of R2 to SCL wire

### Complete Wiring Checklist

| PN532 Pin | → | ESP32 Pin | Wire Color (suggested) |
|-----------|---|-----------|------------------------|
| VCC | → | VIN (5V) | Red |
| GND | → | GND | Black |
| SDA | → | GPIO21 | Blue |
| SCL | → | GPIO22 | Green |
| - | - | - | - |
| 4.7K R1 | between | SDA ↔ 3.3V | - |
| 4.7K R2 | between | SCL ↔ 3.3V | - |

## Test Program

1. Open the project in `firmware/tests/02_nfc_reader` using VS Code.
2. Build and Upload the code to your ESP32.
3. Open Serial Monitor (115200 baud).

## Expected Output

**On Startup:**
```
========================================
PN532 NFC Reader Test
========================================

Found PN532 Firmware: 1.6

SUCCESS: PN532 initialized!

Hold an NFC card near the reader...
========================================
```

**When You Tap a Card:**
```
----------------------------------------
Card detected! UID Length: 7 bytes
UID: 04:A3:2B:1C:7D:00:00
UID (decimal): 4.163.43.28.125.0.0
----------------------------------------
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "PN532 not found" | Wiring error | Double-check SDA/SCL connections |
| "PN532 not found" | DIP switches wrong | Set: 1=OFF, 2=ON |
| "PN532 not found" | Missing pull-ups | Add 4.7K resistors to 3.3V |
| "PN532 not found" | Bad I2C address | Try adding `Wire.begin(21, 22)` before nfc.begin() |
| Card not detected | Card too far | Hold within 2cm of reader |
| Card not detected | Wrong card type | Must be ISO14443A (NTAG215, MIFARE) |
| Intermittent reads | Loose connections | Check all wire connections |
| Garbage in serial | Wrong baud rate | Set to 115200 |

## Checkpoint: NFC Complete

Before proceeding, verify:
- [ ] PN532 found on startup (shows firmware version)
- [ ] NTAG215 card UID is read correctly
- [ ] Multiple cards can be read
- [ ] No "not found" errors after power cycling

> **Write down a card UID for later testing:**  
> Card 1: `__:__:__:__:__:__:__`

---

# 9. Component Testing - Relay Module

## What You'll Achieve

By the end of this section, you will:
- [ ] Wire relay to ESP32 correctly
- [ ] Understand relay trigger modes (HIGH vs LOW)
- [ ] Make relay click on command
- [ ] Verify relay switching with multimeter

## Understanding Relays

A relay is an **electrically controlled switch**. A small current (from ESP32) controls a large current (door lock, lights).

```
    RELAY OPERATION
    
    +------------------+        +------------------+
    | GPIO25 = LOW     |        | GPIO25 = HIGH    |
    |                  |        |                  |
    |   +------+       |        |   +------+       |
    |   |COIL  | OFF   |        |   |COIL  | ON    |
    |   |  O   |       |   -->  |   |  O   |       |
    |   +------+       |        |   +------+       |
    |                  |        |                  |
    |   COM --+        |        |   COM --+        |
    |         |        |        |         |        |
    |   NC ---+        |        |   NC    |        |
    |   NO             |        |   NO ---+        |
    +------------------+        +------------------+
```

**Terminal Behavior:**
| GPIO25 | Relay State | COM-NC | COM-NO |
|--------|-------------|--------|--------|
| LOW | OFF (coil not energized) | Connected | Open |
| HIGH | ON (coil energized) | Open | Connected |

## Check Your Relay Type

Most cheap relays are "**Active LOW**" - they turn ON when the signal is LOW. Check your relay module:

**Active HIGH (less common):**
- IN pin needs HIGH (3.3V) to activate
- LED labeled "Active: HIGH" or no label

**Active LOW (more common):**
- IN pin needs LOW (GND) to activate
- May have "L" or "Low" marking
- Often has a transistor circuit

**How to Check:**
1. Power the relay (VCC to 5V, GND to GND)
2. Touch IN pin to GND briefly
3. If relay clicks, it's **Active LOW**
4. If nothing happens, touch IN to VCC
5. If relay clicks, it's **Active HIGH**

> Most modules from AliExpress are **Active HIGH** (simpler design).

## Wiring Diagram

```
                    RELAY to ESP32 WIRING
                    
    RELAY MODULE                          ESP32
    +------------+                    +-----------+
    |            |                    |           |
    |    VCC     |--------------------| VIN (5V)  |
    |            |                    |           |
    |    GND     |--------------------| GND       |
    |            |                    |           |
    |    IN      |--------------------| GPIO25    |
    |            |                    |           |
    +------------+                    +-----------+
    
    For testing, leave COM/NC/NO disconnected.
    We'll just listen for the click.
```

### Step-by-Step Wiring

**What You Need:**
- ESP32 (from earlier)
- 5V Relay Module
- 3x Female-to-Female Dupont wires

**Connections:**

| Relay Pin | → | ESP32 Pin | Wire Color (suggested) |
|-----------|---|-----------|------------------------|
| VCC | → | VIN (5V) | Red |
| GND | → | GND | Black |
| IN | → | GPIO25 | Yellow or Orange |

## Test Program

1. Open the project in `firmware/tests/03_relay` using VS Code.
2. Build and Upload the code to your ESP32.
3. Open Serial Monitor (115200 baud).

## Expected Results

**What You Should See/Hear:**

1. **Relay LED**: Should toggle on/off every 2 seconds
2. **Click Sound**: Audible mechanical click when switching
3. **Serial Monitor**: "Relay: ON" / "Relay: OFF" alternating

**If Relay is Active LOW**, reverse the logic:
```cpp
digitalWrite(RELAY_PIN, LOW);   // Relay ON
digitalWrite(RELAY_PIN, HIGH);  // Relay OFF
```

## Verify with Multimeter

To confirm the relay is actually switching:

1. Set multimeter to **Continuity mode** (sound wave symbol)
2. Touch probes to **COM** and **NO** terminals
3. When relay is OFF: No beep (no connection)
4. When relay is ON: Beep! (connection made)

```
    TESTING RELAY SWITCHING
    
                 Multimeter
               +-----------+
               |   )))     |  <-- Continuity mode
               +-----------+
                    / \
            Black  /   \ Red
            probe /     \ probe
                 /       \
    RELAY:   [COM]     [NO]
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| No click, no LED | Wrong wiring | Check VCC, GND, IN connections |
| LED on, no click | Faulty relay | Try different relay module |
| Click but not switching | Relay stuck | Replace relay |
| Always clicking rapidly | Code issue | Check your loop timing |
| Relay too hot | Wrong voltage | Verify 5V (not 12V) |

## Checkpoint: Relay Complete

Before proceeding, verify:
- [ ] Relay clicks audibly when GPIO25 goes HIGH
- [ ] Relay LED turns on/off correctly
- [ ] Multimeter confirms COM-NO switching
- [ ] Relay works consistently (no random behavior)

---

# 10. Component Testing - Finger Vein Sensor

## What You'll Achieve

By the end of this section, you will:
- [ ] Wire Finger Vein sensor safely (3.3V!)
- [ ] Communicate via UART
- [ ] Verify sensor is responding
- [ ] Enroll a test finger

## CRITICAL: Voltage Warning

```
+===========================================================================+
|                                                                           |
|   ⚠️ WARNING: FINGER VEIN SENSOR IS 3.3V ONLY! ⚠️                         |
|                                                                           |
|   Connecting 5V will PERMANENTLY DESTROY the sensor!                     |
|                                                                           |
|   Double-check BEFORE connecting power:                                   |
|   - VCC must go to ESP32's 3V3 pin (NOT VIN/5V)                          |
|   - Use a multimeter to verify voltage                                    |
|                                                                           |
+===========================================================================+
```

## Wiring Diagram

```
                FINGER VEIN to ESP32 WIRING
                
    FINGER VEIN                           ESP32
    +-----------+                     +-----------+
    |           |                     |           |
    |   VCC     |---------------------| 3V3       |  <-- NOT 5V!
    |           |                     |           |
    |   GND     |---------------------| GND       |
    |           |                     |           |
    |   TXD     |---------------------| GPIO16    |  (ESP32 RX2)
    |           |                     |           |
    |   RXD     |---------------------| GPIO17    |  (ESP32 TX2)
    |           |                     |           |
    +-----------+                     +-----------+
    
    Note: TX from sensor goes to RX on ESP32 (and vice versa)
    This is called "cross-connection" - it's correct!
```

### Understanding TX/RX

This is the most common source of confusion:

```
    UART COMMUNICATION
    
    Device A                    Device B
    +--------+                  +--------+
    |        |                  |        |
    |   TX   |----------------->|   RX   |
    |        |                  |        |
    |   RX   |<-----------------|   TX   |
    |        |                  |        |
    +--------+                  +--------+
    
    TX (Transmit) sends data
    RX (Receive) receives data
    
    A's TX connects to B's RX
    A's RX connects to B's TX
```

### Step-by-Step Wiring

**What You Need:**
- ESP32 (from earlier)
- Waveshare Finger Vein Sensor
- 4x Female-to-Female Dupont wires

**Connections:**

| Finger Vein Pin | → | ESP32 Pin | Wire Color (suggested) |
|-----------------|---|-----------|------------------------|
| VCC | → | **3V3** (NOT 5V!) | Red |
| GND | → | GND | Black |
| TXD | → | GPIO16 (RX2) | Green |
| RXD | → | GPIO17 (TX2) | Yellow |

**Before Powering On - Verify:**
1. Set multimeter to DC Voltage
2. Touch probes to the VCC wire and GND
3. Power on ESP32
4. Verify reading is ~3.3V (NOT 5V!)

## Test Program

1. Open the project in `firmware/tests/04_finger_vein` using VS Code.
2. Build and Upload the code to your ESP32.
3. Open Serial Monitor (115200 baud).

## Expected Output

**Success:**
```
========================================
Finger Vein Sensor Test
========================================

Testing connection to Finger Vein Sensor...

Sending command: 0x0F

SUCCESS! Sensor responded!

Response (17 bytes):
EF 01 FF FF FF FF 07 00 07 00 00 01 00 00 00 03 0B 

Confirmation Code: 0x00 (Success)

========================================
Finger Vein sensor is working!
========================================
```

**Failure:**
```
ERROR: No response from sensor!

Troubleshooting:
1. Check VCC is connected to 3.3V (NOT 5V!)
2. Check TX/RX are cross-connected correctly
3. Check GND is connected
4. Try power cycling the sensor
5. Look for green LED inside sensor
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| No response | TX/RX swapped | Swap GPIO16 and GPIO17 wires |
| No response | Wrong voltage | Verify 3.3V with multimeter |
| No response | Wrong baud rate | Must be 57600 |
| No response | Loose connection | Reseat all wires |
| Sensor feels hot | Connected to 5V | **STOP! May be damaged** |
| Green LED not on | No power | Check VCC/GND connection |

## Checkpoint: Finger Vein Complete

Before proceeding, verify:
- [ ] Sensor responds to test command
- [ ] Confirmation code is 0x00 (success)
- [ ] Sensor stays cool (not hot)
- [ ] Green LED visible inside sensor

---

# 11. Component Testing - TX510 Face Recognition

## What You'll Achieve

By the end of this section, you will:
- [ ] Understand TX510 power requirements
- [ ] Set up external power via USB-C breakout
- [ ] Wire TX510 to ESP32
- [ ] Verify communication

## Power Requirements

The TX510 is power-hungry:
- **Voltage:** 5V
- **Current:** 500-800mA peak

The ESP32's 3.3V regulator can only supply ~500mA total, and the VIN pin shares this with the ESP32 itself. **We need external power.**

## USB-C Breakout Setup

Your USB-C breakout boards let you tap into a USB power source directly:

```
              USB-C BREAKOUT BOARD
              
    +------+       +------------------+
    | USB  |       |                  |
    | Type |=======| VBUS  GND        |
    |  C   |       |  +     -         |
    +------+       | CC1   CC2        |
                   +------------------+
                          |
    Connect to:    5V    GND
    power source   rail  rail
```

### CC Resistors (Critical!)

USB-C requires **pull-down resistors** on CC1 and CC2 pins to negotiate power:

```
    USB-C POWER NEGOTIATION
    
    Without CC resistors:  USB-C host sees no device → No power!
    With CC resistors:     USB-C host sees device → Power flows!
```

**You need 5.1K resistors, but you have 4.7K. This usually works!**

### Wiring the USB-C Breakout

```
    USB-C BREAKOUT WIRING
    
    VBUS (5V) ────┬──────────────> 5V Power Rail
                  |
    GND ─────────-┬-─────────────> GND Rail
                  |
    CC1 ────[4.7K]┴──> GND
    CC2 ────[4.7K]┴──> GND
```

**Steps:**
1. Solder or connect a wire from **VBUS** to your 5V rail
2. Connect **GND** to your ground rail
3. Connect a 4.7K resistor from **CC1** to **GND**
4. Connect a 4.7K resistor from **CC2** to **GND**
5. Plug a USB-C cable into the breakout, other end to a **phone charger** (5V 2A)

**Verify with Multimeter:**
- Touch probes to 5V rail and GND rail
- Should read ~5.0V

## TX510 Wiring Diagram

```
                TX510 to ESP32 WIRING
                
    USB-C Breakout
    +-------------+
    |    5V       |------------------------+
    |    GND      |-------------------+    |
    +-------------+                   |    |
                                      |    |
    TX510 MODULE                      |    |        ESP32
    +-------------+                   |    |    +-----------+
    |             |                   |    |    |           |
    |   VCC       |-------------------+----+----|  (not used - external power)
    |             |                   |         |           |
    |   GND       |-------------------+---------| GND       |  <-- Must connect!
    |             |                             |           |
    |   TX (pin38)|-----------------------------| GPIO4     |  (ESP32 RX)
    |             |                             |           |
    |   RX (pin39)|-----------------------------| GPIO5     |  (ESP32 TX)
    |             |                             |           |
    +-------------+                             +-----------+
    
    IMPORTANT: GND must be connected between TX510 and ESP32!
               This creates a common reference for the signals.
```

### Step-by-Step Wiring

**What You Need:**
- ESP32 (from earlier)
- TX510 Face Recognition Module (with test kit)
- USB-C Breakout Board
- 2x 4.7K resistors (for CC pins)
- 5+ Dupont wires
- USB-C cable + 5V 2A charger

**Connections:**

| TX510 Pin | → | Connection |
|-----------|---|------------|
| VCC | → | USB-C Breakout VBUS (5V) |
| GND | → | Common GND (also to ESP32 GND) |
| TX (pin 38) | → | ESP32 GPIO4 |
| RX (pin 39) | → | ESP32 GPIO5 |

**ESP32 Connections:**
| ESP32 Pin | → | Connection |
|-----------|---|------------|
| GND | → | Common GND (with TX510) |
| GPIO4 | → | TX510 TX |
| GPIO5 | → | TX510 RX |

> **Note:** The ESP32 is powered via USB from computer (for Serial Monitor).  
> The TX510 is powered via USB-C Breakout from charger.  
> They share a common GND.

## Test Program

1. Open the project in `firmware/tests/05_face_recognition` using VS Code.
2. Build and Upload the code to your ESP32.
3. Open Serial Monitor (115200 baud).

## Expected Results

**Physical Observations:**
- TX510 LCD screen shows boot screen, then main menu
- Infrared LEDs may be visible (faint red glow in dark)

**Serial Monitor:**
- You may see hex data when TX510 boots
- Data appears when faces are detected or buttons pressed
- If nothing appears, check wiring

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| TX510 screen black | No power | Check USB-C breakout, CC resistors |
| TX510 screen on, no serial data | TX/RX wired wrong | Swap GPIO4 and GPIO5 |
| TX510 screen on, no serial data | Wrong UART pins used | TX510 uses pins 38/39 (UART1) |
| ESP32 not working | GND not shared | Connect TX510 GND to ESP32 GND |
| USB-C breakout no power | Missing CC resistors | Add 4.7K or 5.1K to GND |
| Intermittent behavior | Power supply weak | Use 5V 2A (10W) minimum |

## Checkpoint: TX510 Complete

Before proceeding, verify:
- [ ] TX510 screen shows boot screen
- [ ] LCD displays main menu after boot
- [ ] Hex data appears in Serial Monitor when using module
- [ ] Module responds to face detection

---

# 12. Component Testing - LD2410 Radar

## What You'll Achieve

By the end of this section, you will:
- [ ] Wire LD2410C radar to ESP32
- [ ] Verify radar is detecting presence
- [ ] Understand radar output modes

## CRITICAL: 5V Power Required

```
+===========================================================================+
|                                                                           |
|   ⚠️ WARNING: LD2410C REQUIRES 5V POWER! ⚠️                               |
|                                                                           |
|   Connecting 3.3V will NOT work - radar will not function!               |
|                                                                           |
|   VCC must go to ESP32's VIN (5V) or external 5V supply.                 |
|                                                                           |
+===========================================================================+
```

## Wiring Diagram

```
                LD2410C to ESP32 WIRING (Watchman Node)
                
    LD2410C                               ESP32 #2
    +-----------+                     +-----------+
    |           |                     |           |
    |   VCC     |---------------------| VIN (5V)  |
    |           |                     |           |
    |   GND     |---------------------| GND       |
    |           |                     |           |
    |   TX      |---------------------| GPIO16    |  (ESP32 RX2)
    |           |                     |           |
    |   RX      |---------------------| GPIO17    |  (ESP32 TX2)
    |           |                     |           |
    +-----------+                     +-----------+
```

### Step-by-Step Wiring

**What You Need:**
- ESP32 #2 (the second one)
- LD2410C Radar Module
- 4x Female-to-Female Dupont wires

**Connections:**

| LD2410C Pin | → | ESP32 Pin | Wire Color (suggested) |
|-------------|---|-----------|------------------------|
| VCC | → | VIN (5V) | Red |
| GND | → | GND | Black |
| TX | → | GPIO16 (RX2) | Green |
| RX | → | GPIO17 (TX2) | Yellow |

## Test Program

1. Open the project in `firmware/tests/06_radar` using VS Code.
2. Build and Upload the code to your ESP32.
3. Open Serial Monitor (115200 baud).

## Expected Output

**When Room is Empty:**
```
No presence detected
No presence detected
No presence detected
```

**When You Walk Nearby:**
```
PRESENCE DETECTED | Moving: 150cm (85%)
PRESENCE DETECTED | Moving: 120cm (92%)
PRESENCE DETECTED | Stationary: 100cm (75%)
```

**When You Stand Still:**
```
PRESENCE DETECTED | Stationary: 95cm (80%)
PRESENCE DETECTED | Stationary: 95cm (78%)
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "LD2410C not found" | Wrong voltage | Must be 5V (not 3.3V) |
| "LD2410C not found" | TX/RX swapped | Swap GPIO16 and GPIO17 |
| "LD2410C not found" | Wrong baud rate | Must be 256000 |
| Always shows presence | Sensor aimed at wall | Point away from close objects |
| Never detects | Range too far | Move closer (under 5m) |
| Erratic readings | Electrical interference | Move away from motors/power supplies |

## Checkpoint: Radar Complete

Before proceeding, verify:
- [ ] Firmware version is displayed
- [ ] "PRESENCE DETECTED" appears when you walk nearby
- [ ] Distance readings make sense
- [ ] "No presence" appears when room is empty

---

# 13. Integration Testing - Gatekeeper Node

## What You're Building

Now we combine all **Node A** components into one working system:

```
    GATEKEEPER NODE (Node A)
    
    +--------------------------------------------------+
    |                                                  |
    |   ESP32 #1                                       |
    |     +                                            |
    |     +--- PN532 NFC (I2C)                         |
    |     +--- Finger Vein (UART2)                     |
    |     +--- TX510 Face (UART1)                      |
    |     +--- Relay (GPIO25)                          |
    |                                                  |
    +--------------------------------------------------+
```

## Complete Wiring Diagram

```
                        GATEKEEPER COMPLETE WIRING
                        
    USB-C Breakout (5V 2A source)
         |
         +---------> TX510 VCC (5V)
         |
    -----+------------------------------------- GND Rail
         |
    ESP32 #1
    +-------------------+
    | VIN  -------------|-----> PN532 VCC
    |                   |       Relay VCC
    | 3V3  -------------|-----> Finger Vein VCC
    |                   |       Pull-up resistors
    | GND  -------------|-----> All GNDs (common)
    |                   |
    | GPIO21 (SDA) -----|-----> PN532 SDA ---[4.7K]--- 3V3
    | GPIO22 (SCL) -----|-----> PN532 SCL ---[4.7K]--- 3V3
    |                   |
    | GPIO16 (RX2) -----|-----> Finger Vein TX
    | GPIO17 (TX2) -----|-----> Finger Vein RX
    |                   |
    | GPIO4 (RX1)  -----|-----> TX510 TX (pin 38)
    | GPIO5 (TX1)  -----|-----> TX510 RX (pin 39)
    |                   |
    | GPIO25       -----|-----> Relay IN
    +-------------------+
```

## Step-by-Step Integration

### Step 1: Start Fresh

1. Disconnect all components from ESP32
2. Power off everything
3. Clear your workspace

### Step 2: Wire Components One by One

**Order matters!** Add components one at a time, testing after each:

1. **PN532 NFC** (test with NFC_Test sketch)
2. **Relay** (test with Relay_Test sketch)
3. **Finger Vein** (test with Finger_Vein_Test sketch)
4. **TX510 Face** (test with TX510_Test sketch)

### Step 3: Upload Full Gatekeeper Firmware

1. Open the project: `firmware/Gatekeeper/`
2. Build and upload
3. Open Serial Monitor (115200)

**Expected Boot Sequence:**
```
=== Gatekeeper v2.0.0 ===
[BOOT] Face module OK
[BOOT] Vein module OK
[BOOT] NFC OK
[BOOT] ESP-NOW OK
[BOOT] Room: ROOM_001
[BOOT] MAC: 24:6F:28:XX:XX:XX
[BOOT] Ready. Type HELP for commands.
```

### Step 4: Configure WiFi

In Serial Monitor, type:
```
WIFI:YourNetworkName:YourPassword
```

ESP32 will restart and connect:
```
[WIFI] Connecting to YourNetworkName...
[WIFI] Connected! IP: 192.168.1.XXX
```

### Step 5: Test NFC + Relay Flow

1. Tap an NFC card
2. Serial Monitor should show:
```
[NFC] Card: 04A32B1C7D0000
[ACCESS] Denied - Not in whitelist
```

(Denied is expected - no whitelist configured yet)

## Troubleshooting Integration

| Problem | Cause | Solution |
|---------|-------|----------|
| NFC not found at boot | I2C conflict | Check pull-ups, wiring |
| Vein module FAIL | TX/RX conflict | Ensure GPIO16/17 not used elsewhere |
| Face module FAIL | Power issue | Ensure TX510 has external 5V |
| WiFi won't connect | Wrong credentials | Double-check SSID and password |
| Random reboots | Power draw too high | Use separate power for TX510 |

## Checkpoint: Gatekeeper Integration Complete

Before proceeding, verify:
- [ ] All four "[BOOT] ... OK" messages appear
- [ ] NFC reads cards (shows UID)
- [ ] WiFi connects successfully
- [ ] Serial commands work (type HELP)

---

# 14. Integration Testing - Watchman Node

## What You're Building

Node B combines radar and relay for occupancy-based power control:

```
    WATCHMAN NODE (Node B)
    
    +--------------------------------------------------+
    |                                                  |
    |   ESP32 #2                                       |
    |     +                                            |
    |     +--- LD2410C Radar (UART2)                   |
    |     +--- Relay (GPIO26)                          |
    |                                                  |
    +--------------------------------------------------+
```

## Complete Wiring Diagram

```
                        WATCHMAN COMPLETE WIRING
                        
    ESP32 #2
    +-------------------+
    | VIN  -------------|-----> LD2410C VCC (5V)
    |                   |       Relay VCC
    |                   |
    | GND  -------------|-----> All GNDs (common)
    |                   |
    | GPIO16 (RX2) -----|-----> LD2410C TX
    | GPIO17 (TX2) -----|-----> LD2410C RX
    |                   |
    | GPIO26       -----|-----> Relay IN
    +-------------------+
```

## Step-by-Step Integration

### Step 1: Wire Components

1. Connect LD2410C as tested earlier
2. Add Relay (same as before, but to GPIO26)

### Step 2: Upload Watchman Firmware

1. Open the project: `firmware/Watchman/`
2. Change `platformio.ini` to use the correct COM port for ESP32 #2
3. Build and upload
4. Open Serial Monitor (115200)

**Expected Boot Sequence:**
```
=== Watchman v2.0.0 ===
[BOOT] Radar OK
[BOOT] Not paired. Entering beacon mode.
[BOOT] ESP-NOW OK
[BOOT] Room: ROOM_001
[BOOT] MAC: 24:6F:28:YY:YY:YY
[BOOT] Ready. Type HELP for commands.
```

### Step 3: Verify Radar Control

Walk around the room:
- **Presence detected** → Relay should click ON
- **Leave for 15+ minutes** → Relay should click OFF

(The 15-minute timeout can be shortened for testing - modify `GRACE_PERIOD_MS` in config.h)

## Checkpoint: Watchman Integration Complete

Before proceeding, verify:
- [ ] Radar reports presence correctly
- [ ] Relay activates with presence
- [ ] "Beacon mode" message appears (not paired yet)

---

# 15. ESP-NOW Pairing

## What You're Achieving

You'll wirelessly pair Gatekeeper (Node A) and Watchman (Node B):

```
    ESP-NOW PAIRING FLOW
    
    Watchman                                    Gatekeeper
    (Node B)                                    (Node A)
    +--------+                                  +--------+
    |        |    1. Beacon (broadcast)         |        |
    |        | -------------------------------> |        |
    |        |                                  |        |
    |        |    2. Pair Request               |        |
    |        | <------------------------------- |        |
    |        |                                  |        |
    |        |    3. Pair ACK                   |        |
    |        | -------------------------------> |        |
    |        |                                  |        |
    +--------+                                  +--------+
    
    Result: Both nodes know each other's MAC address
            Communication is now encrypted
```

## Pre-Pairing Wireless Test

Before pairing the actual firmware, you can verify that both ESP32 boards can talk to each other wirelessly:

1. Open `firmware/tests/07_espnow_pairing` in VS Code.
2. Upload to **BOTH** ESP32 boards.
3. Open two Serial Monitors (one for each board).
4. Follow the instructions to switch one to SENDER mode and verify the other receives the messages.

---

## Pairing Steps

### Step 1: Ensure Same Room ID

Both nodes must have the same room ID. In Serial Monitor for each:

**On Gatekeeper:**
```
ROOM:ROOM_305
```

**On Watchman:**
```
ROOM:ROOM_305
```

### Step 2: Reset Pairing (if needed)

If previously paired, reset:
```
PAIR:RESET
```

### Step 3: Power Both Nodes

1. Power on Watchman first (it sends beacons)
2. Power on Gatekeeper (it listens for beacons)

### Step 4: Watch for Pairing

**On Watchman Serial Monitor:**
```
[ESPNOW] Beacon sent
[ESPNOW] Beacon sent
[PAIR] Paired with Gatekeeper: 24:6F:28:XX:XX:XX
```

**On Gatekeeper Serial Monitor:**
```
[ESPNOW] Beacon from Watchman: 24:6F:28:YY:YY:YY
[ESPNOW] Pairing confirmed!
```

### Step 5: Verify Pairing Status

On either node:
```
PAIR:STATUS
```

Output:
```
[STATUS] Paired: YES, Room: ROOM_305, Peer: 24:6F:28:XX:XX:XX
```

## Testing ESP-NOW Communication

### Test Wake Signal

When you tap an NFC card on Gatekeeper:

**Gatekeeper:**
```
[ACCESS] GRANTED: STU_001 via NFC+BIO
[ESPNOW] Wake sent
```

**Watchman:**
```
[ESPNOW] Wake signal received
[POWER] Room power: ON
```

## Troubleshooting Pairing

| Problem | Cause | Solution |
|---------|-------|----------|
| No beacons seen | Different room IDs | Set same room ID on both |
| Pairing fails | Out of range | Move nodes closer together |
| Intermittent connection | WiFi interference | Try different WiFi channel |
| "Protocol version mismatch" | Firmware mismatch | Upload same firmware version |

## Checkpoint: ESP-NOW Complete

Before proceeding, verify:
- [ ] Both nodes show "Paired: YES"
- [ ] Wake signal reaches Watchman
- [ ] Heartbeat messages work (check every minute)

---

# 16. Soldering Tutorial

## When to Solder

**Only solder after ALL breadboard tests pass!**

Soldering creates **permanent connections**. If you solder a mistake, you'll need to desolder (difficult) or start over.

## Soldering Safety

```
+===========================================================================+
|                         SOLDERING SAFETY                                   |
+===========================================================================+
|                                                                           |
|   1. NEVER touch the soldering iron tip (400°C = instant burn)            |
|                                                                           |
|   2. Work in VENTILATED area (solder fumes are toxic)                     |
|                                                                           |
|   3. Wear SAFETY GLASSES (solder can splatter)                            |
|                                                                           |
|   4. Use a STAND for the iron (never lay it down)                         |
|                                                                           |
|   5. UNPLUG when not in use                                               |
|                                                                           |
|   6. Keep FLAMMABLES away (paper, plastic)                                |
|                                                                           |
|   7. WASH HANDS after (solder contains lead in some types)                |
|                                                                           |
+===========================================================================+
```

## Your Soldering Iron (80W)

```
                    SOLDERING IRON ANATOMY
                    
                                         TIP (HOT!)
                                         400°C
    HANDLE                SHAFT           |
    +=====================================+=====>
    |                                     |
    | [TEMP DIAL: 250-480°C]              |
    |                                     |
    +=====================================+
    
    Settings for your work:
    - Thin wires: 320°C
    - Dupont headers: 350°C  
    - Thick wires: 380°C
```

## Basic Soldering Technique

### The 4-Step Process

```
    PERFECT SOLDER JOINT
    
    Step 1: HEAT the joint (not the solder)
    
          Iron tip
             |
             v
    =========+=========   <-- Wire
    =========|=========   <-- Pad
             |
          Contact!
          
    Step 2: APPLY solder to the HEATED joint
    
    Solder -->  [~~~]
                  \
          Iron     \
             |      \
             v       v
    =========+=========   <-- Wire
    =========|=========   <-- Pad
             |
    
    Step 3: Let solder FLOW
    
    =========+=========
    =======(●)========   <-- Solder flows and wets the joint
             |
             
    Step 4: REMOVE iron
    
    =========+=========
    =======(●)========   <-- Clean, shiny cone shape
```

### Good vs Bad Joints

```
    GOOD JOINT                    BAD JOINTS
    ==========                    ==========
    
       ___                           ___
      /   \                         (   )     <-- Cold joint (ball)
     /     \     <-- Shiny,         -----        Not enough heat
    =========        concave        
    =========                       ===o===   <-- Insufficient solder
                                               No wetting
    
                                    ======
                                    ==●===    <-- Too much solder
                                    ======       Risk of bridging
```

### Practice First!

Before touching your components, practice on:
1. Scrap wire pieces
2. Old broken electronics
3. The protoboard scraps

## Soldering Dupont Headers

For connections that need to be removable, solder female headers:

```
    HEADER TO PROTOBOARD
    
    1. Insert header into protoboard
    
       [=====]   <-- Female header
       |||||||
       O O O O   <-- Protoboard holes
       
    2. Flip board over
    
       O O O O   <-- Protoboard (component side up)
       |||||||
       [=====]   
       
    3. Solder each pin from underneath
    
       Solder here (back of board)
            v
       =====●=====
            |
          [===]
```

## Desoldering (Fixing Mistakes)

If you make a mistake:

1. **Solder Wick Method:**
   - Place copper braid on the joint
   - Heat with iron
   - Braid absorbs solder
   - Remove braid and iron together

2. **Solder Pump Method:**
   - Heat the joint
   - Place pump nozzle close
   - Press pump button (sucks up solder)

---

# 17. Permanent Assembly

## Planning Your Layout

Before soldering, plan the protoboard layout:

```
    GATEKEEPER PROTOBOARD LAYOUT (7x9cm)
    
    +--------------------------------------------------+
    |                                                  |
    |  [ESP32 MODULE - using female headers]           |
    |  ==========================================      |
    |                                                  |
    |  [4.7K] [4.7K]    <-- Pull-up resistors          |
    |     |      |                                     |
    |  Power Rails                                     |
    |  +5V ========================================    |
    |  +3.3V ======================================    |
    |  GND ========================================    |
    |                                                  |
    |  PN532      Finger     Relay    USB-C            |
    |  Header     Vein       Header   Breakout         |
    |  [====]     [====]     [===]    [====]           |
    |                                                  |
    +--------------------------------------------------+
```

## Assembly Order

1. **Solder power rails first** (5V, 3.3V, GND traces)
2. **Add female headers** for ESP32 (allows removal)
3. **Add component headers** (allows replacement)
4. **Add resistors and small parts**
5. **Test fit everything**
6. **Make connections with wire**

## Wire Management

```
    WIRE MANAGEMENT TIPS
    
    1. Cut wires to LENGTH (not too long)
    
       Bad:  ~~~~~~~~~~~~~~~~~~~~~~~~
       Good: ========
       
    2. Use COLORS consistently
    
       Red = 5V
       Orange = 3.3V
       Black = GND
       Blue = SDA/Data
       Green = SCL/Clock
       Yellow = TX
       White = RX
       
    3. BUNDLE related wires
    
       Use heat shrink tubing to group wires
       
    4. LABEL connections
    
       Use tape flags or marker on heat shrink
```

---

# 18. Enclosure & Mounting

## Waterproof Box (IP65)

Your 158x90x60mm enclosure provides:
- **IP65 rating**: Dust-tight, water-resistant
- **Clear lid**: Visible status LEDs
- **Cable glands**: Weatherproof cable entry

## Drilling for Cable Glands

```
    ENCLOSURE LAYOUT
    
    +--------------------------------------------------+
    |                                                  |
    |   [PROTOBOARD WITH ELECTRONICS]                  |
    |                                                  |
    |   [ESP32]  [PN532]  [RELAY]                      |
    |                                                  |
    +---+---+---+---+---+---+---+---+---+---+---+------+
        ^   ^   ^   ^
        |   |   |   |
       Cable Glands (PG7)
       
    Bottom of enclosure (drill holes here):
    - Power cable
    - Door lock wires
    - NFC antenna (if external)
    - Sensor wires
```

## Mounting Location

**Gatekeeper (Node A):**
- Mount beside door frame at chest height
- NFC reader should be accessible
- Finger slot visible and reachable
- Protected from rain (use overhang if outdoors)

**Watchman (Node B):**
- Mount on ceiling facing into room
- Radar has ~120° detection angle
- Avoid aiming at AC vents (false triggers)

---

# 19. Troubleshooting Encyclopedia

## Power Problems

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| ESP32 won't power on | Bad USB cable | Try different cable |
| ESP32 keeps rebooting | Insufficient current | Use 2A power supply |
| Components work individually but not together | Power overload | Add external power for TX510 |
| Voltage reads low (4.2V instead of 5V) | Cheap power supply | Use quality 5V 2A adapter |
| ESP32 hot to touch | Short circuit | Check for solder bridges |

## Communication Problems

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Module not found" | TX/RX swapped | Swap the two wires |
| Intermittent communication | Loose wire | Reseat connections |
| Works on breadboard, not when soldered | Cold solder joint | Reheat joint, add flux |
| Garbage characters in serial | Wrong baud rate | Check baud rate setting |
| I2C device not detected | Missing pull-ups | Add 4.7K resistors |

## NFC Specific

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "PN532 not found" | DIP switches wrong | Set: 1=OFF, 2=ON for I2C |
| Card not read | Too far away | Within 2cm of antenna |
| Only reads sometimes | Interference | Move away from metal |
| Wrong UID length | Different card type | Use NTAG215/MIFARE ISO14443A |

## Biometric Specific

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Finger vein no response | 5V connected | Must use 3.3V only! |
| Face module silent | No external power | Needs 5V 800mA |
| Enrollment fails | Bad positioning | Follow module prompts |
| Recognition fails | Lighting changed | Re-enroll in new lighting |

## ESP-NOW Specific

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Nodes won't pair | Different room IDs | Set same ROOM: on both |
| Pairing lost after reboot | Not saved to NVS | Check NVS write code |
| Intermittent connection | WiFi interference | Change WiFi channel |
| "HMAC verification failed" | Different secrets | Sync secrets from server |

---

# 20. Quick Reference Cards

## Pin Reference - Gatekeeper (Node A)

```
+===========================================================================+
|                    GATEKEEPER (NODE A) - PIN REFERENCE                     |
+===========================================================================+
|                                                                           |
|  COMPONENT         PIN          ESP32          NOTES                      |
|  -----------       ----         ------         -----                      |
|                                                                           |
|  PN532 NFC         VCC          VIN (5V)       Has 3.3V regulator         |
|                    GND          GND                                       |
|                    SDA          GPIO21         + 4.7K to 3.3V             |
|                    SCL          GPIO22         + 4.7K to 3.3V             |
|                                                                           |
|  FINGER VEIN       VCC          3V3            NOT 5V!                    |
|                    GND          GND                                       |
|                    TX           GPIO16                                    |
|                    RX           GPIO17                                    |
|                                                                           |
|  TX510 FACE        VCC          External 5V    800mA required             |
|                    GND          Common GND                                |
|                    TX(38)       GPIO4                                     |
|                    RX(39)       GPIO5                                     |
|                                                                           |
|  RELAY             VCC          VIN (5V)                                  |
|                    GND          GND                                       |
|                    IN           GPIO25                                    |
|                                                                           |
+===========================================================================+
```

## Pin Reference - Watchman (Node B)

```
+===========================================================================+
|                    WATCHMAN (NODE B) - PIN REFERENCE                       |
+===========================================================================+
|                                                                           |
|  COMPONENT         PIN          ESP32          NOTES                      |
|  -----------       ----         ------         -----                      |
|                                                                           |
|  LD2410 RADAR      VCC          VIN (5V)       NOT 3.3V!                  |
|                    GND          GND                                       |
|                    TX           GPIO16                                    |
|                    RX           GPIO17                                    |
|                                                                           |
|  RELAY             VCC          VIN (5V)                                  |
|                    GND          GND                                       |
|                    IN           GPIO26                                    |
|                                                                           |
+===========================================================================+
```

## Serial Commands Reference

```
+===========================================================================+
|                         SERIAL COMMANDS                                    |
+===========================================================================+
|                                                                           |
|  COMMAND                        DESCRIPTION                               |
|  --------                       -----------                               |
|                                                                           |
|  WIFI:ssid:password             Set WiFi credentials                      |
|  CONVEX:https://...             Set backend URL                           |
|  ROOM:ROOM_305                  Set room ID                               |
|                                                                           |
|  PAIR:STATUS                    Show pairing status                       |
|  PAIR:RESET                     Reset pairing                             |
|                                                                           |
|  ENROLL:FACE:1                  Enroll face as ID 1                       |
|  ENROLL:VEIN:1                  Enroll finger vein as ID 1                |
|                                                                           |
|  MAC                            Show MAC address                          |
|  STATUS                         Show system status                        |
|  HELP                           Show all commands                         |
|                                                                           |
+===========================================================================+
```

## Voltage Reference

```
+===========================================================================+
|                         VOLTAGE REFERENCE                                  |
+===========================================================================+
|                                                                           |
|  COMPONENT              VOLTAGE        CURRENT       NOTES                |
|  ---------              -------        -------       -----                |
|                                                                           |
|  ESP32                  5V (VIN)       500mA max                          |
|  PN532 NFC              5V             150mA         3.3V logic           |
|  Finger Vein            3.3V ONLY      100mA         3.3V logic           |
|  TX510 Face             5V             800mA         3.3V logic           |
|  LD2410 Radar           5V ONLY        100mA         3.3V logic           |
|  Relay Module           5V             70mA          3.3V trigger OK      |
|                                                                           |
+===========================================================================+
```

---

# Appendix A: Helpful Links

## Datasheets
- [ESP32 WROOM-32D Datasheet](https://www.sigmaelectronica.net/wp-content/uploads/2021/11/ESP32-WROOM-32D_pdf.pdf)
- [PN532 Wiring Guide (Adafruit)](https://learn.adafruit.com/adafruit-pn532-rfid-nfc/breakout-wiring)
- [Finger Vein Protocol PDF](https://files.waveshare.com/wiki/Finger_Vein_Scanner_Module_B/Finger_Vein_Module_Communication_Protocol_EN.pdf)
- [HLK-TX510 Info](https://blakadder.com/hlk-tx510/)
- [LD2410 Protocol](http://h.hlktech.com/download/HLK-LD2410C-24G/)

## Video Tutorials
- [Soldering for Beginners](https://www.youtube.com/watch?v=Qps9woUGkvI)
- [How to Use a Multimeter](https://www.youtube.com/watch?v=bF3OyQ3HwfU)
- [ESP32 Getting Started](https://www.youtube.com/watch?v=9b0Txt-yF7E)

## Libraries
- [Adafruit PN532](https://github.com/adafruit/Adafruit-PN532)
- [LD2410 Library](https://github.com/ncmreynolds/ld2410)

---

# Appendix B: Checklist Summary

## Pre-Assembly Checklist

- [ ] Read entire guide once before starting
- [ ] Organize all components in trays
- [ ] Set up workspace with good lighting
- [ ] Install VS Code and PlatformIO
- [ ] Test multimeter with known battery
- [ ] Touch grounded metal to discharge static

## ESP32 First Boot Checklist

- [ ] ESP32 #1 uploads blink test
- [ ] ESP32 #1 MAC address noted
- [ ] ESP32 #2 uploads blink test  
- [ ] ESP32 #2 MAC address noted

## Component Test Checklist

- [ ] PN532 NFC reads cards
- [ ] Relay clicks on command
- [ ] Finger Vein responds to commands
- [ ] TX510 shows on LCD
- [ ] LD2410 detects presence

## Integration Checklist

- [ ] Gatekeeper boots with all components OK
- [ ] Watchman boots with all components OK
- [ ] ESP-NOW pairing successful
- [ ] Wake signal reaches Watchman
- [ ] WiFi connection works

## Final Deployment Checklist

- [ ] All solder joints inspected
- [ ] Enclosure properly sealed
- [ ] Cable glands tightened
- [ ] Power supply adequate
- [ ] Mounting secure
- [ ] Serial commands tested one more time

---

**Congratulations!** If you've completed this guide, you have a working Smart Classroom access control system!

For software setup (backend, mobile app), see the main README.md.

---

*End of Assembly Guide*
