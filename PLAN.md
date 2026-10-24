REMINDLY — ANTIGRAVITY IMPLEMENTATION PLAYBOOK (v2.0 UPGRADED)

Android-first, local-first, source-aware reminder assistant

Version: 2.0 (With Anti-AI-Slop UI Design System, Typography Tokens & MCP Server Config)

Prepared: 24 October 2026



PURPOSE

This document contains the complete, production-hardened Master Project Instruction, MCP Server & UI Reference configuration, Anti-AI-Slop Design System specification, and Phase 0 through Phase 7 implementation prompts for Google Antigravity. Use the prompts one phase at a time to build a working, store-ready Android MVP.



IMPORTANT: Do not paste all phase prompts as one enormous implementation request.

1. Configure the recommended UI MCP servers in Antigravity first (see Section 1 below).

2. Paste the MASTER PROJECT INSTRUCTION once at the start of the Antigravity project.

3. Paste Phase 0, review the results against the Post-Phase Review Checklist, and only then proceed to Phase 1, Phase 2, and so on.



======================================================================

1. ANTIGRAVITY UI MCP SERVERS & DESIGN REFERENCE LINKS

======================================================================



To prevent Antigravity from generating generic "AI slop" UI, configure these Model Context Protocol (MCP) servers in your Antigravity MCP settings (mcp_config.json) and pass the reference URLs below during Phase 0 and Phase 1:



A. RECOMMENDED MCP SERVERS FOR UI & COMPONENT GENERATION



1. shadcn/ui + React Native Reusables MCP Server

   - Purpose: Lets Antigravity browse, search, and install accessible React Native + NativeWind primitives (buttons, bottom-sheet dialogs, badges, switches, segmented controls) instead of inventing unstyled custom widgets.

   - Docs: https://ui.shadcn.com/docs/mcp

   - React Native Registry: https://reactnativereusables.com/docs

   - GitHub: https://github.com/founded-labs/react-native-reusables

   - Command config: npx -y shadcn@latest mcp (or use react-native-reusables CLI: npx @react-native-reusables/cli@latest init)



2. 21st.dev Magic UI MCP Server (@21st-dev/magic-mcp)

   - Purpose: Gives Antigravity access to 12,000+ design-engineer-crafted UI component patterns, micro-interactions, and clean layout compositions.

   - Docs: https://21st.dev/mcp

   - GitHub: https://github.com/21st-dev/magic-mcp

   - Command config: npx -y @21st-dev/magic-mcp



3. Official Figma MCP Server / Figma-Context-MCP

   - Purpose: Allows Antigravity to inspect real mobile screen layouts, auto-layout spacing tokens, typography scales, and color variables directly from Figma frames (for example, screens curated from Mobbin).

   - Official Docs: https://developers.figma.com/docs/figma-mcp-server/

   - Community MCP: https://github.com/glips/figma-context-mcp

   - Command config: npx -y figma-developer-mcp --figma-api-key=YOUR_KEY



B. PREMIUM MOBILE UI & COMPONENT REFERENCE LINKS FOR ANTIGRAVITY



Instruct Antigravity to consult and align with these documentation sources during Phase 1:

- Mobile Screen Pattern Inspiration (Bottom Sheets, Inbox Triage, Timeline Lists):

  https://mobbin.com/explore/mobile/ui-elements/bottom-sheet

  https://mobbin.com/explore/mobile/screens/filter-sort

- React Native Reusables (Copy-paste NativeWind UI primitives):

  https://reactnativereusables.com/docs

- NativeWind v4 (Tailwind CSS styling engine for Expo / React Native):

  https://www.nativewind.dev/docs/getting-started/installation

- Gorhom React Native Bottom Sheet v5 (Gesture-driven capture & edit sheets):

  https://gorhom.github.io/react-native-bottom-sheet/

- Lucide React Native Icons (Crisp 1.75px stroke vector icons):

  https://lucide.dev/guide/react-native/

- Expo Custom Fonts & Google Fonts (@expo-google-fonts):

  https://docs.expo.dev/develop/user-interface/fonts/

  https://github.com/expo/google-fonts



======================================================================

2. ANTI-AI-SLOP VISUAL DESIGN SYSTEM & TYPOGRAPHY SPECIFICATION

======================================================================



Aesthetic Persona: "Tactile Swiss Utility" (Inspired by Linear Mobile, Things 3, and Due).

The UI must feel like a precision timekeeping instrument—calm, high-contrast, scannable in 1 second, and engineered for one-handed thumb reach on Android.



A. STRICT ANTI-AI-SLOP RULES (MANDATORY)

1. NO Purple/Indigo/Neon Gradients: Never use linear-gradient backgrounds, glowing neon buttons, or generic AI purple (#6366F1 / #8B5CF6) palettes.

2. NO Card-Inside-Card Bloated Nesting: Do not wrap every single piece of metadata in a heavy bordered box with large drop shadows. Use flat list rows separated by 1px subtle hairline dividers, reserving elevated surfaces strictly for the Capture Bottom Sheet, primary summary banners, and floating action triggers.

3. NO Emoji Interface Icons: Never use emojis (like bell, calendar, checkmark, or fire emojis) as UI icons, status indicators, or empty-state illustrations. Use `lucide-react-native` vector icons exclusively with a uniform 1.75px stroke width.

4. NO Unstyled System Font Monotony: Never rely on a single default system font weight across titles, timestamps, and metadata. Enforce the 3-font typographic system below.

5. NO Jarring Full-Screen Form Modals for Quick Capture: Use a smooth, keyboard-aware bottom sheet (`@gorhom/bottom-sheet` or native modal sheet) so sharing from WhatsApp or Gmail feels like an instant overlay.



B. 3-TIER TYPOGRAPHY SYSTEM (VIA EXPO-FONT & @EXPO-GOOGLE-FONTS)

Install and load three distinct font families via `expo-font`:

1. Display & Screen Headers (`Plus Jakarta Sans` — `@expo-google-fonts/plus-jakarta-sans`):

   - Weights: 600 (SemiBold) and 700 (Bold)

   - Usage: Screen titles ("Today", "Inbox", "Upcoming"), bottom-sheet headers, and section group headers.

   - Style: Tight letter-spacing (-0.3px to -0.5px) for modern editorial authority.

2. Primary UI & Task Copy (`Inter` — `@expo-google-fonts/inter`):

   - Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)

   - Usage: Task titles, captured source message excerpts, action buttons, and settings labels.

   - Style: High x-height and open apertures for effortless reading on narrow Android screens.

