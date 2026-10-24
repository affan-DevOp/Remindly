# REMINDLY — REDESIGN AUDIT & ARCHITECTURE SPECIFICATION (v2.0)
**Date:** 24 October 2026  
**Auditor:** Principal Product Designer & React Native Architect  
**Project:** Remindly (`com.remindly.app`)

---

## 1. Visual Defect Analysis of Failed Attempt

| Failed Implementation Defect | Root Cause in Code | Required Corrective Architecture |
| :--- | :--- | :--- |
| **"Timezy" Onboarding** | Used placeholder branding and generic clock icon from external Dribbble screenshot verbatim. | Replace with **Remindly** brand identity, custom vector illustration representing message-to-reminder ingestion, and persistent first-run routing. |
| **iOS Dynamic Island Notch Cutout** | Hardcoded black pill simulating iPhone hardware notch inside card header (`islandPill`). | **Strictly remove all iOS hardware chrome**. Remindly is an Android-first utility. Build a floating smoked-glass notification card. |
| **"Stay Hydrated" & 75% Donut Ring** | Copied fitness/hydration demo copy and arbitrary progress percentage. | **Strictly remove all fitness copy**. Use genuine Remindly tasks: deadline, source app badge (*From Slack*, *From WhatsApp*), and real reminder states. |
| **White/Blue Popup Disconnection** | Used stark white surface (`#FFFFFF`) and electric blue (`#3897F0`) disconnected from app theme. | Unify card within the **warm obsidian espresso (`#10110E`), smoked glass, and luminous chartreuse (`#DDF247`)** design system. |
| **Flat Black Dashboard** | Used flat pitch black background (`#000000`) without ambient gradient depth or layered lighting. | Introduce **atmospheric warm bronze/amber depth underlays (`#221A13` -> `#161310` -> `#10110E`)**, translucent smoked glass surfaces, and subtle hairline highlights. |
| **Oversized Flat Color Slabs** | Painted entire task cards solid neon chartreuse. | Use chartreuse as an **intentional focal accent** (active/urgent task, primary CTA, active calendar date), keeping normal reminders on neutral smoked-glass surfaces. |
| **Dev Preview Pollution in UI** | Placed testing buttons (*Opening Page (Img 2)*, *Reminder Card (Img 1)*) into the primary app header. | Remove development buttons from production user-facing headers. Provide clean modal triggers via proper user flows and settings. |

---

## 2. Design System Tokens: "Luminous Smoked Glass"

### 2.1 Color Grading & Lighting Architecture
```typescript
export const appColors = {
  // Atmospheric Canvas & Lighting
  bgCanvas: '#10110E',              // Deep warm obsidian espresso base
  ambientBronzeGlow: '#241B13',     // Warm ambient depth layer behind content
  bgSurfaceSmoked: 'rgba(28, 24, 20, 0.82)', // Translucent smoked glass
  bgCardRaised: '#1E1A16',          // Neutral elevated smoked card surface
  bgCardHover: '#28231E',           // Subtle card hover/active state
  
  // Signature Accents
  accentChartreuse: '#DFFF45',      // Luminous focal accent (WCAG calibrated)
  accentChartreuseDarkText: '#101404', // Dark ink text on chartreuse (AAA contrast: 14.8:1)
  borderHairline: 'rgba(255, 255, 255, 0.07)', // Ultra-subtle hairline border
  borderChartreuseGlow: 'rgba(223, 255, 69, 0.28)', // Deliberate edge highlight on focus
  
  // Typography Tones
  textPrimary: '#F6F5EE',           // Warm crisp ivory headings & titles
  textSecondary: '#A29E95',         // Softened warm gray for readable secondary copy
  textMuted: '#68645C',             // Subdued timestamp & metadata stone
  
  // Semantic Indicators
  statusOverdue: {
    text: '#FF6B6B',
    bg: 'rgba(64, 20, 24, 0.65)',
    border: '#6A242B',
  },
  statusWarning: {
    text: '#FBBF24',
    bg: 'rgba(56, 36, 14, 0.65)',
    border: '#6E4519',
  },
  statusCompleted: {
    text: '#4ADE80',
    bg: 'rgba(20, 52, 30, 0.65)',
    border: '#246338',
  },
};
```

---

## 3. Screen Specifications

### Screen 1: Today Screen (Main App)
- **Atmospheric Background**: Subtle warm gradient underlay.
- **Greeting**: *"Hi, Good Morning Jacobe"* with avatar circle and quick profile pill.
- **Category Filter**: Compact segmented pills (*ALL REMINDERS, IMPORTANT, NOTES*).
- **Horizontal Calendar**: Nov 2026 strip with day pills; active date in chartreuse.
- **Timeline Reminders**:
  - Left time markers: `9 am`, `11 am`, `12 pm`.
  - Featured/urgent task: Luminous chartreuse card (`#DDF247`) with dark typography.
  - Standard tasks: Neutral smoked-glass cards (`#1E1A16`) with icon badges and time subtitles.
- **Floating Dock**: Translucent floating bar (`borderRadius: 36`) with center chartreuse `+` button.

### Screen 2: Onboarding (Editorial Welcome)
- **Branding**: Remindly.
- **Vector Artwork**: Minimalist illustration of incoming message bubbles and link badges converging into a prioritized, actionable reminder card with a chartreuse badge.
- **Headline**: *"Catch it. Schedule it. Get it done."*
- **Copy**: *"Turn messages, chats, and links into actionable follow-ups without losing their source context."*
- **CTA**: Single full-width chartreuse pill button: *"Get Started"*.
- **Routing**: Shows on first app launch; can be replayed from Settings.

### Screen 3: In-App Reminder Notification Card
- **Android-First**: Floating smoked-glass card (`borderRadius: 24`), NO iOS notch or fake status chrome.
- **Task-First Content**: Task title (*"Review revised consulting agreement"*), source badge (*From Slack • #contracts*), and due timestamp (*Sat, 25 Oct • 3:00 PM*).
- **Actions**:
  - Primary: **"Done"** (Luminous Chartreuse pill button with dark text).
  - Secondary: **"Remind me in 1h"** (Outlined quiet smoked-glass pill button).

### Screen 4: Quick Capture Sheet (Share Intent Entry)
- **Form Factor**: Compact bottom-biased translucent floating sheet with dimmed backdrop (`rgba(0,0,0,0.82)`).
- **Fields**:
  - Title input with pre-filled shared text.
  - Verified deadline chip (or *"Add deadline"* if no date detected; *"Confirm deadline"* if ambiguous).
  - Collapsible source excerpt box.
  - Reminder profile pill (`Standard ▾`).
  - Primary button: **"Save Reminder"** (Chartreuse).
  - Secondary button: **"Open Full App"**.

---

## 4. MCP Tools & Verification Notes
- **shadcn/ui**: Used as design pattern reference; styles ported to native `StyleSheet`.
- **21st.dev**: Used for micro-interaction and surface elevation cues.
- **Lucide React Native**: Used globally for consistent 1.75–2.4px vector iconography.
- **Plus Jakarta Sans / Inter / JetBrains Mono**: Loaded cleanly via Expo Google Fonts.
