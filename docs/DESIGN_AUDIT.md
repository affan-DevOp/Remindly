# REMINDLY — DESIGN & ARCHITECTURE AUDIT (PHASE 0)
**Date:** 24 October 2026  
**Auditor:** Senior Product Designer & React Native Architect  
**Project:** Remindly (`com.remindly.app`)

---

## 1. Environment & Stack Baseline

| Component | Verified Version / Setting | Notes |
| :--- | :--- | :--- |
| **Framework** | Expo SDK ~58.0.17 | Current active stable Expo SDK |
| **Runtime** | React Native 0.88.0 | New Architecture compatible |
| **UI Engine** | React 19.3.0 | Requires `.npmrc` with `legacy-peer-deps=true` for ecosystem packages |
| **Language** | TypeScript ~6.0.3 | Strict typechecking enabled (`tsconfig.json`) |
| **Test Runner** | Jest 29.7.0 + ts-jest 29.2.5 | 10/10 tests passing across baseline & phase 1 suites |
| **Icon System** | `lucide-react-native` ^0.475.0 | SVG-backed, unified 1.75–2.4px stroke width |
| **Web Preview** | Metro Bundler + `react-native-web` | Live at `http://localhost:8081` (mobile viewport: 442x746) |

---

## 2. Inventory of Existing Screens & Components

| Screen / Component | Current Implementation State | Visual & Architectural Audit Findings |
| :--- | :--- | :--- |
| **TodayScreen** | `src/screens/TodayScreen.tsx` | Has functional task grouping (Overdue, Next Up, Later Today, Completed), but previously suffered from flat dark backgrounds (#000000) lacking the atmospheric warm espresso/cacao gradient lighting and smoked-glass depth from the primary Dribbble reference. |
| **InboxScreen** | `src/screens/InboxScreen.tsx` | Handles unscheduled/ambiguous captures awaiting deadline confirmation. Needs alignment with the warm smoked-glass surface language. |
| **UpcomingScreen** | `src/screens/UpcomingScreen.tsx` | Chronological listing with category filters. |
| **SettingsScreen** | `src/screens/SettingsScreen.tsx` | Default reminder profiles, quiet hours, permission status placeholder. Cleaned of redundant light/dark toggles. |
| **TaskDetailScreen** | `src/screens/TaskDetailScreen.tsx` | Comprehensive task inspector with timeline stage preview. |
| **CaptureReviewSheet** | `src/screens/CaptureReviewSheet.tsx` | The signature interaction. Needs finalization between two distinct design concepts (Minimal Floating Sheet vs Context-Forward Dossier) inspired by Reference G. |
| **BottomNavBar** | `src/components/BottomNavBar.tsx` | Updated to floating dock silhouette with center luminous lime FAB (`+`). |
| **HorizontalCalendarStrip** | `src/components/HorizontalCalendarStrip.tsx` | 7-day pill strip (Nov 2026) inspired by Reference A. |
| **TaskTimelineCard** | `src/components/TaskTimelineCard.tsx` | Dual-state cards: luminous lime featured card (`#DDF247`) and smoked-glass dark card (`#221E1B`). |
| **WelcomeOnboardingModal** | `src/screens/WelcomeOnboardingModal.tsx` | Editorial welcome modal inspired by Reference F (Timezy) adapted to Remindly. |

---

## 3. Real MCP Server Catalog Verification

| MCP Server | Verified Connection & Availability | Role in Project | Technical Constraint |
| :--- | :--- | :--- | :--- |
| **shadcn/ui MCP** | Connected (local stdio via npx) | Inspecting web component patterns, accessible design tokens | **Cannot paste DOM/Tailwind JSX into native React Native**. Used exclusively as pattern reference. |
| **21st.dev MCP** | Connected via remote API (`https://21st.dev/api/mcp`) | Micro-interaction inspiration, surface elevation reference | Catalog search endpoints intermittently time out; web-focused code must be translated to React Native StyleSheets. |
| **figma-developer** | Configured via npx stdio | Inspecting visual tokens if Figma files provided | Secondary utility tool. |

---

## 4. Current Deficiencies Identified ("Flat AI Slop" Diagnosis)

1. **Lack of Atmospheric Depth**:
   - The initial dark theme relied on flat pitch black (`#000000`) or generic indigo (`#090D16`).
   - The primary reference uses a **deep smoked-glass aesthetic**: warm dark espresso base (`#10110F`), subtle warm cacao/amber gradient underlays (`#2E2218`), and translucent glass cards (`rgba(34, 28, 24, 0.85)`).
2. **Missing Radial Glow & Lighting**:
   - The reference utilizes soft, warm atmospheric lighting behind active cards to create physical separation without harsh borders.
3. **Card Layering Hierarchy**:
   - Cards must not all share the same flat tone. The primary task must pop with **Luminous Chartreuse/Lime (`#DFFF45` / `#DDF247`)**, while subsequent tasks reside in smoked glass.
4. **Quick Capture Sheet Separation**:
   - A native Android share-sheet entry must be lightweight and floating, completely decoupled from the full app shell.

---

## 5. Phase 0 Acceptance & Next Actions
- [x] Codebase audited and verified running on Expo SDK 58 / React Native 0.88.
- [x] All 10 baseline unit tests pass with zero errors.
- [x] MCP tools inventoried with explicit React Native compatibility constraints.
- [x] Proceeding to Phase 1 Design Tokens & Quick Capture Card Comparison.