3. Temporal & Metadata Monospace (`JetBrains Mono` — `@expo-google-fonts/jetbrains-mono`):

   - Weights: 500 (Medium) and 600 (SemiBold)

   - Usage: All due times ("14:30", "TOMORROW 09:00"), reminder offset chips ("-24h", "-1h", "DUE"), countdown badges ("in 42m"), and timezone tags ("IST / UTC+5:30").

   - Style: Tabular numerals so timestamps and stage offsets align vertically like a precision chronograph.



C. SEMANTIC COLOR PALETTE TOKENS (LIGHT & DARK MODE)

Light Mode ("Warm Alabaster & Deep Slate"):

- Background Primary (`bg-canvas`): #F8FAFC (Cool Alabaster, never harsh #FFFFFF everywhere)

- Surface Elevated / Sheet (`bg-surface`): #FFFFFF

- Surface Subtle / Chip (`bg-muted`): #F1F5F9

- Border Hairline (`border-subtle`): #E2E8F0

- Text Primary (`text-primary`): #0F172A (Deep Slate Ink)

- Text Secondary (`text-secondary`): #475569

- Text Muted (`text-muted`): #94A3B8

- Primary Accent (`accent-primary`): #0F172A (Obsidian Slate for primary CTAs) with #0284C7 (Precision Cerulean) for active selection states and focus rings

- Semantic Status:

  - Overdue / Critical: Text #B91C1C, Surface Pill #FEF2F2, Border #FECACA

  - Due Soon / Warning: Text #B45309, Surface Pill #FFFBEB, Border #FDE68A

  - Scheduled / Safe: Text #0369A1, Surface Pill #F0F9FF, Border #BAE6FD

  - Completed / Nominal: Text #15803D, Surface Pill #F0FDF4, Border #BBF7D0



Dark Mode ("Carbon Obsidian & Crisp Zinc"):

- Background Primary (`bg-canvas`): #090D16

- Surface Elevated / Sheet (`bg-surface`): #111827

- Surface Subtle / Chip (`bg-muted`): #1E293B

- Border Hairline (`border-subtle`): #1F2937

- Text Primary (`text-primary`): #F8FAFC

- Text Secondary (`text-secondary`): #94A3B8

- Primary Accent (`accent-primary`): #38BDF8 (Luminous Sky Blue)



D. SIGNATURE UI COMPONENTS TO BUILD IN PHASE 1

1. `TemporalChip` (`JetBrains Mono`): Compact pill displaying stage offsets (`-24h`, `-1h`, `0m`) or due timestamps with subtle 1px border and semantic status tint.

2. `SourceProvenanceCard`: Clean, left-accented quotation block showing the source app badge (e.g., WhatsApp, Gmail, Chrome), sender/subject if present, raw message excerpt (2-line clamp with tap-to-expand), and a conditional `Open Link` or `Copy Excerpt` action button.

3. `CascadeTimelinePreview`: Horizontal connected node bar inside the Capture Sheet and Task Detail screen showing the exact firing times of the selected Reminder Profile (e.g., `Oct 25 09:00 -> Oct 26 08:00 -> Oct 26 09:00 [Due]`), dimming any past stages that will be automatically skipped.

4. `ConfirmationDateBanner`: High-visibility interactive banner in the Share Capture Sheet highlighting the `chrono-node` matched phrase (e.g., matched "next Friday at 3pm" -> `Fri, 30 Oct 2026 • 15:00`) with 1-tap quick-adjust chips (`+1h`, `Tonight 20:00`, `Tomorrow 09:00`, `Pick Custom`).



======================================================================

3. PRODUCT DECISIONS — THE SOURCE OF TRUTH

======================================================================



PRODUCT NAME

Remindly (working name; keep name, package identifier, theme, and app metadata configurable in one place).



PRODUCT PROMISE

"Never lose a follow-up hidden in a message."



WHAT THE APP DOES

Remindly is an Android-first, personal follow-up assistant. A user shares text or a URL from another Android app into Remindly, reviews the suggested task title and any detected date/time, chooses or accepts a reminder profile, and saves it. Remindly stores the task locally, schedules its reminder occurrences, preserves the available source context, and provides Today, Inbox, and Upcoming views. Users can complete, snooze, reschedule, edit, archive, or delete their tasks.



MVP SUCCESS CRITERIA

1. A basic, unambiguous reminder can be captured and saved in a few taps (under 3 seconds from the Android Sharesheet).

2. A date/time suggestion is visibly confirmed by the user; the app never silently assumes an ambiguous deadline is correct.

3. Task data remains available after app restart and without internet access.

4. Editing, completing, archiving, or deleting a task reconciles its reminder occurrences and OS notifications atomically.

5. A reminder carries useful source context. Open Source is shown only when an actual usable URL was captured. Otherwise display the source excerpt and source application, if known, with a 1-tap Copy Excerpt fallback.

6. Users can see when reminders are not permitted or when exact-alarm access is unavailable. The app must not promise second-perfect delivery on every Android device.

7. Core flows are tested, documented, and runnable from this repository.



TARGET AND RELEASE SCOPE

- Android first. Build and test Android. Do not implement iOS-specific code in the MVP unless shared code genuinely requires it.

- React Native + TypeScript + Expo using a current stable SDK whose packages are mutually compatible at implementation time.

- Use an Expo development build when native integration is needed. Expo Go is not the final testing environment for share-intent/native behavior.

- Local-first. No login, cloud sync, API backend, paid service, inbound email, Gmail/Outlook add-in, collaboration, shadow accounts, magic links, team assignment, cloud LLM, or analytics SDK in the MVP.

- No Accessibility Service, notification-listener permission, screen scraping, or attempt to silently read other apps. Only use data the user explicitly shares or types.

- No broad contacts, inbox, SMS, or email permissions.

- No ads or monetization flow in this milestone.

- No Notifee dependency: its upstream GitHub repository was archived on 7 April 2026. Use Expo Notifications and document any unavoidable native Kotlin additions.

- Do not hard-code an iOS 48-slot rolling notification queue as a presumed Android requirement. Add a bounded scheduling window only if the tested implementation or documented Android alarm limits require it.



CORE UX

Bottom navigation with 4 tabs plus a persistent, thumb-friendly primary Add Task trigger:

1. Today — overdue escalations, next firing reminder stages, due today, and completed today section.

