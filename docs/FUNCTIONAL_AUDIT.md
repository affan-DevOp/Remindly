# Functional audit — 27 October 2026

Remindly is an Expo/React Native reminder app. `App.tsx` connects the active interface (`src/components/RemindlyDesignReference.tsx`) to local storage, Clerk, incoming shares, and notification scheduling. The other standalone screen files are not the primary interface mounted by the app.

The existing `StyleSheet.create` definitions in the active interface are identical to the starting version. Colors, fonts, cards, gradients, and navigation layout were preserved. The detail sheet now includes the device's bottom safe-area inset so its existing action buttons stay above Vivo's navigation bar. Functional labels changed where needed for verified email sign-in and accurate feedback. Existing date/time tiles now open the existing capture sheet to reschedule a reminder.

## Repairs

- Empty task arrays update correctly, including deleting the last item and switching to an empty account. Sample data no longer replaces an explicitly empty repository or gets recreated after deletion/restart.
- Capture awaits storage before closing or showing success. Failed writes retain the draft and show an error. Completion, editing, deletion, snoozing, and their Undo callbacks also await persistence and handle failures.
- Inbox capture starts without a deadline. Inbox date/time tiles can schedule the same task while preserving its identity, source link, and excerpt.
- Calendar capture uses the selected date, including dates beyond the former 28-day fallback. Today-only filters no longer filter the inbox. Closing search clears its hidden filter.
- Future-time defaults handle hour/midnight rollover. Relative presets and minute-step buttons carry into the correct hour/date. Saving rechecks the actual deadline, including custom selections of today.
- Repeated shares reopen capture with fresh content. Ordinary captures clear the previous share. Sender, subject, suggested title, and source URL survive saving. Unambiguous incoming natural-language deadlines populate the active sheet; ambiguous dates stay in the inbox until confirmed.
- The default date-only time cycles correctly and is used for future-day capture. Failed settings writes restore the previous switch state.
- Snooze uses a separate occurrence and preserves the original canonical deadline. Inbox snooze schedules the item. Undo completion preserves the original inbox/scheduled state.
- Sound, vibration, and privacy preferences update already scheduled notifications. Android triggers select the correct channel, including separate silent/no-vibration channels. Disabling persistent follow-ups leaves explicit snoozes enabled. Scheduling is serialized, test alerts survive reconciliation, and daytime quiet hours defer to the same afternoon.
- Loading settings no longer mutates shared guest defaults or earlier settings snapshots. Returning accounts receive newly captured guest tasks even when the account already has tasks. Logout returns to guest mode without forcing onboarding.
- Cancelled/failed Google OAuth no longer creates a hard-coded account. Email sign-in now requests and verifies a Clerk email code before activating a session. The former test-account row continues as a guest. No live accounts were created during testing.
- Fallback storage includes reminder occurrences, rolls back failed transactions, and persists the web fallback to localStorage. The web build no longer imports the unused Expo SQLite WASM worker.
- Floating capture controls now call the native service and permission handlers. Unsupported builds report that limitation. Returning to the app refreshes tasks captured outside it.
- Native floating capture opens Expo's actual database location, saves tasks for the active local account, uses valid task statuses/profile-stage references, and schedules the selected profile's occurrences. Native alarms respect notification/quiet-hour preferences and check database ownership/status before firing, preventing obsolete alerts after completion, deletion, or JS rescheduling. Notification taps deep-link to task details.
- Native overlay sources are retained under `plugins/quick-capture` and copied by the config plugin during prebuild; they no longer depend on an ignored generated Android directory.
- Removed the postinstall script's fake native-module proxies. They made a standalone Android app incorrectly detect Expo Go, breaking asset/font loading and leaving the launch spinner indefinitely. Missing required modules now throw normally, optional modules return null, and actual modules are preserved. Font failures also expose a retry action.
- Fixed real SQLite initialization: built-in parent profiles are seeded before stages, and profile upgrades disable/update stages rather than deleting rows referenced by existing reminder occurrences. Tests now exercise SQLite's actual foreign-key constraints.
- Updated `react-native-svg` to Expo 58's bundled version, 15.16.0, resolving the full Android native build failure.
- Android notification channels use the system default sound without requesting a nonexistent custom asset named `default`. Done/Snooze notification actions start the app's response handler, including when no JavaScript process is running.
- Switch Account now awaits sign-out before opening another authentication attempt, preventing the Google error observed with an existing active session. A failed sign-out retains the account sheet and reports the failure.

## Verification

