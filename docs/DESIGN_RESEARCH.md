# REMINDLY — DESIGN RESEARCH & ARCHITECTURE DECISIONS (PHASE 1)
**Date:** 24 October 2026  
**Status:** Approved for Implementation

---

## 1. Visual Language: "Luminous Smoked Glass"

### 1.1 Color Tokens & Material Tiers
Inspired directly by Reference A (three phone mockups with luminous chartreuse, deep smoked glass, and warm ambient glow):

| Token Name | Hex / RGBA Value | Purpose & Visual Role |
| :--- | :--- | :--- |
| **`canvasBackground`** | `#10110F` | Deep obsidian espresso base (not pure cold black) |
| **`ambientAmberGlow`** | `#2A1E14` / `rgba(46, 30, 20, 0.65)` | Warm radial background gradient providing depth |
| **`surfaceSmokedGlass`** | `rgba(32, 27, 23, 0.85)` | Translucent dark olive/cacao container |
| **`surfaceCardRaised`** | `#221E1B` | Elevated card surface with subtle inner glow |
| **`borderHairline`** | `rgba(255, 255, 255, 0.08)` | Warm hairline border (never heavy or opaque) |
| **`accentChartreuse`** | `#DFFF45` / `#DDF247` | Luminous signature accent: active cards, FAB (+), selected pills |
| **`accentChartreuseDarkText`**| `#111505` | High-contrast dark ink on chartreuse surfaces (WCAG AAA) |
| **`accentElectricBlue`**| `#3897F0` | Primary action button for in-app reminder card (Reference G) |
| **`accentForest`** | `#0F2A15` | Deep forest green for onboarding primary CTA (Reference F) |
| **`accentWarmSage`** | `#EBF3EA` | Soft sage backdrop for illustrated onboarding (Reference F) |
| **`textPrimary`** | `#F6F5EF` | Warm crisp ivory heading/title text |
| **`textSecondary`** | `#A6A79C` | Softened warm gray for readable secondary copy |
| **`textMuted`** | `#6E6862` | Subtle timestamp and metadata text |

---

## 2. Typography Hierarchy

Using **Plus Jakarta Sans** (headings, titles, CTA buttons) + **Inter** (body copy, notes) + **JetBrains Mono** (timestamps, tabular figures):
- **Hero Title**: 28px / line-height 34px / tracking -0.5px / Bold
- **Section Heading**: 16px / line-height 22px / tracking -0.2px / SemiBold
- **Card Title**: 15px / line-height 20px / tracking -0.2px / SemiBold
- **Body Regular**: 14px / line-height 20px / tracking 0px / Regular
- **Metadata Monospace**: 11px / line-height 15px / tracking +0.1px / Tabular numbers

---

## 3. Quick Capture Sheet: Two Concept Alternatives & Evaluation

### Concept A: "Focused Minimal Floating Sheet"
- **Anatomy**:
  - Compact rounded floating card (`borderRadius: 32`).
  - Remindly logo dot + dismiss (`X`).
  - Pre-filled editable task title input.
  - Prominent verified deadline chip (`Calendar` + `Clock` + tabular timestamp + inline quick shifts).
  - Compact Profile pill (`Standard (3 alerts) ▾`).
  - Single primary action: **"Save Reminder"** (Luminous Chartreuse pill button).
  - Quiet secondary action: **"Save to Inbox"** / **"Open Full App"**.
- **Pros**: Fastest time-to-save (<3 seconds), zero keyboard occlusion, thumb-friendly.
- **Cons**: Shows only collapsed 1-line source excerpt.

### Concept B: "Context-Forward Dossier Sheet"
- **Anatomy**:
  - Expanded source excerpt quotation box with origin pill (`From Slack`, `From WhatsApp`).
  - Detected phrase highlighted in quotation.
  - 3-stage visual notification cascade preview.
  - Title input + Date banner + Primary Save button.
- **Pros**: Maximum provenance context, great for complex contractual messages.
- **Cons**: Requires vertical scrolling on smaller Android displays when soft keyboard opens.

### Comparative Decision Matrix

| Evaluation Metric | Weight | Concept A (Focused Minimal) | Concept B (Context-Forward) | Selected Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Capture Speed (<3s)** | 25% | **9.6 / 10** | 7.8 / 10 | **Concept A** wins on rapid capture speed |
| **Small-Screen & Keyboard Fit** | 25% | **9.5 / 10** | 7.5 / 10 | **Concept A** keeps CTA visible above keyboard |
| **Context Verification** | 20% | 8.2 / 10 | **9.8 / 10** | Concept B offers full quote expansion |
| **Visual Elegance & Calmness** | 15% | **9.5 / 10** | 8.4 / 10 | Concept A avoids information overload |
| **Implementation Feasibility** | 15% | **9.8 / 10** | 8.6 / 10 | Concept A has lowest layout complexity |
| **Weighted Total** | 100% | **9.37 / 10** | **8.35 / 10** | **WINNER: Concept A (with progressive excerpt expander)** |

---

## 4. Native Android Share-Entry & Window Feasibility Spike

1. **Android ACTION_SEND Intent Target**:
   - In Expo Prebuild / bare Android, configured via `<intent-filter>` for `text/plain`.
   - Handled cleanly in React Native via `Linking.getInitialURL()` / native event emitter.
2. **Translucent Floating Window vs In-App Modal**:
   - **Key Architectural Fact**: A standard React Native `<Modal>` inside the main Activity can only blur content inside Remindly itself. To float over third-party apps (e.g. Gmail or Chrome), Android requires a dedicated Activity with `android:theme="@android:style/Theme.Translucent.NoTitleBar"`.
3. **Cross-Window Blur (Android 12+ API 31+)**:
   - `WindowManager.LayoutParams.FLAG_BLUR_BEHIND` provides native cross-window blur on supported GPUs.
   - Budget OEM chipsets (e.g. MediaTek Helio, low-end Snapdragon) frequently disable window blur to conserve GPU fill rate.
   - **Non-Negotiable Architecture Rule**: Remindly provides a high-contrast **dimmed translucent backdrop (`rgba(0,0,0,0.85)`)** as the universal baseline. Blur is strictly treated as progressive enhancement.
   - **SYSTEM_ALERT_WINDOW**: Strictly prohibited (avoids intrusive overlay permissions).

---

## 5. Additional Reference Implementations

1. **Reference F (Onboarding / Welcome Screen)**:
   - Dedicated editorial modal with soft sage background (`#EBF3EA`), friendly vector illustration, headline *"Catch it. Schedule it. Get it done."*, and deep forest green pill CTA *"Get Started"*.
2. **Reference G (In-App Reminder Card)**:
   - Dynamic Island / Heads-up style card with soft circular icon container, task title, supporting time text, and twin pill actions: **"Done" (Electric Blue #3897F0)** and **"Remind me later" (Outlined pill)**.