2. Inbox — unscheduled or uncertain captures that need date/title review.

3. Upcoming — all pending tasks, grouped chronologically with filter chips.

4. Settings — default reminder profile, default time for date-only tasks, quiet hours, notification/precision status, appearance theme, and local privacy information.



REMINDER PROFILES — STARTING DEFAULTS

- Simple: at the due time (0m).

- Standard (default): 24 hours before (-1440m), 1 hour before (-60m), at the due time (0m).

- Important: 24 hours before (-1440m), 4 hours before (-240m), 15 minutes before (-15m), at the due time (0m).

- Persistent (explicit opt-in only): Standard plus a capped number of post-deadline repeats (for example, +15m, +30m, +60m, max 3 repeats). Never create an infinite loop. Offer quiet hours and a clear 1-tap way to stop persistence.



Profiles are defaults, not rigid requirements. Users can select a profile per task and edit profile stages in Settings. If a task is due soon, omit past reminder occurrences rather than firing a burst of overdue alerts. Deduplicate equal occurrence times. Recompute occurrences whenever the deadline, timezone interpretation, profile, or relevant settings change.



DATE/TIME SAFETY RULES

- Parse against an explicit reference time and the device's IANA timezone, not an implicit machine default.

- Preserve the raw shared text verbatim.

- Display the interpreted date and time in an editable, visually clear confirmation banner before scheduling.

- If no date/time is found, multiple interpretations exist, or parsing is unsafe, default the capture to Inbox or ask the user to pick a date. Never invent a deadline.

