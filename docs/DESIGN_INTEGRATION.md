# Remindly Final Design & Interaction Integration

## Executive Summary
This document records the comprehensive visual and structural upgrade of Remindly to the refined **Luminous Smoked Glass** reference architecture. The update replaces generic geometric shapes with an atmospheric SVG radial glow system, implements the official `BlurTargetView` / `BlurView` blur-target hierarchy, and elevates all primary layouts (Calendar, Inbox, Settings, and Quick Capture) into high-fidelity editorial surfaces.

---

## 1. Ambient Lighting & Background System
Instead of hard-bordered circular views, the background now uses an SVG-based continuous diffuse lighting field via `react-native-svg` positioned behind a semi-translucent backdrop veil:
- **Amber Glow** (`#B88945` at `cx=91, cy=7`): Warm directional light spilling from top-right.
- **Sage Glow** (`#829C70` at `cx=-3, cy=47`): Diffuse organic earth tone along the left edge.
- **Lime Glow** (`#DCEC59` at `cx=79, cy=62`): Vibrant focal chartreuse glow behind mid-screen cards.
- **Umber Glow** (`#755334` at `cx=51, cy=104`): Deep grounding warmth anchored below the floating dock.
- **Backdrop Veil**: Three-stop linear gradient (`rgba(255,255,255,0.032)` to `transparent`) creating an optical depth layer between ambient glow and glass UI elements.

---

## 2. Blur Target Architecture
To achieve authentic Android 12+ / iOS frosted glass without UI artifacts or performance degradation:
1. **Root Target View**:
   ```tsx
   <BlurTargetView ref={blurTargetRef} style={styles.targetRoot}>
     {/* Ambient SVG + Gradient + App Shell */}
   </BlurTargetView>
   ```
2. **Component Blur Linking**:
   Each translucent layer explicitly links to `blurTargetRef` and requests `dimezisBlurViewSdk31Plus` on Android with responsive web fallbacks:
   - **Header**: `intensity={Platform.OS === 'web' ? 26 : 30}`
   - **Floating Bottom Dock**: `intensity={Platform.OS === 'web' ? 42 : 50}` with 1px top gloss highlight
   - **Quick Capture Sheet**: `intensity={Platform.OS === 'web' ? 50 : 64}`
   - **Task Details Sheet**: `intensity={Platform.OS === 'web' ? 48 : 62}`
   - **Modal Backdrop Overlays**: `intensity={Platform.OS === 'web' ? 45 : 55}`

---

## 3. Screen Layout & Feature Updates

### A. Today Dashboard
- **Greeting**: "Good morning, there. A calmer way to keep every promise."
- **Daily Focus Hero Card**: Two-line headline (*Catch it. Schedule it. Get it done.*), follow-up counter, and quick "Capture" action.
- **Timeline Date Strip**: Interactive 7-day pill strip with active chartreuse highlight and day dot.
- **Floating Reminder Notes**: Asymmetric rounded corners, alternating organic tilt angles (`-0.85deg` to `0.7deg`), subtle top sheen line, and four distinct color palettes (Chartreuse Lime, Soft Sage, Warm Paper Cream, Smoked Obsidian).
- **Dual Interaction Card**: Pressing the note body opens the Task Details Sheet; pressing the dedicated checkmark control completes the task immediately and fires SQLite/notification cancellations.

### B. Calendar Screen
- **Week Switcher**: Chevron controls for jumping weeks with dynamic range label (*19 Oct — 25 Oct*).
- **Weekday Rail**: Full 7-day horizontal scroll with date numbers, uppercase weekday codes, and today indicators.
- **Metric Pulse Strip**: Real-time counters for **OVERDUE**, **UPCOMING**, and **DONE** reminders.
- **Time-Rail Reminder Cards**: Left time column with bold tabular numbers and AM/PM badges, source icons, title, and excerpt.

### C. Inbox Screen
- **Commitment Holding Area**: Holds captured messages before a deadline is assigned.
- **Angled Counter Badge**: Prominent tilted badge displaying total items requiring sorting.
- **"Nothing Gets Guessed" Principle**: Clear communication that deadlines require user confirmation.
- **Horizontal Source Filters**: All, WhatsApp, Gmail, Slack, Notes, and Manual with live item counts.
- **Message Cards**: Color-coded source accent lines, time badges, and direct "Review & set date" action.

### D. Settings Screen
- **Local-First Badge**: Green shield confirmation of on-device data retention.
- **Reminder Rhythm**: Interactive Default Profile card with full 4-choice profile grid (*Simple*, *Standard*, *Important*, *Persistent*).
- **Options**: Date-only default time cycler (*08:00 AM*, *09:00 AM*, *10:00 AM*, *12:00 PM*) and Quiet Hours toggle (*10 PM to 8 AM*).
- **Delivery Readiness**: System notification health indicator with "Test reminder" simulation.
- **Look & Feel**: "Obsidian Glow" theme visualization with miniature floating card and dock preview.
- **Privacy Model**: Expandable explanation of on-device SQLite storage and alarm architecture.

### E. Quick Capture Sheet
- **3-Way Deadline Selector**: One-tap pills for **Today**, **Tomorrow**, and **Inbox**.
- **Interactive Date/Time Editor**: Refined input for custom deadline specification.
- **Profile Grid**: Selector for notification urgency rhythm.
- **Source Disclosure**: Expandable preview of captured text from shared messages.

---

## 4. Backend & Platform Services Integration
- **SQLite Task Repository**: Persistent CRUD storage via `taskRepository` on Android (`expo-sqlite`) with web/Jest memory fallbacks.
- **Native Android Notification Channels**:
  - `remindly_standard` (High importance, customized vibration)
  - `remindly_urgent` (Max importance, bypass DND option, custom alert sound)
- **Android Share Intent Ingestion**: `shareIngestService` receives and normalizes `ACTION_SEND` text/plain intents from WhatsApp, Slack, Gmail, and Notes.

---

## 5. Test & Type Verification
- **TypeScript**: `tsc --noEmit` passes with **0 errors**.
- **Jest Unit Tests**: **19/19 tests passing** across baseline, phase1, and service test suites.
- **Metro Bundler**: Running cleanly on port 8081 with zero fatal errors.