- `npm run typecheck`: passed.
- `npm test -- --silent`: 175 tests across 17 suites passed, including real SQLite migration tests, cold-start notification-action configuration, the font-loading failure's root cause, and account-switch ordering/sign-out failure.
- Component tests render the actual active interface and invoke capture, calendar, task-action, settings, guest, logout, and mocked Clerk handlers. They cover successful and failed persistence, Undo, repeat shares, date suggestions, default-time selection, and rollover.
- `npx expo export --platform web --output-dir dist-audit`: passed. Temporary export output was removed after verification.
- Android `:app:compileDebugKotlin` and full `:app:assembleDebug` for arm64-v8a: passed, including the native overlay sources. The resulting APK was installed and exercised on the connected phone.
- Android `:app:assembleRelease` for arm64-v8a: passed. Standalone test APK: `android/app/build/outputs/apk/release/app-release.apk` (bundled JavaScript/assets, signed with the project's existing debug key for local testing). Installed the final account-switch fix as an in-place update, preserving app data and the authenticated Google account. App launch and account-sheet navigation passed with Metro stopped. Removed the temporary build drive mapping afterward.
- `git diff --check`: passed. Active-screen style definitions were compared against the starting Git version and were unchanged.

## Physical device verification

Connected Vivo V50e (Android 16, arm64-v8a):

- App launches with its actual bundled fonts and uses `files/SQLite/remindly.db`; the native database has zero foreign-key violations.
- Created an inbox reminder through the main capture sheet. Confirmed null deadline fields in SQLite.
- Granted overlay permission, started the foreground service, opened floating capture over Chrome, typed with the real keyboard, and saved to Inbox. The task appeared in the main app's shared native database. Stopped the service after testing.
- Completed and restored the captured task with Undo, edited its title, and confirmed that the edited title and inbox state survived a cold restart.
- Rescheduled that same task for tomorrow at 09:00. Verified the saved UTC/local deadline, calendar entry on the selected date, and preservation of original context.
- Sent a native Android `ACTION_SEND` text/subject payload to the running app. The existing capture sheet opened with the shared subject as its title. Cancelled this draft without saving.
- Scheduled a near-term deadline, put the app in the background, and killed its background process with `am kill` (not Android force-stop). The OS delivered the scheduled alert. Tapping Snooze 10 min launched the app from a cold start and registered a new scheduled occurrence while preserving the canonical deadline.
- Delivered the Settings test notification. The user initially reported silence; Android reported notification audio muted. After the user switched to Sound mode, they confirmed sound/vibration worked.
- Tested real Google authentication in the standalone build with the user handling Google's prompts. An attempt from an already connected account showed the generic sign-in error; after signing out through the app, Google sign-in succeeded. The Google-connected account persisted through a cold restart. The account-switch handler was then fixed to perform that sign-out step automatically.
- Deleted both `REMINDLY_AUDIT_*` reminders through their confirmation dialogs. Confirmed no audit tasks remain, their alarms are cancelled, and the original six seeded tasks remain.

Reboot recovery, permission revocation/regrant, long-running battery restrictions, every source app's share integration, and every notification action under all lifecycle states remain unverified on hardware. The browser tool stopped because it could not reliably determine Chrome's current URL; a complete visual browser click-through was not completed. Automated component tests cover additional buttons and failure paths but do not certify every real-device scenario.

## Windows build notes

This long OneDrive workspace path exceeded native CMake/Ninja path limits. The successful local build used a temporary `subst R:` mapping to the repository plus a temporary Gradle init script. Its `com.android.application` callback set `android.externalNativeBuild.cmake.buildStagingDirectory` to `new File('R:/android/.device-cxx')` and called `android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_OBJECT_PATH_MAX=240'`. The Gradle task used `-PreactNativeArchitectures=arm64-v8a --init-script <temporary-script>`. This workaround changes build staging only; it is not an app runtime change. Use a free drive letter when repeating it.

For USB debug builds on this machine, Expo needed `NODE_OPTIONS=--dns-result-order=ipv4first`, `expo start --localhost --port 8081`, and `adb reverse tcp:8081 tcp:8081` so the phone could reach Metro over IPv4.

## Live-service and platform limits

Clerk is mocked in component tests, and real Google sign-in was separately tested on the phone. Email-code delivery and new-account requirements remain unverified. Email-code authentication must be enabled for the configured instance; see [Clerk authentication strategy settings](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options). No Clerk configuration was changed.

The app remains local-first: authenticating identifies a local task collection; there is no cloud task synchronization backend in this project. Web native-notification and floating-overlay support remain platform limitations, and the web test-notification method now returns failure instead of claiming delivery.

## Compact overlay follow-up

At the user's request, compared Remindly with Vivo Easy Touch on the connected phone. Replaced the always-visible 52dp circle with a faint 12dp-wide edge tab. Tapping opens the existing native capture form directly. Dragging temporarily reveals the existing circle, then docks the tab to the nearest edge. Side and vertical position are persisted and clamped within the screen. The main app and capture-form design are unchanged.

Built and installed the standalone Android update. Verified over Chrome: initial right-edge tab, tap to open capture, Cancel to tuck away, drag to the left edge, open/close while retaining the left position, and drag back to the right. WindowManager confirmed a 33×143px idle window on this phone, compared with the previous 143×143px bubble. No reminder records were created or removed during these checks. Left the compact shortcut enabled.
