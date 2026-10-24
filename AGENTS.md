# Remindly — Engineering, Scope, Typography & Anti-AI-Slop Visual Design Rules

## 1. Antigravity UI MCP Servers
The following MCP servers are configured in `mcp_config.json` (`~/.gemini/config/mcp_config.json` and `.agents/mcp_config.json`):
1. **shadcn-ui** (`npx -y shadcn@latest mcp`): Access to component registry & primitives. Pairs with `react-native-reusables` (`npx @react-native-reusables/cli@latest init`) for NativeWind v4 primitives.
2. **magic-ui** (`npx -y @21st-dev/magic`): 12,000+ hand-crafted UI patterns, clean badge hierarchies, and micro-interaction layouts.
3. **figma-developer** (`npx -y figma-developer-mcp --stdio`): Inspects frames, design tokens, spacing, and layouts directly from Figma canvas (e.g., Mobbin patterns).

## 2. 3-Tier Typography System
Install and load via `expo-font` / `@expo-google-fonts`:
1. **Display & Screen Headers**: `Plus Jakarta Sans` (`@expo-google-fonts/plus-jakarta-sans`)
   - Weights: 600 (SemiBold), 700 (Bold)
   - Usage: Screen titles ("Today", "Inbox", "Upcoming"), bottom sheet titles, major group headers
   - Style: Tight letter-spacing (-0.3px to -0.5px)
2. **Primary UI & Task Copy**: `Inter` (`@expo-google-fonts/inter`)
   - Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)
   - Usage: Task titles, source message excerpts, buttons, settings labels
   - Style: High x-height, open apertures for narrow mobile screens
3. **Temporal & Metadata Monospace**: `JetBrains Mono` (`@expo-google-fonts/jetbrains-mono`)
   - Weights: 500 (Medium), 600 (SemiBold)
   - Usage: Due times ("14:30", "TOMORROW 09:00"), stage offset chips ("-24h", "-1h", "DUE"), countdown badges ("in 42m"), timezone tags ("IST / UTC+5:30")
   - Style: Tabular numerals for precision chronograph vertical alignment

## 3. Strict Anti-AI-Slop Visual Rules
- **No Purple/Indigo/Neon Gradients**: Zero linear-gradient backgrounds, glowing neon buttons, or generic AI purple (`#6366F1` / `#8B5CF6`).
- **No Card-Inside-Card Bloat**: No nested boxes with drop shadows. Use flat list rows separated by 1px subtle hairline dividers. Elevated surfaces are reserved strictly for the Capture Bottom Sheet and primary banners.
- **No Emoji Interface Icons**: Zero emojis as UI icons or status indicators. Use `lucide-react-native` vector icons exclusively with a uniform 1.75px stroke width.
- **No Full-Screen Modals for Quick Capture**: Use `@gorhom/bottom-sheet` (v5) or native modal sheet for smooth keyboard-aware capture overlay.
- **Touch Targets**: Minimum 48x48dp for all Android touch interactions.

## 4. Semantic Color Palette
### Light Mode ("Warm Alabaster & Deep Slate")
- Background Primary (`bg-canvas`): `#F8FAFC`
- Surface Elevated / Sheet (`bg-surface`): `#FFFFFF`
- Surface Subtle / Chip (`bg-muted`): `#F1F5F9`
- Border Hairline (`border-subtle`): `#E2E8F0`
- Text Primary (`text-primary`): `#0F172A`
- Text Secondary (`text-secondary`): `#475569`
- Text Muted (`text-muted`): `#94A3B8`
- Primary Accent (`accent-primary`): `#0F172A` with `#0284C7` (Precision Cerulean)

### Dark Mode ("Carbon Obsidian & Crisp Zinc")
- Background Primary (`bg-canvas`): `#090D16`
- Surface Elevated / Sheet (`bg-surface`): `#111827`
- Surface Subtle / Chip (`bg-muted`): `#1E293B`
- Border Hairline (`border-subtle`): `#1F2937`
- Text Primary (`text-primary`): `#F8FAFC`
- Text Secondary (`text-secondary`): `#94A3B8`
- Primary Accent (`accent-primary`): `#38BDF8`

## 5. Official Documentation & Reference Links
- React Native Reusables: https://reactnativereusables.com/docs
- NativeWind v4: https://www.nativewind.dev/docs/getting-started/installation
- Gorhom Bottom Sheet v5: https://gorhom.github.io/react-native-bottom-sheet/
- Lucide React Native Icons: https://lucide.dev/guide/react-native/
- Expo Google Fonts: https://github.com/expo/google-fonts
- Mobbin Bottom Sheet UI: https://mobbin.com/explore/mobile/ui-elements/bottom-sheet
- Mobbin Filter/Sort Screens: https://mobbin.com/explore/mobile/screens/filter-sort
