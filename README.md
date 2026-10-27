# Remindly

> **Android-First, Local-First Contextual Reminder Assistant**  
> *"Never lose a follow-up hidden in a message."*

[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020.svg?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.76+-61DAFB.svg?logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-Local_First-003B57.svg?logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Tests](https://img.shields.io/badge/Tests-133_Passing-brightgreen.svg)](#testing--verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

**Remindly** is an Android-first mobile reminder application engineered with **React Native**, **Expo SDK 58**, and **TypeScript**. 

Unlike conventional reminder applications that treat task entry as an empty input box disconnected from context, Remindly connects directly into the mobile workflow:
- **Share directly from any app** (WhatsApp, Outlook, Gmail, Slack, Telegram, Chrome, Notion, etc.) via Android's native `ACTION_SEND` intent.
- **On-screen Quick Capture Overlay**: capture and schedule commitments without leaving your active chat or browser.
- **Local-first SQLite architecture**: your data stays on your device with high-speed indexing, zero tracking, and offline reliability.
- **Clerk Google & Direct Email Authentication**: multi-user isolation with automatic guest task migration—your reminders are never wiped when logging in.

---

## Key Highlights & Features

### 1. Tactile Swiss-Utility Design Aesthetic
- **Atmospheric Visuals**: Smoked charcoal & obsidian canvas (`#16130F`), diffuse radial lighting, and glassmorphic sheets powered by `expo-blur` (`dimezisBlurViewSdk31Plus` on Android).
- **High-Contrast Input Fields**: Luminous input borders (`rgba(224,243,74,0.35)`) and clear typography (`#F8F5ED`) ensuring field visibility in dark mode.
- **Organic Earth-Tone Timeline**: Floating reminder cards dynamically alternate botanical tree hues:
  - 🌱 **Lime Sprout** (`#DDF24B`)
  - 🍃 **Sage Leaf** (`#DCE7D8`)
  - 🪵 **Amber Timber** (`#F0E7D6`)
- **Strict Month Bounding**: Timeline days scroller is strictly bounded to the current viewed month. No dates from adjacent months bleed into the strip.
- **Past-Date Protection**: Interactive scheduling guards prevent setting reminders in the past while providing friendly feedback.

### 2. Multi-User Isolation & Seamless Authentication
- **Local-First Guest Mode**: Start using the app immediately without signing in.
- **Google OAuth (Clerk)**: Dedicated `SignInSheet` with seamless Expo web browser integration.
- **Direct Custom Account / Email Sign-In**: Enter your name and email to create an authenticated profile instantly.
- **Zero-Loss Data Migration**: On sign-in, existing guest reminders automatically migrate to your user account (`UPDATE tasks SET user_id = ?`).
- **Non-Disruptive Logout**: Signing out switches back to guest mode inside the app without locking you into an onboarding tour.

### 3. Local-First SQLite Persistence with Safe Mode
- **Versioned SQLite Schema**: Versioned migrations managing `tasks`, `task_sources`, `reminder_profiles`, `profile_stages`, `reminder_occurrences`, and `app_settings`.
- **Defensive Multi-Tier Storage**:
  - `openDatabaseAsync` (Primary native driver)
  - `openDatabaseSync` (Fallback synchronous driver)
  - Legacy `omniremind.db` database migration
  - Memory persistence with `expo-secure-store` backing
  - **Safe Mode recovery screen** in case of catastrophic storage lockouts.

### 4. Smart Source Auto-Detection
Intelligently classifies incoming share payloads and typed text from across the Android ecosystem:
- **WhatsApp**: detects message timestamps (`[12:45, 10/24/2026]`), forwarded headers, and chat links.
- **Outlook**: detects `com.microsoft.office.outlook`, `@outlook.com`, `@live.com`, and Microsoft Teams.
- **Gmail**: detects `com.google.android.gm`, `From:`, `Subject:`, and Google Mail headers.
- **Slack**: detects `slack.com/archives`, `#general`, `@channel`, and `@here`.
- **Telegram**: detects `t.me` links and `org.telegram.messenger`.
- **Web**: detects browser callers (Chrome, Firefox, Edge) and standalone URLs.
- **Notes**: detects markdown lists, checkboxes, and memo headers.

### 5. Advanced Android Notification Engine
- **Dual Notification Channels**:
  - `remindly_standard` (Heads-up alerts: `-24h`, `-1h`)
  - `remindly_urgent` (Deadline & Follow-ups: `-15m`, `Due (0m)`, high-priority vibration pulse)
- **Quiet Hours Scheduling**: Automatically defers heads-up notifications during configured rest periods (e.g., 22:00 -> 08:00) while ensuring critical deadlines fire on time.
- **Interactive Action Handling**: Action buttons (`Done`, `Snooze +15m`, `Snooze +1h`) dismiss the notification and update SQLite status without closing or resetting the app.
- **Fast Test Reminder**: 2-second armed test alert in Settings for rapid hardware verification.
- **Clean Notification Dot**: Top bar inbox indicator dot is strictly conditioned on pending inbox tasks (`tasks.some(t => t.status === 'inbox')`) and remains hidden when empty.

---

## 4 Built-In Reminder Profiles

| Profile | Description | Stages |
| :--- | :--- | :--- |
| **Simple** | Minimal reminder for casual to-dos. | Due (`0m`) |
| **Standard** | Balanced alerts for daily work commitments. | `-24h`, `-1h`, Due (`0m`) |
| **Important** | High-visibility escalations for strict deadlines. | `-24h`, `-4h`, `-15m`, Due (`0m`) |
| **Persistent** | Repeated nudges for commitments you cannot afford to miss. | Standard + `+15m`, `+30m`, `+60m` follow-ups |

---

## Architecture

```
Remindly/
├── App.tsx                                  # App entry point, Clerk auth provider & notification listener
├── app.json                                 # Expo configuration, Android intentFilters & permissions
├── plugins/
│   ├── with-quick-capture.js                # Config plugin for native overlay window service
│   └── with-share-intent.js                 # Config plugin for Android ACTION_SEND intent filter
├── src/
│   ├── components/
│   │   ├── RemindlyDesignReference.tsx      # Main application interface, timeline, quick capture & modals
│   │   ├── popups/                          # Accessible dialogs, selectors, snackbars & explainers
│   │   └── ...                              # Visual cards, temporal chips & navigation dock
│   ├── config/
│   │   └── clerk.ts                         # Clerk configuration and token cache
│   ├── db/
│   │   ├── sqliteDatabase.ts                # Multi-tier SQLite persistence & memory fallback
│   │   └── migrations.ts                    # Schema v1-v3 migrations with multi-user isolation
│   ├── domain/
│   │   ├── nlpParser.ts                     # Chrono-node deterministic date/time parser
│   │   ├── occurrenceMaterializer.ts        # Dynamic occurrence generation engine
│   │   └── types.ts                         # Strongly typed domain records
│   ├── services/
│   │   ├── notificationService.ts           # Android notification channels & quiet hours scheduler
│   │   ├── quickCaptureOverlayService.ts    # Cross-app overlay management
│   │   ├── shareIngestService.ts            # ACTION_SEND normalizer & 15s deduplicator
│   │   └── taskRepository.ts                # SQLite CRUD, user migration & backup export
│   └── types/
│       └── task.ts                          # App state & user profile interfaces
└── tests/                                   # 13 comprehensive Jest test suites (133 tests)
```

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or newer (tested on Node 20 & 24)
- **Full test suite**: use Node 24; the native database migration tests use its built-in SQLite engine to enforce real foreign-key constraints.
- **npm** or **yarn**
- **Android Device or Emulator** (API 26+) / **Expo Go**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/affan-DevOp/Remindly.git
   cd Remindly
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables (Optional)**:
   ```bash
   cp .env.example .env
   ```
   *(A public Clerk test key is provided by default for testing out of the box).*

4. **Start the development server**:
   ```bash
   npm start
   ```

---

## Testing & Verification

Remindly includes a complete test harness with 13 comprehensive test suites covering database migrations, multi-user isolation, NLP date extraction, notification scheduling, and share ingestion:

```bash
# Run unit & integration test suites
npm test

# Run TypeScript strict typecheck
npm run typecheck
```

**Test Suite Breakdown (133 / 133 Passing)**:
- `tests/login_and_features_checkup.test.ts`: User login, guest task migration, non-disruptive logout, and ecosystem source detection.
- `tests/phase1.test.ts`: Component baseline & temporal chips.
- `tests/phase2_repository.test.ts`: SQLite migrations, occurrence materialization & profile stages.
- `tests/phase3_notifications.test.ts`: Android channels, quiet hours & idempotency.
- `tests/phase3_final_notifications.test.ts`: Budget cap & multi-stage notification dispatch.
- `tests/phase4_share.test.ts`: `ACTION_SEND` normalization & URL extraction.
- `tests/phase5_nlp.test.ts`: Deterministic NLP parsing across 11+ natural language date formats.
- `tests/phase6_lifecycle.test.ts`: Full task lifecycle (create, schedule, snooze, complete, undo).
- `tests/phase7_stress_and_privacy.test.ts`: 50-task load test & zero-exfiltration privacy audit.
- `tests/phase8_popup_system.test.ts`: Accessible dialogs & contextual sheets.
- `tests/phase9_quick_capture_anywhere.test.ts`: Native Android floating overlay integration.
- `tests/services.test.ts` & `tests/baseline.test.ts`: Service singletons & token contracts.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