- For a date-only commitment, the user must understand which local time is used for reminder scheduling. Provide a configurable default time (starting at 09:00 in the device's local timezone) and show it clearly before saving. Store that the original deadline was date-only (`due_precision = 'date'`).

- For timed tasks (`due_precision = 'datetime'`), store the UTC instant and the IANA timezone used to interpret it.

- Recommended MVP timezone rule: a timed task represents a fixed instant (stored as UTC) and keeps the original IANA timezone for display/editing; a date-only task remains a local calendar date and is re-evaluated against the current local timezone for its configured reminder time.



SOURCE CONTEXT

Store only the information provided through the Android share intent or typed by the user. Source app name/package may be unavailable; treat it as optional, not guaranteed. Store a source URL only when a usable http/https URL was actually received. Do not synthesize broken app-specific URI schemes. If there is no URL, provide the captured text excerpt and a 1-tap "Copy excerpt" action.



NOTIFICATION SAFETY

- Implement clear notification permission onboarding and Settings status.

- Create meaningful Android notification channels ("Task Reminders" for standard alerts and "Urgent Deadline Reminders" for high-priority stages), with an understandable explanation of how users can adjust channel behavior in Android Settings.

- Keep normal reminders on a standards-compliant best-effort path unless the user explicitly enables exact-alarm precision via `SCHEDULE_EXACT_ALARM` (checking permission status before scheduling and handling denial/revocation gracefully without crashing). Never declare `USE_EXACT_ALARM` in the MVP unless Play Store policy eligibility is explicitly verified.

- Completion, rescheduling, archive, and deletion must cancel obsolete future notifications and occurrences immediately.

- Notification actions must be tested with the app foregrounded, backgrounded, and terminated on actual Android builds. If an action cannot reliably mutate local SQLite data from a terminated state in the chosen Expo SDK, route that action to open the task action sheet immediately instead of pretending it succeeded silently.



======================================================================

4. MASTER PROJECT INSTRUCTION — PASTE THIS ONCE INTO ANTIGRAVITY

======================================================================



You are the Principal React Native/Android Architect, Staff Product Designer, and QA Lead responsible for building Remindly in this repository. Build the production-grade Android application incrementally across Phases 0 through 7. All product, scope, safety, and visual design rules in this document are binding.



WORKING METHOD

1. Inspect the current repository before changing anything. If code already exists, preserve useful work and diagnose its architecture instead of replacing everything blindly. If empty, create the project from a current stable Expo TypeScript template.

2. Before each phase, write a concise implementation plan and list the files that will be created or modified. Then execute the phase completely; do not stop after producing a plan.

3. Work ONLY on the phase requested in the current prompt. Never preemptively implement later phases.

4. Verify current package documentation, Expo SDK compatibility, maintenance status, and Android requirements before choosing third-party libraries. Prefer official Expo and Android documentation. Never install `@notifee/react-native` (archived April 2026). Record every material dependency decision in `docs/ARCHITECTURE.md` with the verification date and rationale.

5. Enforce strict TypeScript (`"strict": true`, no implicit `any`), modular domain separation (`src/domain/`, `src/db/`, `src/services/`, `src/components/`, `src/screens/`, `src/theme/`), and pure business logic functions with injectable clocks (`now: Date`, `timezone: string`) for 100% deterministic unit testing.

6. Enforce the "Tactile Swiss Utility" Anti-AI-Slop visual specification:

   - Load and apply the 3-tier font pairing (`Plus Jakarta Sans` for headers, `Inter` for body/tasks, `JetBrains Mono` for all timestamps, countdowns, and offset chips).

   - Use `lucide-react-native` icons with a consistent 1.75px stroke width; never use emojis as UI icons.

   - Use clean hairline dividers, semantic status pills, high-contrast slate/alabaster surfaces (with full dark mode parity), and zero purple gradients or bloated nested cards.

   - Use connected UI MCP servers (`shadcn` / `react-native-reusables`, `21st.dev`, or `figma-context-mcp`) when available in the environment to scaffold accessible component primitives.

7. Do not introduce a backend, authentication, remote AI, analytics, permissions, or third-party cloud service in the MVP.

8. Never invent test results. Run every check available in the terminal (`tsc --noEmit`, unit/integration tests via Jest/Vitest, linter, `npx expo-doctor`). Clearly separate automated terminal results from manual physical-device/emulator Android checks.

9. Add database migrations and seed the four built-in reminder profiles (`Simple`, `Standard`, `Important`, `Persistent`) idempotently. Never rely solely on in-memory React state for task or reminder data after Phase 1.

10. Update `docs/BUILD_LOG.md` at the end of each phase with completed work, commands run, test results, known limitations, and readiness for the next phase. Stop immediately after reporting the phase checkpoint.



DELIVERABLE AT THE END OF EVERY PHASE

- Summary of what was implemented.

- Key files created or modified and their responsibilities.

- Exact terminal commands executed and truthful results.

- Unit/integration tests added and what failure modes they guard against.

- Manual Android device/emulator verification steps required.

- Known limitations or architectural trade-offs recorded.

- Explicit pass/fail check against the phase acceptance criteria.

- Stop and wait for approval before starting the next phase.



======================================================================

PHASE 0 PROMPT — REPOSITORY AUDIT, TECHNICAL SPIKE & PROJECT SETUP

======================================================================



Goal: Establish a verified, runnable Expo TypeScript foundation, configure typography and styling packages, and lock architectural decisions before building product screens.



Prompt to paste into Antigravity:



"Execute Phase 0 for Remindly. Inspect the workspace and identify whether it is empty, an existing Expo project, or another application. Do not overwrite useful existing work. Verify current official documentation for the active stable Expo SDK, React Native compatibility, `expo-notifications`, `expo-sqlite`, `expo-font`, `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/inter`, `@expo-google-fonts/jetbrains-mono`, `lucide-react-native`, Android share-target integration (`ACTION_SEND`), notification permissions, and exact-alarm rules.



If the repository is empty, bootstrap a TypeScript Expo application using the current stable template and compatible package versions. Configure an Expo development build workflow because native Android share-target behavior will be tested outside Expo Go. Do not install Notifee. Do not add backend or cloud packages.



Install and configure the foundational UI and font packages compatible with the active Expo SDK:

- `expo-font` with `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/inter`, and `@expo-google-fonts/jetbrains-mono`

- `lucide-react-native` and `react-native-svg`

- Styling/token system (`NativeWind` v4 or a clean typed `StyleSheet` + theme token engine if NativeWind has any SDK conflict—verify and document the choice)



Create or update:

- `AGENTS.md` with the permanent engineering, scope, safety, and Anti-AI-Slop visual rules from the Master Project Instruction.

- `docs/PRODUCT_SPEC.md` with target users, MVP promise, core flows, in-scope and out-of-scope features, and the Anti-AI-Slop visual design rules.

- `docs/ARCHITECTURE.md` with stack decisions, typography/token architecture, SQLite data flow, package compatibility matrix, Android share-target strategy, notification & exact-alarm strategy, privacy boundaries, and official documentation links checked.

- `docs/TEST_PLAN.md` with deterministic unit, repository integration, and physical Android device test matrices.

- `docs/BUILD_LOG.md` with Phase 0 status and command outputs.



Make the project boot into a clean branded diagnostic shell that loads the three custom font families (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`) and renders a sample `TemporalChip` and `Lucide` icon to prove the typography and icon pipeline work without warnings. Run `npx expo-doctor`, TypeScript type-checking (`tsc --noEmit`), and baseline tests. Report truthful results and stop."



Acceptance criteria:

- Project boots cleanly with custom fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`) and `lucide-react-native` verified.

- Zero obsolete/archived dependencies (no Notifee).

- `AGENTS.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `TEST_PLAN.md`, and `BUILD_LOG.md` are created and comprehensive.

- TypeScript and Expo Doctor checks pass.



======================================================================

PHASE 1 PROMPT — ANTI-AI-SLOP DESIGN SYSTEM, NAVIGATION & SCREEN SHELLS

======================================================================



Goal: Build a premium, calm, tactile utility UI ("Tactile Swiss Utility") and full navigation shell before wiring SQLite persistence.



Prompt to paste into Antigravity:



"Execute Phase 1 only. Build the complete visual design system, reusable component library, and navigable screen shells for Remindly using React Native, TypeScript, and the typography/token foundation from Phase 0. If UI MCP servers (`shadcn` / `react-native-reusables` or `21st.dev`) are connected, use them to scaffold accessible component primitives and adapt them to our strict token palette. Do not implement real SQLite queries, native share intents, or OS notification scheduling in this phase; use clearly isolated, strongly typed mock fixtures (`src/mocks/phase1Fixtures.ts`) with a toggle in the UI or dev menu to preview Empty, Populated, Overdue, and Ambiguous states.



Enforce the Anti-AI-Slop Visual Specification strictly:

- Typography: `Plus Jakarta Sans` (600/700) for screen titles and section headers; `Inter` (400/500/600) for task titles, source excerpts, and body controls; `JetBrains Mono` (500/600) for all timestamps, countdown pills (`in 45m`), reminder stage chips (`-24h`, `-1h`, `0m`), and timezone labels (`IST`).

- Palette & Surfaces: Warm Alabaster (`#F8FAFC`) and Deep Slate (`#0F172A`) in Light Mode; Carbon Obsidian (`#090D16`) and Crisp Zinc (`#F8FAFC`) in Dark Mode. Zero purple gradients, zero heavy drop shadows, zero emoji icons. Use `lucide-react-native` (1.75px stroke) exclusively.

- Layout & Touch Targets: Hairline divider rows (`1px`), generous vertical rhythm, minimum `48x48dp` Android touch targets, and one-handed thumb ergonomics.



Build these core reusable components in `src/components/`:

1. `TemporalChip`: Monospace pill badge for stage offsets (`-24h`, `-1h`, `Due`), timestamps, and urgency tiers (Overdue, Due Soon, Scheduled, Completed).

2. `SourceProvenanceCard`: Left-accented context block displaying the optional source app badge (e.g., WhatsApp, Gmail, Chrome), sender/subject, raw shared snippet, and a conditional `Open Source URL` button (shown ONLY when a valid URL exists) or `Copy Excerpt` fallback button.

3. `CascadeTimelinePreview`: Visual horizontal step bar showing each stage of the selected Reminder Profile (`Simple`, `Standard`, `Important`, `Persistent`), clearly marking which past stages are skipped when a deadline is less than 24 hours away.

4. `ConfirmationDateBanner`: Interactive date/time confirmation bar for the Capture Sheet showing the detected phrase, the resolved calendar date/time + timezone, a `Date-Only (09:00 Default)` badge when applicable, and 1-tap quick-shift chips (`+1h`, `Tonight`, `Tomorrow 09:00`, `Custom`).

5. `TaskRowItem`: Scannable task row with a 1-tap completion checkbox/trigger, title, source app pill, next reminder countdown in `JetBrains Mono`, and quick reschedule/overflow menu.



Implement these navigable views:

1. `TodayScreen`: Grouped into `Overdue / Needs Action` (restrained crimson pill, never flashing animations), `Next Up (Firing Soon)` with live monospace countdowns, `Later Today`, and a collapsible `Completed Today` drawer.

2. `InboxScreen`: Triage queue for unscheduled or ambiguous shared captures showing the raw excerpt and 1-tap `Set Deadline`, `Keep Unscheduled`, or `Archive` actions.

3. `UpcomingScreen`: Chronological date-grouped stream (`Tomorrow`, `This Week`, `Later`) with filter chips (`All`, `Important`, `With Link`) and instant local search bar.

4. `SettingsScreen`: Clean grouped rows for Default Reminder Profile, Default Time for Date-Only Tasks (`09:00`), Quiet Hours (`22:00 – 08:00`), Notification & Exact-Alarm Permission Status cards, Appearance (`System / Light / Dark`), and Local-First Privacy Summary.

5. `CaptureReviewSheet` (Modal / Bottom Sheet): The signature share-capture and manual task creation sheet with title input, `ConfirmationDateBanner`, profile selector pills, `CascadeTimelinePreview`, `SourceProvenanceCard`, and sticky bottom `Save Reminder` / `Save to Inbox` CTA bar that stays above the Android software keyboard.

6. `TaskDetailScreen`: Full view/editor for task status, deadline & timezone, individual reminder occurrence statuses (`Pending`, `Scheduled`, `Skipped`, `Completed`), and full source excerpt.



Run type-check (`tsc --noEmit`), lint, and component/unit tests. Capture screenshots or render previews if supported by the environment. Stop after Phase 1 and report."



Acceptance criteria:

- All 6 views and the 5 signature components are implemented, navigable, and responsive to light/dark themes and keyboard open states.

- Typography strictly uses `Plus Jakarta Sans`, `Inter`, and `JetBrains Mono`; zero emojis are used as UI icons.

- Empty, populated, overdue, and ambiguous-capture states are testable and visually polished.

- TypeScript and tests pass with zero errors.



======================================================================

PHASE 2 PROMPT — SQLITE, DOMAIN MODEL, TASK CRUD & MIGRATIONS

======================================================================



Goal: Replace Phase 1 mock fixtures with a transactional, migration-versioned local SQLite repository using `expo-sqlite`.



Prompt to paste into Antigravity:



"Execute Phase 2 only. Replace the Phase 1 demo fixtures with a strongly typed domain layer (`src/domain/`) and persistent SQLite repository (`src/db/`) using the current `expo-sqlite` API. Keep React UI components completely decoupled from raw SQL queries. Do not implement native Android Share Intents or OS notification scheduling yet.



Implement versioned SQLite migrations (`PRAGMA user_version` or migration table) and foreign-key enforcement (`PRAGMA foreign_keys = ON`) for these five tables:



A. `tasks`

- `id` (TEXT PRIMARY KEY — UUID v4)

- `title` (TEXT NOT NULL — trimmed, non-empty validated)

- `notes` (TEXT NULL)

- `status` (TEXT NOT NULL — `'inbox' | 'scheduled' | 'completed' | 'archived'`)

- `priority` (TEXT NOT NULL — `'normal' | 'important'`)

- `due_precision` (TEXT NOT NULL — `'none' | 'date' | 'datetime'`)

- `due_at_utc` (TEXT NULL — ISO-8601 UTC instant for scheduled tasks)

- `due_local_date` (TEXT NULL — `YYYY-MM-DD` for date-only commitments)

- `due_local_time` (TEXT NULL — `HH:mm` local time used for display/interpretation)

- `due_timezone` (TEXT NOT NULL — IANA timezone string, e.g., `'Asia/Kolkata'`)

- `reminder_profile_id` (TEXT NULL REFERENCES `reminder_profiles(id)`)

- `created_at_utc`, `updated_at_utc`, `completed_at_utc` (NULL), `archived_at_utc` (NULL)



B. `task_sources`

- `id` (TEXT PRIMARY KEY)

- `task_id` (TEXT NOT NULL REFERENCES `tasks(id)` ON DELETE CASCADE)

- `source_app_label` (TEXT NULL)

- `source_app_package` (TEXT NULL)

- `source_url` (TEXT NULL — validated `http://` or `https://` only)

- `source_excerpt` (TEXT NULL)

- `sender_label` (TEXT NULL)

- `subject` (TEXT NULL)

- `created_at_utc` (TEXT NOT NULL)



C. `reminder_profiles`

- `id` (TEXT PRIMARY KEY — e.g., `'builtin_simple'`, `'builtin_standard'`, `'builtin_important'`, `'builtin_persistent'`, or UUID)

- `name` (TEXT NOT NULL)

- `description` (TEXT NOT NULL)

- `is_builtin` (INTEGER NOT NULL — 0 or 1)

- `repeat_interval_minutes` (INTEGER NULL — used only for opt-in Persistent profile, e.g., 15)

- `max_repeats` (INTEGER NOT NULL DEFAULT 0 — capped finite integer, e.g., 3 for Persistent, 0 for others)

- `created_at_utc`, `updated_at_utc`



D. `profile_stages`

- `id` (TEXT PRIMARY KEY)

- `profile_id` (TEXT NOT NULL REFERENCES `reminder_profiles(id)` ON DELETE CASCADE)

- `sort_order` (INTEGER NOT NULL)

- `offset_minutes` (INTEGER NOT NULL — negative = before due, 0 = at due, positive = after due)

- `stage_kind` (TEXT NOT NULL — `'heads_up' | 'prep' | 'urgent' | 'deadline' | 'persistent_follow_up'`)

- `enabled` (INTEGER NOT NULL DEFAULT 1)



E. `reminder_occurrences`

- `id` (TEXT PRIMARY KEY)

- `task_id` (TEXT NOT NULL REFERENCES `tasks(id)` ON DELETE CASCADE)

- `profile_stage_id` (TEXT NULL REFERENCES `profile_stages(id)` ON DELETE SET NULL)

- `trigger_at_utc` (TEXT NOT NULL — ISO-8601 UTC timestamp)

- `stage_label` (TEXT NOT NULL — e.g., `'-24h'`, `'-1h'`, `'Due'`, `'+15m (1/3)'`)

- `status` (TEXT NOT NULL — `'pending' | 'scheduled' | 'completed' | 'cancelled' | 'skipped' | 'failed'`)

- `os_notification_id` (TEXT NULL)

- `schedule_attempt_count` (INTEGER NOT NULL DEFAULT 0)

- `last_error` (TEXT NULL)

- `created_at_utc`, `updated_at_utc`



Add indexes on `tasks(status, due_at_utc)`, `reminder_occurrences(status, trigger_at_utc)`, and `reminder_occurrences(task_id)`. Seed the four built-in profiles and their stages idempotently on first migration so user edits in Settings are never overwritten on subsequent app launches. Also create a lightweight `app_settings` key-value table for `default_profile_id` (`'builtin_standard'`), `default_date_only_time` (`'09:00'`), `quiet_hours_enabled` (`1`), `quiet_hours_start` (`'22:00'`), `quiet_hours_end` (`'08:00'`), and `theme_mode` (`'system'`).



Wire `TodayScreen`, `InboxScreen`, `UpcomingScreen`, `CaptureReviewSheet`, `TaskDetailScreen`, and `SettingsScreen` to real SQLite repositories. Whenever a scheduled task is created or its deadline/profile changes, atomically compute its logical `reminder_occurrences` rows in SQLite (skipping stages in the past relative to the injected `now` clock and deduplicating identical timestamps). Completing, archiving, or deleting a task must atomically mark pending occurrences as `'cancelled'`.



Write comprehensive unit and repository tests covering migrations, idempotent profile seeding, task CRUD, date-only vs. datetime precision storage, occurrence materialization, past-stage skipping, and completion/archive cancellation. Run all checks and stop after Phase 2."



Acceptance criteria:

- All tasks, sources, profiles, settings, and logical occurrences persist across app restarts in SQLite.

- Built-in profiles seed once idempotently and remain user-editable.

- UI screens read and mutate real SQLite data with zero reliance on Phase 1 mock fixtures.

- All unit and integration tests pass with an injected deterministic clock.



======================================================================

PHASE 3 PROMPT — REMINDER DOMAIN ENGINE & ANDROID NOTIFICATION SCHEDULING

======================================================================



Goal: Reconcile logical SQLite reminder occurrences with real Android OS notifications via `expo-notifications`, including channels, actions, and honest permission handling.



Prompt to paste into Antigravity:



"Execute Phase 3 only. Implement the on-device `NotificationScheduler` and reconciliation engine using `expo-notifications` and the Phase 2 SQLite repository. Before writing code, verify the exact trigger types, channel configuration, notification categories/actions, and permission methods in the installed `expo-notifications` version. Never install Notifee.



Core requirements:

1. Android Notification Channels:

   - Create two distinct channels on startup:

     a. `remindly_standard` ('Task Reminders' — DEFAULT/HIGH importance, clean sound, vibration) for `-24h` and `-1h` stages.

     b. `remindly_urgent` ('Deadline & Urgent Reminders' — HIGH/MAX importance) for `-15m`, `0m (Due)`, and opt-in `Persistent` post-deadline stages.

2. Idempotent Reconciliation Engine (`reconcileNotifications(now: Date)`):

   - Query pending/scheduled future occurrences from SQLite.

   - Cancel any OS notifications whose `os_notification_id` belongs to a completed, archived, deleted, or rescheduled occurrence.

   - Schedule any `'pending'` future occurrence with the OS, store the returned `os_notification_id`, and transition its status to `'scheduled'`.

   - Ensure reopening the app 10 times in a row produces zero duplicate OS notifications.

   - Respect Quiet Hours: if a non-deadline advance reminder (`heads_up` or `prep`) falls inside configured Quiet Hours, defer it to the Quiet Hours end time (unless that would push it past the task's actual due time, in which case deduplicate/skip safely and record the rule).

3. Interactive Notification Actions (`Open Task`, `Snooze +15m`, `Snooze +1h`, `Complete`):

   - Register notification categories with `expo-notifications`.

   - Validate payload (`taskId`, `occurrenceId`) defensively.

   - Test foreground, background, and cold/terminated behavior honestly. If terminated-state background completion cannot reliably open SQLite without foregrounding on the active Expo SDK, configure the action to foreground the app directly into the task's quick-action sheet and complete/snooze immediately upon mount—never silently drop the user's tap.

4. Privacy-Aware Notification Content:

   - Show the task title and stage badge (e.g., `Due in 1 hr • Follow up on contract`) without dumping private multi-line raw message excerpts onto the lock screen unless the user explicitly enables 'Show source snippet in notifications' in Settings.

5. Honest Permission & Exact-Alarm Handling:

   - Check and request Android 13+ `POST_NOTIFICATIONS` permission with a clear pre-permission explanation card.

   - Keep standard scheduling on the compliant best-effort trigger path. Document and surface Android battery optimization / exact-alarm status honestly in Settings with a 1-tap deep link to the app's Android system notification settings (`Linking.openSettings()`).



Write unit and integration tests (using a mocked OS notification adapter and injected clock) covering occurrence scheduling, idempotent re-reconciliation, completion/reschedule cancellation, snooze occurrence creation, quiet-hours deferral, permission denial resilience, and corrupted payload rejection. Run all checks and stop after Phase 3."



Acceptance criteria:

- Creating, rescheduling, snoozing, completing, or deleting a task reconciles both SQLite occurrences and OS scheduled notifications without duplicates or orphans.

- Notification channels and lock-screen action categories are registered and verified.

- Permission denial or revocation is surfaced clearly in the UI without crashing.

- Automated scheduler tests pass and physical-device test steps are documented.



======================================================================

PHASE 4 PROMPT — ANDROID SHARE TARGET / CROSS-APP CAPTURE

======================================================================



Goal: Register Remindly in the native Android Sharesheet (`ACTION_SEND`) so sharing text or a URL from WhatsApp, Gmail, Outlook, Slack, or Chrome opens the `CaptureReviewSheet` cleanly on both cold and warm launches.



Prompt to paste into Antigravity:



"Execute Phase 4 only. Implement native Android share-target ingestion (`android.intent.action.SEND` for `text/plain`) so Remindly appears in the Android Sharesheet across messaging, email, and browser apps. Before installing any third-party share package (such as `expo-share-intent`), verify its compatibility with the project's exact Expo SDK and React Native New Architecture status. If a lightweight custom Expo Config Plugin + small Kotlin native module/intent bridge is cleaner and more reliable under `npx expo prebuild`, implement and document that approach.



Requirements:

1. Native Android Manifest & Activity Launch Mode:

   - Configure `android.intent.action.SEND` with `<data android:mimeType="text/plain" />` and `android.intent.category.DEFAULT`.

   - Ensure `launchMode="singleTask"` (or proper `onNewIntent` forwarding) is configured via an Expo Config Plugin so sharing into Remindly while the app is already open in the background routes the new intent into the active instance instead of stacking duplicate activities.

2. Defensive Intent Payload Normalization (`src/services/shareIngestService.ts`):

   - Extract `EXTRA_TEXT` and optional `EXTRA_SUBJECT` or `EXTRA_TITLE`.

   - Extract the first valid `http://` or `https://` URL if embedded inside `EXTRA_TEXT` (for example, when Chrome or YouTube shares `'Check this out https://example.com/doc'`) while preserving the full raw text excerpt.

   - Assign a deterministic `ingestKey` (hash of payload + intent timestamp bucket) so repeated React mounts or hot reloads never open duplicate capture sheets for the same share event.

   - Record source app metadata only if reliably provided by the Android intent/referrer; otherwise leave `source_app_label` null or allow quick user tagging (`WhatsApp`, `Gmail`, `Outlook`, `Slack`, `Web`) via 1-tap chips in the `CaptureReviewSheet`.

3. Routing into `CaptureReviewSheet`:

   - Both cold-start shares and warm-background shares must open `CaptureReviewSheet` pre-populated with the normalized payload.

   - Never auto-save a shared payload before the user reviews it. If the user dismisses or taps `Save to Inbox`, preserve the item in `Inbox` so zero shared thoughts are ever lost.

   - Handle empty, binary-only, or malformed share payloads with a polite toast/banner rather than a crash.

4. Prebuild Survival:

   - Verify that running `npx expo prebuild --platform android` generates the exact required `AndroidManifest.xml` intent filters cleanly without manual untracked edits.



Add unit tests for the share payload normalizer (text-only, URL-only, text with embedded URL, email subject + body, WhatsApp forwarded multi-line text, Unicode/emoji text, empty payload, and duplicate intent deduplication). Document exact steps to build and test the Android development build via `adb` intent simulation (`adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT ...`) and real apps. Run all checks and stop after Phase 4."



Acceptance criteria:

- `npx expo prebuild` cleanly generates the Android `ACTION_SEND` `text/plain` intent filter and `singleTask` launch handling.

- Cold-start and warm-start share intents route once into `CaptureReviewSheet` with extracted URL, subject, and raw excerpt.

- Unit tests cover all share payload normalization and deduplication edge cases.



======================================================================

PHASE 5 PROMPT — LOCAL NLP DATE PARSING, CONFIRMATION UX & INBOX TRIAGE

======================================================================



Goal: Convert shared messages into smart, deterministic deadline and title suggestions using local `chrono-node` parsing—always requiring explicit visual confirmation before scheduling.



Prompt to paste into Antigravity:



"Execute Phase 5 only. Implement the local natural-language date/time parser and smart title extractor (`src/domain/nlpParser.ts`) using `chrono-node` (configured for deterministic local execution with an injected reference instant and device IANA timezone), and wire it into `CaptureReviewSheet` and `InboxScreen`. Never send user text to any remote server or cloud LLM.



Requirements:

1. Smart Title & Context Extraction:

   - Preserve the full raw shared text in `source_excerpt`.

   - Strip leading boilerplate (e.g., WhatsApp timestamps like `'[14:20, 24/10/2026] Rahul: '`, email `'Fwd:'` headers, and raw URLs) and remove the matched date/time phrase ONLY if the remaining text still forms a meaningful task title (>= 4 characters). If stripping the date leaves an empty or cryptic string, keep the cleaned first line as the suggested title.

2. Deterministic Local Date/Time Parsing (`parseCaptureText(rawText, referenceDate, timezone, settings)`):

   - Use `chrono-node` with `{ forwardDate: true }` against the injected `referenceDate`.

   - Classify the result explicitly:

     a. `kind: 'datetime'` — Both calendar date and specific clock time were explicitly stated (e.g., `'tomorrow at 3:30 PM'`, `'in 45 minutes'`, `'Oct 28 at 11am'`).

     b. `kind: 'date_only'` — Only a calendar day was stated (e.g., `'by Friday'`, `'next Tuesday'`, `'on 15 Nov'`), or a vague time-of-day phrase like `'tomorrow morning'` / `'Friday evening'` (map `'morning'` -> configured default `09:00`, `'afternoon'` -> `14:00`, `'evening'` -> `18:00`, and flag as `needsTimeConfirmation: true`).

     c. `kind: 'ambiguous'` — Multiple conflicting future dates were detected in a long email/message thread (return all candidates as 1-tap selectable chips in `ConfirmationDateBanner` and require the user to tap one or save to Inbox).

     d. `kind: 'none'` — No future date/time detected (or detected date is in the past). Default the primary CTA to `Save to Inbox` while offering 1-tap quick-schedule chips (`Later Today +3h`, `Tomorrow 09:00`, `Next Monday 09:00`).

3. Interactive Confirmation UX in `CaptureReviewSheet`:

   - Highlight the exact matched substring from the shared message inside `ConfirmationDateBanner`.

   - Show the resolved deadline in `JetBrains Mono` alongside the live `CascadeTimelinePreview` of the selected Reminder Profile.

   - Allow 1-tap switching between `Simple`, `Standard`, `Important`, and `Persistent` profiles, and 1-tap time adjustments.

   - Include a subtle lock icon and privacy caption: `'Parsed 100% on-device • Never uploaded'`.



Write an exhaustive, deterministic unit test suite (using a fixed reference timestamp such as `2026-10-24T10:00:00+05:30` in `Asia/Kolkata` and `America/New_York`) covering:

- `'tomorrow at 3 PM'`

- `'in 45 minutes'`

- `'next Friday'`

- `'Friday morning'` / `'tomorrow evening'`

- `'28 Oct 2026 at 16:30'`

- Date-only deadlines (`'by Wednesday'`) applying the user's configured default time (`09:00`)

- Past dates in old forwarded messages (`'sent on Oct 10'`)

- Multi-date email threads returning multiple selectable candidates

- Messages with no date

- Messages with URLs, WhatsApp prefixes, emojis, Unicode, and line breaks

- Title extraction fallback safety so a title is never blank.



Run all checks and stop after Phase 5."



Acceptance criteria:

- Local parser extracts dates, times, precision flags, and candidate chips deterministically without network access.

- Ambiguous or dateless captures default safely to Inbox confirmation rather than inventing silent deadlines.

- All 11+ required NLP test categories pass with a fixed injected clock.



======================================================================

PHASE 6 PROMPT — END-TO-END WORKSPACE, PROFILE STUDIO & TASK ACTIONS

======================================================================



Goal: Unify all screens, settings, custom profile stage editors, Quiet Hours logic, and lock-screen/in-app task mutations into a cohesive, zero-friction daily driver.



Prompt to paste into Antigravity:



"Execute Phase 6 only. Connect every remaining screen, action, and setting into a complete end-to-end workflow and remove any leftover developmental placeholders.



Verify and polish these end-to-end flows:

1. `TodayScreen` Ergonomics & Zero-Fatigue Hierarchy:

   - Overdue items display how long ago they were due in `JetBrains Mono` with 1-tap `Complete`, `+1h Snooze`, `Tomorrow 09:00`, and `Open Source` buttons directly accessible without swiping.

   - `Next Up` shows the next firing reminder occurrence across active tasks so the user always knows when their phone will alert them next.

2. `InboxScreen` Rapid Triage:

   - Badge count on the bottom navigation tab reflects unscheduled Inbox items.

   - 1-tap `Schedule` opens `CaptureReviewSheet` pre-filled with that Inbox item and promotes `status` from `'inbox'` to `'scheduled'` upon save.

3. `TaskDetailScreen` & Per-Task Stage Control:

   - View and edit title, notes, deadline, precision, Reminder Profile, and source context.

   - Display the materialized list of `reminder_occurrences` (`Scheduled`, `Skipped (Past)`, `Completed`, `Cancelled`) and allow toggling individual stages or adding a 1-tap custom snooze.

   - Clicking `Open Source URL` opens the validated link via `Linking.openURL` with a graceful toast + `Copy Excerpt` fallback if no browser/app can handle it.

4. `SettingsScreen` & Profile Stage Editor:

   - Allow editing the stages of reminder profiles (toggling stages or adjusting offsets) and changing the Default Profile and Default Date-Only Time (`09:00`).

   - When Quiet Hours or Default Date-Only Time changes, offer or execute a safe reconciliation of pending occurrences.

   - Include a 'Send Test Notification (in 5s)' diagnostic button in Settings so users can immediately verify their Android notification channel and sound settings.

   - Include 'Export Local Backup (JSON)' and 'Clear Completed Tasks' utilities for local-first data ownership.



Write end-to-end domain integration tests covering the full lifecycle:

`Share Ingest -> NLP Parse -> User Confirmation Save -> SQLite Persistence -> Occurrence Materialization -> OS Notification Scheduling -> Snooze (+15m) -> Reschedule -> Complete -> Cancel Remaining Occurrences -> App Restart Reconciliation`.

Run all checks and stop after Phase 6."



Acceptance criteria:

- Every screen, filter, setting, and action button operates on real SQLite data and reconciles OS notifications atomically.

- Quiet Hours, test notification trigger, and local JSON backup export work cleanly.

- Full lifecycle integration tests pass with zero errors.



======================================================================

PHASE 7 PROMPT — RELIABILITY AUDIT, ANDROID QA, PRIVACY & RELEASE PREP

======================================================================



Goal: Perform a ruthless production audit, execute automated and emulator/device verification, verify 100% offline privacy, and prepare the Android release candidate.



Prompt to paste into Antigravity:



"Execute Phase 7 only. Conduct a comprehensive quality, reliability, accessibility, and privacy audit across the entire Remindly codebase against `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/TEST_PLAN.md`. Do not add post-MVP scope (no cloud sync, login, or email servers).



Execute and verify:

1. Automated Quality Gate:

   - `tsc --noEmit` (zero TypeScript errors, zero `@ts-ignore` hacks).

   - Linter and formatter checks.

   - Full Jest/Vitest unit and integration test suite (verify high coverage across `nlpParser`, `occurrenceMaterializer`, `notificationScheduler`, `shareIngestService`, and `taskRepository`).

   - `npx expo-doctor` and `npx expo prebuild --platform android` verification.

2. High-Volume & Edge-Case Stress Tests:

   - Add an automated stress test that creates 50 scheduled tasks with 4 stages each (200 occurrences), executes rapid reschedules, completions, and timezone shifts, and proves zero duplicate `os_notification_id` registrations and zero uncancelled orphan occurrences.

3. Privacy & Security Audit:

   - Verify that zero outbound network calls (`fetch`, `XMLHttpRequest`, third-party telemetry) transmit task titles or shared message excerpts.

   - Verify `AndroidManifest.xml` contains only minimal required permissions (no `BIND_ACCESSIBILITY_SERVICE`, no `BIND_NOTIFICATION_LISTENER_SERVICE`, no `READ_SMS` or `READ_CONTACTS`).

   - Ensure raw message excerpts and URLs are never printed to production `console.log`.

4. UI Polish & Accessibility Audit:

   - Verify all interactive touch targets meet Android `48x48dp` guidelines and carry `accessibilityLabel` and `accessibilityRole` props.

   - Verify Light Mode and Dark Mode contrast and keyboard avoidance across all screens and bottom sheets.

5. Documentation & Release Readiness:

   - Write a comprehensive `README.md` covering setup, font/UI architecture, development build commands (`npx expo run:android` / EAS Build), `adb` share-intent testing commands, and architecture overview.

   - Update `docs/BUILD_LOG.md` with the final test suite output, stress-test verification, and an honest release readiness checklist.



Stop after Phase 7 and present the final engineering sign-off report."



Acceptance criteria:

- TypeScript, linter, `expo-doctor`, and the entire unit/integration/stress test suite pass 100%.

- Zero network exfiltration or invasive Android permissions exist in `AndroidManifest.xml`.

- `README.md` and `docs/BUILD_LOG.md` provide complete build, `adb` test, and release instructions.



======================================================================

POST-PHASE REVIEW CHECKLIST — ASK ANTIGRAVITY AFTER EVERY PHASE

======================================================================



Before approving any phase and pasting the next prompt, verify that Antigravity answered:

1. What changed in the codebase? List the key files and their responsibilities.

2. Which terminal commands did you actually execute, and what were the exact results?

3. Which deterministic tests did you add, and what specific bug would each test catch?

4. Did you adhere strictly to the Tactile Swiss Utility design system (`Plus Jakarta Sans` + `Inter` + `JetBrains Mono`, `lucide-react-native` icons, zero emojis, zero purple gradients)?

5. What did you verify in the terminal vs. what requires a physical Android device or emulator?

6. Do all acceptance criteria for this phase pass with concrete evidence?
