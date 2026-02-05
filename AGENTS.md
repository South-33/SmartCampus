# AGENTS.md - SmartCampus Project Guidelines

## Project Overview
Smart classroom NFC + biometric access control system:
- **Mobile App**: React Native (Expo 54) + Convex backend
- **Firmware**: ESP32 PlatformIO (Gatekeeper door unit, Watchman ceiling sensor)
- **Backend**: Convex (serverless functions, real-time DB, auth)

## Build/Lint/Test Commands

### Mobile App (pnpm required)
```bash
cd mobile
pnpm install              # Install dependencies
pnpm start                # Expo dev server
pnpm android / pnpm ios   # Run on emulator
pnpm convex dev           # Start Convex dev server
pnpm tsc --noEmit         # Type checking
```

### Firmware (PlatformIO)
```bash
cd firmware/Gatekeeper && pio run           # Build
pio run --target upload                     # Upload to ESP32
pio device monitor                          # Serial monitor
cd firmware/tests/02_nfc_reader && pio run  # Run test sketch
```

## Code Style

### TypeScript/React Native

**Imports:** React core > Third-party (expo-*, convex) > Internal > Types

**Naming:** Components `PascalCase.tsx`, hooks `useX.ts`, Convex functions `camelCase`, types `PascalCase`

**Component Pattern:**
```typescript
interface Props { variant?: 'primary' | 'secondary'; children: React.ReactNode; }

export const Component = ({ variant = 'primary', children }: Props) => {
  const [state, setState] = useState(false);  // Hooks first
  const handlePress = () => { /* ... */ };    // Handlers
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({ container: { flex: 1 } });
```

**Formatting:** 2-space indent, single quotes, semicolons, `StyleSheet.create()`

### Convex Backend

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, mustBeAdmin } from "./lib/permissions";

export const myMutation = mutation({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    // ...
  },
});
```

**Permissions (convex/lib/permissions.ts):** `getCurrentUser(ctx)`, `mustBeAdmin(user)`, `mustBeTeacherOrAdmin(user)`, `canAccessRoom(ctx, user, roomId)`, `logActivity(ctx, user, action, desc)`

**Schema:** `v.union()` for enums, `v.optional()` for nullable, add indexes, plural table names

### C++ Firmware

**Naming:** functions `camelCase`, constants `UPPER_SNAKE_CASE`, structs `PascalCase`

**Security:** WiFiClientSecure + TLS, FreeRTOS mutex for shared state, HMAC-SHA256 for ESP-NOW, credentials in NVS (never hardcode)

## Error Handling

```typescript
// Convex - throw descriptive errors
if (!user) throw new Error("Authentication required");
if (user.role !== "admin") throw new Error("Only administrators can perform this action.");

// React Native - user feedback
try { await signIn("password", { email, password }); }
catch { Alert.alert('Login Failed', 'Invalid credentials.'); }
```

## Theme (mobile/src/theme)
```
colors: cobalt (#3B5EE8), ivory (#FAFAF8), charcoal (#1A1A1A), slate (#6B6B6B), success (#2E7D32), error (#C62828)
spacing: xs=8, sm=16, md=22, lg=34, xl=54
fonts: Inter (body), Inter-SemiBold (buttons), PlayfairDisplay (headlines)
```

## Key Patterns

**Real-time Data:**
```typescript
const rooms = useQuery(api.rooms.list, isAuthenticated ? {} : "skip");
const recordAttendance = useMutation(api.attendance.recordAttendance);
```

**Offline Support (useAttendance hook):** Biometric via expo-local-authentication, GPS via expo-location, queue failures in AsyncStorage

**ESP-NOW:** Protocol version check, HMAC-SHA256 auth, sequence numbers for replay protection

## File Structure
```
mobile/
  App.tsx                     # Entry point
  convex/
    schema.ts                 # Database schema
    lib/permissions.ts        # Auth helpers
    http.ts                   # HTTP API for hardware
  src/
    components/               # Reusable UI
    screens/                  # Screen components
    hooks/useAttendance.ts    # Offline-capable attendance
    context/AppContext.tsx    # Global state
    theme/index.ts            # Design tokens

firmware/
  Gatekeeper/src/             # Door controller (NFC + biometric)
  Watchman/src/               # Ceiling sensor (radar presence)
  tests/                      # Individual component test sketches
```

## Hardware Documentation

**For hardware assembly and wiring, see:**
- `ASSEMBLY_GUIDE.md` - Step-by-step build instructions (breadboard first, then solder)
- `hardware.md` - Parts inventory, GPIO maps, pinouts, power architecture

**Hardware Overview:**
```
Gatekeeper (Door)              Watchman (Ceiling)
=================              ==================
ESP32 + PN532 NFC              ESP32 + LD2410 Radar
+ Finger Vein (UART2)          + Relay (lights/AC)
+ TX510 Face (UART1)           
+ Relay (door lock)            Communicates via ESP-NOW
```

**Key GPIOs (Gatekeeper):** I2C 21/22 (NFC), UART2 16/17 (Finger Vein), GPIO 4/5 (TX510), GPIO 25 (Relay)
