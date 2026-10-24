# Remindly — Technical Architecture & Decision Records

## 1. Core Technology Stack
- **Framework**: Expo SDK 58 (Current stable)
- **Runtime**: React Native 0.88.0 / React 19.3.0
- **Language**: TypeScript 6.0 (Strict mode enabled, zero implicit `any`)
- **Persistence**: `expo-sqlite` (Versioned migrations, foreign key enforcement)
- **Notification Engine**: `expo-notifications` (Channels, action categories; Notifee omitted due to upstream repo deprecation/archive)
- **Local Parsing**: `chrono-node` (Deterministic injected reference instant & timezone)
- **Vector Icons**: `lucide-react-native` (1.75px uniform stroke) + `react-native-svg` 15.11.2

---

## 2. Key Architectural Decisions (ADRs)

### ADR 001: Styling & Token Architecture Choice
- **Decision**: Implemented a strongly-typed TypeScript Theme Engine & Token System (`src/theme/`) utilizing React Native `StyleSheet` rather than NativeWind v4.
- **Verification Date**: October 2026.
- **Rationale**:
  1. React 19.3.0 and React Native 0.88.0 have peer-dependency and JSX transform conflicts with NativeWind v4 (Tailwind v3 architecture).
  2. Typed tokens provide 100% compile-time type safety, zero Babel/PostCSS build overhead, instant hot reloads on Android, and rock-solid dark mode parity without runtime class parsing issues.

### ADR 002: Notification Engine & Notifee Ban
- **Decision**: Use `expo-notifications` exclusively for local Android alarm scheduling and notification channels.
- **Verification Date**: October 2026.
- **Rationale**: The `@notifee/react-native` upstream repository was permanently archived in April 2026. `expo-notifications` is natively integrated, actively maintained in Expo SDK 58, and fully supports Android 8.0+ notification channels (`NotificationChannel`) and Android 13+ `POST_NOTIFICATIONS` runtime permissions.

### ADR 003: 3-Tier Typography Pipeline
- **Font Families**:
  1. `Plus Jakarta Sans` (600/700) via `@expo-google-fonts/plus-jakarta-sans` for editorial display authority and screen headers.
  2. `Inter` (400/500/600) via `@expo-google-fonts/inter` for high x-height readability of task copy on mobile displays.
  3. `JetBrains Mono` (500/600) via `@expo-google-fonts/jetbrains-mono` for tabular numerals, timestamps, and stage offset badges (`-24h`, `-1h`, `Due`).

### ADR 004: Android Share-Target Integration Strategy
- **Intent Filter**: `android.intent.action.SEND` for `text/plain`.
- **Launch Mode**: `singleTask` configured via Expo Config Plugin so warm launches route into the active activity without duplicating instances.
- **Payload Normalization**: Deterministic hash-based `ingestKey` prevents duplicate sheet opens during component remounts or hot reloads.

---

## 3. Data Flow & SQLite Architecture
The domain layer communicates exclusively with strongly typed repository interfaces (`ITaskRepository`). Raw SQL queries are encapsulated inside `src/db/`:

```
Android Sharesheet / User Input
              │
              ▼
   [Share Ingest Service]
              │
              ▼
   [Local NLP Parser] ──(Explicit User Confirmation)──┐
                                                      │
                                                      ▼
                                            [Task Repository]
                                                      │
                                  ┌───────────────────┴───────────────────┐
                                  ▼                                       ▼
                            [SQLite DB]                         [Occurrence Engine]
                     (PRAGMA foreign_keys = ON)                (Skips past occurrences)
                                                                          │
                                                                          ▼
                                                                [Notification Scheduler]
                                                                (expo-notifications)
```

---

## 4. Privacy & Security Boundaries
- **Task data**: Tasks, sources, and occurrences are stored in the app's local SQLite database. The app does not implement cloud task sync or analytics.
- **Identity provider**: Clerk Google sign-in remains in the current implementation. It can send account details to the identity provider and conflicts with the MVP plan's no-login scope. Remove it only after that scope decision is explicitly approved.
- **Storage protection**: SQLite is app-private storage; SQLCipher or another database encryption layer is not configured. Do not describe the database as encrypted by Remindly.
- **Release verification**: TypeScript and Expo Android prebuild checks pass in the latest integration pass. Jest and physical-device/emulator checks have not been rerun in that pass; see `docs/BUILD_LOG.md`.
