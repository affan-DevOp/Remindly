export const typography = {
  fonts: {
    // 1. Display & Screen Headers (Plus Jakarta Sans)
    displaySemiBold: 'PlusJakartaSans_600SemiBold',
    displayBold: 'PlusJakartaSans_700Bold',

    // 2. Primary UI & Task Copy (Inter)
    bodyRegular: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',

    // 3. Tabular Monospace (JetBrains Mono for precise temporal timestamps)
    monoMedium: 'JetBrainsMono_500Medium',
    monoSemiBold: 'JetBrainsMono_600SemiBold',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 26,
  },
  lineHeights: {
    xs: 15,
    sm: 18,
    base: 20,
    md: 22,
    lg: 26,
    xl: 30,
    xxl: 34,
  },
  tracking: {
    tight: -0.3,
    tighter: -0.5,
    normal: 0,
    mono: 0.1,
  },
} as const;
