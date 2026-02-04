# Hardware Test Sketches

Standalone PlatformIO projects for testing each component individually.

## How to Use

Each test is a complete PlatformIO project. To use:

1. Copy the folder to a temporary location (or open directly)
2. Open in VS Code with PlatformIO
3. Build and upload
4. Open Serial Monitor (115200 baud)
5. Follow the on-screen instructions

## Test Order (Recommended)

1. **01_esp32_blink** - Verify ESP32 works at all
2. **02_nfc_reader** - Test PN532 NFC module
3. **03_relay** - Test relay switching
4. **04_finger_vein** - Test Waveshare finger vein sensor
5. **05_radar** - Test LD2410C radar
6. **06_espnow** - Test ESP-NOW pairing between two ESP32s

## Notes

- Each test is INDEPENDENT - no dependencies on main firmware
- Tests have verbose output explaining what's happening
- Troubleshooting tips are printed on failure
