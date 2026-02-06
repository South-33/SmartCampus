# Android Dev Build (Expo Dev Client)

This is the simplest way to enable NFC + biometrics on Android (Expo Go cannot load native NFC modules).

## Cost
- Free to install and use on a personal Android device.
- EAS has a free tier; this uses the free workflow unless you exceed their limits.

## Prereqs
- Android phone with NFC hardware
- NFC toggled ON in Android settings
- Expo account (free) for EAS builds

## One-time setup
1) Install dev client dependency
   ```bash
   pnpm expo install expo-dev-client
   ```

2) Login + configure EAS
   ```bash
   pnpm dlx eas-cli login
   pnpm dlx eas-cli build:configure
   ```

## Build APK (cloud)
```bash
pnpm dlx eas-cli build --platform android --profile development
```

EAS will output a download link.

## Install APK on phone
- Open the link on the phone and install
- If prompted, allow "Install unknown apps" for the browser

## Run the app (dev client)
```bash
pnpm start -- --dev-client
```
Open the Dev Client app on the phone and scan the QR.

## NFC notes
- Expo Go: NFC will not work
- Dev Client: NFC works if the device supports NFC and it is enabled

## Common issues
- Phone cannot connect to Metro: ensure phone + PC are on same Wi-Fi
- Stale bundle: clear cache
  ```bash
  pnpm start -- --clear
  ```
