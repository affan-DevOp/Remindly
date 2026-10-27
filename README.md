# Remindly

An Android-first reminder app that keeps the context behind each commitment. Capture a task in the app, share text from another app, or use a compact shortcut at the screen edge.

[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-175_passing-brightgreen)](#testing-and-verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## Features

- **Today, Calendar, and Inbox:** schedule reminders, browse selected dates, search tasks, or save an undated commitment for later.
- **Contextual capture:** retain shared text, subjects, senders, and source links when available. Date suggestions from natural-language text can be reviewed before saving.
- **Compact floating shortcut:** a faint 12dp edge tab opens native capture over other apps. Drag it to either side; its side and vertical position are remembered. The full circle appears while dragging, then tucks back into the edge.
- **Task actions:** edit, reschedule, complete, delete, snooze, and undo supported actions. Rescheduling retains the original context; snoozing preserves the original deadline.
- **Local notifications:** reminder profiles, quiet hours, sound/vibration controls, lock-screen privacy, and a test alert. Notification buttons provide **Done** and **Snooze 10 min**; actions open the app so its handler can run after a cold start.
- **Guest and account modes:** use the app without signing in, or authenticate with Google or a verified email code through Clerk. Guest tasks migrate into the account's local collection on sign-in. Switching accounts signs out before starting a new sign-in.
- **On-device storage:** native SQLite stores tasks, source context, settings, profiles, and reminder occurrences. A fallback store supports recovery; the web fallback uses localStorage.

Authentication identifies a local task collection. **There is no cloud task-sync backend**, and signing in on another device does not synchronize reminders. Clerk authentication uses network services; local task storage is separate from authentication.

## Using the app

### Create a reminder

1. Tap **Capture** or the central **+** button.
2. Enter a title and choose a reminder profile.
3. Confirm a date/time, or select **Inbox** to save without a deadline.
4. Tap **Save reminder**. Scheduled items appear under the relevant date; undated items appear in Inbox.

Open a reminder to edit it or use its actions. The date/time tiles reopen capture to reschedule the same reminder.

### Share text into Remindly

1. Select text or open a link in an app that supports sharing text.
2. Choose **Share > Remindly**. Look under **More** if needed.
3. Review the populated title, source context, and any suggested deadline.
4. Choose a date/time or **Inbox**, then save.

For example, share `Submit assignment tomorrow at 2 PM` and confirm the suggested date before saving. Android text sharing uses `ACTION_SEND`; available context depends on what the sending app provides. Image/file attachment import is not implemented.

### Enable Quick Capture Anywhere

1. Open **Settings > Quick Capture Anywhere**.
2. Tap **Grant Access** if required and allow Remindly to **display over other apps** in Android settings.
3. Return to Remindly and enable **Floating capture button**.
4. Open another app and tap the faint edge tab to capture a reminder.

Drag the tab to reposition it. Closing capture returns it to the saved edge position. Use **Stop Service** or turn the switch off to remove it. A persistent Android notification indicates that the capture service is running. Protected system screens may hide overlays.

This feature requires an Android build containing this project's native code. It is unavailable in Expo Go and the web preview.

### Check notifications

Allow Android notification permission, then use the test-reminder button in Settings. Check the phone's Sound mode and notification volume if an alert arrives silently. Android notification settings and device battery restrictions can also affect delivery.

## Reminder profiles

| Profile | Scheduled stages |
| --- | --- |
| Simple | At the deadline |
| Standard | 24 hours before, 1 hour before, and at the deadline |
| Important | 24 hours before, 4 hours before, 15 minutes before, and at the deadline |
| Persistent | Standard stages plus two follow-ups: 15 and 60 minutes after the deadline |

The persistent-follow-ups setting controls those extra follow-ups. Explicit snoozes remain independent. Quiet hours defer eligible advance reminders; deadline alerts are exempt.

## Development setup

### Requirements

- **Node.js 24.3+ within the Node 24 release line** and npm. Node 24 was used for verification; migration tests use its built-in SQLite engine. The installed Expo/React Native versions do not support the previously documented Node 18/20 setup.
- **Android Studio**, its bundled JDK, and the Android SDK/NDK required by the generated project.
- An Android emulator or a physical device with USB debugging enabled and authorized. Confirm it appears as `device` in `adb devices`.
- A configured Clerk instance for independent authentication testing.

### Install and configure

```bash
git clone https://github.com/affan-DevOp/Remindly.git
cd Remindly
npm ci --legacy-peer-deps
```

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell), then replace the placeholder:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Use a **publishable** key, never a Clerk secret key. The source includes a development fallback key for the existing test instance; set your own key for an independent setup. Configure Google OAuth and email-code authentication in that instance as needed. The native callback uses the `remindly` scheme and `oauth-native-callback` path. Keep `.env` out of Git.

