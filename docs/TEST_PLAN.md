# Remindly — Test Plan & Quality Assurance Matrix

## 1. Automated Test Levels

### Tier 1: Deterministic Unit Tests (Jest)
- **Domain Logic**: Pure TypeScript functions taking explicit injectable parameters (`now: Date`, `timezone: string`, `settings: AppSettings`).
- **Coverage Targets**:
  - `nlpParser`: 11+ test categories (explicit date+time, date-only default shift, ambiguous multi-date, boilerplate stripping, Unicode).
  - `occurrenceMaterializer`: Profile offset math, past stage skipping, deduplication of identical timestamps.
  - `notificationScheduler`: Quiet Hours deferral, duplicate notification ID prevention, channel assignment.

### Tier 2: Repository Integration Tests (SQLite)
- In-memory SQLite (`expo-sqlite` test harness).
- Verification of:
  - Idempotent migration execution (`PRAGMA user_version`).
  - Foreign key cascading deletes (`ON DELETE CASCADE` from `tasks` to `reminder_occurrences`).
  - Built-in profile seeding idempotency.

### Tier 3: Static Analysis & Type Checking
- `tsc --noEmit` executed on every phase gate with zero warnings/errors.
- `npx expo-doctor` validating package dependencies and Expo SDK compliance.

---

## 2. Physical Android Device & Emulator Test Matrix

| ID | Test Scenario | Trigger / Method | Expected Result |
| :--- | :--- | :--- | :--- |
| **PHY-01** | Cold-Start Share Intent | App killed; share text from WhatsApp | Remindly launches directly into `CaptureReviewSheet` with normalized text. |
| **PHY-02** | Warm-Start Share Intent | App backgrounded; share URL from Chrome | Active task receives new intent (`singleTask`); sheet opens without duplicate activity. |
| **PHY-03** | Notification Action (Foreground) | Tap `Complete` on alert while app is open | Task marked completed; future occurrences cancelled immediately. |
| **PHY-04** | Notification Action (Terminated) | App force-stopped; tap `Snooze +15m` | App mounts directly into quick action sheet; new occurrence scheduled (+15m). |
| **PHY-05** | Exact Alarm Revocation | Revoke `SCHEDULE_EXACT_ALARM` in Android Settings | Settings surfaces warning card with deep link to system settings; app operates on best-effort path without crashing. |
| **PHY-06** | Reboot Persistence | Reboot device with pending reminders | Reminders restored upon boot or next app launch without duplicates. |
