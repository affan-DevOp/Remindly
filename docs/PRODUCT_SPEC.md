# Remindly — Product Specification (MVP v1.0)

## 1. Product Identity & Promise
- **Name**: Remindly
- **Package Identifier**: `com.remindly.app`
- **Product Promise**: *"Never lose a follow-up hidden in a message."*
- **Aesthetic Persona**: **Tactile Swiss Utility** (Inspired by Linear Mobile, Things 3, and Due). A calm, high-contrast, scannable precision instrument engineered for one-handed thumb reach on Android.

---

## 2. Target Users & Problem Statement
Busy professionals, founders, and students constantly receive action items buried in unstructured messaging (WhatsApp, Gmail, Slack, Outlook, Chrome). Traditional reminder apps require tedious manual field-by-field entry, leading users to abandon capturing tasks or lose critical follow-ups.

Remindly allows users to share any text or URL from any Android app, automatically extracts smart date/time and title suggestions locally, requires immediate 1-tap confirmation (never inventing silent deadlines), and schedules high-reliability local alarms without sending private data to any remote cloud.

---

## 3. Core MVP Flows
1. **Share-to-Capture Ingestion (<3s)**:
   - User highlights text or URL in WhatsApp/Gmail and taps Android Share.
   - Remindly opens directly into the `CaptureReviewSheet` modal.
   - Raw source text, detected URL, and source app metadata are preserved in `task_sources`.
2. **Local Deterministic NLP & Confirmation UX**:
   - `chrono-node` parses dates relative to device reference time and IANA timezone.
   - Clean title suggestions extracted without date boilerplate.
   - `ConfirmationDateBanner` highlights the matched phrase and requires explicit user confirmation.
   - Ambiguous or dateless captures default to `Inbox` triage queue.
3. **Cascading Reminder Occurrences**:
   - Built-in profiles: `Simple` (0m), `Standard` (-24h, -1h, 0m), `Important` (-24h, -4h, -15m, 0m), and `Persistent` (+15m, +30m, +60m capped repeats).
   - Past stages are skipped automatically without overdue alarm floods.
4. **On-Device Reconciliation & Notifications**:
   - Materialized SQLite occurrences mapped idempotently to Android notification channels (`remindly_standard` and `remindly_urgent`).
   - Interactive notification actions (`Snooze +15m`, `Snooze +1h`, `Complete`).
5. **Core Views**:
   - **Today**: Overdue escalations, next firing occurrence, tasks due today, completed drawer.
   - **Inbox**: Unscheduled or ambiguous captures needing triage.
   - **Upcoming**: Chronologically grouped tasks with filter chips and search.
   - **Settings**: Default profiles, Quiet Hours, date-only default time (09:00), exact-alarm status, local backup export.

---

## 4. Release Scope Boundaries
### Strictly In-Scope (MVP)
- Android-first, local-first architecture.
- React Native 0.88 + TypeScript + Expo SDK 58.
- Local SQLite persistence via `expo-sqlite`.
- OS notification scheduling via `expo-notifications` (Zero Notifee).
- Local NLP date parsing via `chrono-node` (100% on-device).
- Offline data export (JSON).

### Strictly Out-of-Scope (Non-Goals)
- No user accounts, login, or cloud backend.
- No remote LLMs or network telemetry.
- No accessibility services, screen scrapers, or notification listeners.
- No broad contacts, SMS, or file permissions.
- No ads or monetization paywalls.

---

## 5. Anti-AI-Slop Visual Design Rules
1. **Zero Purple/Neon Gradients**: No `#6366F1` or `#8B5CF6` AI gradients. Slate/Alabaster and Obsidian/Zinc only.
2. **Zero Card-in-Card Bloat**: Flat hairline (`1px`) dividers with whitespace hierarchy. Elevated surfaces reserved for bottom sheet and banners.
3. **Zero Emoji Interface Icons**: `lucide-react-native` vector icons exclusively with uniform 1.75px stroke width.
4. **3-Tier Typography**: `Plus Jakarta Sans` for headers, `Inter` for body copy, and `JetBrains Mono` for tabular timestamps.
5. **Ergonomic Touch Targets**: Minimum 48x48dp for all Android touch targets.