Dependency installation runs `scripts/patch-expo-modules.js`. It keeps the targeted notification compatibility shim and preserves normal required/optional native-module detection; fake native-module proxies break font and asset loading.

### Run on Android

```bash
npm run android
```

This generates the Android project when absent, applies the config plugins, builds the native app, and starts the development workflow. Native sharing and floating capture require this build. After changing Kotlin code or native configuration, rebuild the app.

For an already installed debug build, start Metro with `npm start`. USB forwarding can be configured with:

```bash
adb reverse tcp:8081 tcp:8081
```

If Metro binds only to IPv6 on Windows, the verified PowerShell startup was:

```powershell
$env:NODE_OPTIONS='--dns-result-order=ipv4first'
npx expo start --localhost --port 8081
```

A debug build needs Metro. A standalone build bundles JavaScript and assets and runs without it. After generating `android/`, an arm64 standalone test build can be created from that directory with:

```powershell
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. Choose an architecture appropriate to your device. The generated project's current release configuration uses its debug signing key for local testing; configure your own release signing before publishing.

Long Windows/OneDrive paths may exceed CMake/Ninja limits. The tested short-drive build workaround is recorded in the [functional audit](docs/FUNCTIONAL_AUDIT.md#windows-build-notes). Generated Android/iOS projects, APKs, local databases, logs, and device screenshots are not committed.

### Web preview

```bash
npm run web
```

The web preview uses localStorage fallback persistence. Native notifications and floating capture are unavailable. iOS has not been verified on hardware.

## Project structure

| Path | Purpose |
| --- | --- |
| `App.tsx` | Startup, fonts, Clerk, lifecycle refresh, share links, and notification responses |
| `src/components/RemindlyDesignReference.tsx` | Active interface, capture sheets, calendar, task actions, and settings |
| `src/db/` | Native/web database drivers, fallback storage, and schema migrations |
| `src/domain/` | Reminder profiles, date parsing, and occurrence materialization |
| `src/services/` | Task repository, notification scheduling, share normalization, and overlay bridge |
| `src/utils/captureScheduling.ts` | Capture date/time defaults and rollover handling |
| `plugins/with-share-intent.js` | Routes native Android text shares into the app |
| `plugins/with-quick-capture.js` | Registers native capture components and copies Kotlin sources during prebuild |
| `plugins/quick-capture/` | Version-controlled overlay views/service, database helper, and alarm receiver |
| `scripts/patch-expo-modules.js` | Targeted dependency compatibility patch applied after installation |
| `tests/` | Jest regression, component, repository, migration, and scheduling tests |
| `docs/FUNCTIONAL_AUDIT.md` | Repairs, validation evidence, device checks, and remaining limits |

The primary interface is mounted from `RemindlyDesignReference.tsx`; the other standalone screen files are not the app's main navigation implementation.

## Testing and verification

```bash
npm test -- --silent
npm run typecheck
```

Latest verification on **27 October 2026**:

- **175 tests across 17 suites passed**, including actual interface handlers, persistence failures, account switching, date rollover, share ingestion, notification scheduling, and real SQLite foreign-key migration checks.
- TypeScript checks and web export passed.
- Android debug and standalone release APK builds passed for arm64-v8a.
- On a **Vivo V50e running Android 16**, tested capture, editing, completion/Undo, calendar rescheduling, deletion, persistence through restart, sharing, Google sign-in, sound/vibration, and cold-start notification Snooze.
- The compact overlay was separately tested over Chrome: open/close, dragging to both edges, and retaining position when capture closes.

Clerk is mocked in component tests; live Google sign-in was also checked on the phone. Email-code delivery, reboot recovery, permission revocation/regrant, long-running battery restrictions, every sending app's sharing behavior, and all notification actions in every lifecycle state remain unverified on hardware. Automated tests do not establish universal device compatibility.

See the [functional audit](docs/FUNCTIONAL_AUDIT.md) for the detailed findings and limitations.

## License

[MIT](LICENSE).
