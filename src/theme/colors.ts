// Luminous Smoked Glass palette used by the original Remindly screens.
export const C = {
  canvas: '#10110E',
  canvas2: '#161310',
  surface: '#1E1A16',
  surface2: '#221E1B',
  surface3: '#2A231E',
  glass: 'rgba(32, 27, 23, 0.85)',
  glassLight: 'rgba(255, 255, 255, 0.045)',
  stroke: 'rgba(255, 255, 255, 0.08)',
  strokeStrong: 'rgba(223, 255, 69, 0.28)',
  lime: '#DFFF45',
  lime2: '#E8F66B',
  limeDark: '#B5C431',
  ink: '#F6F5EE',
  ink2: '#A29E95',
  muted: '#858076',
  muted2: '#68645C',
  amber: '#D9A82F',
  amberSoft: 'rgba(217,168,47,0.14)',
  green: '#4ADE80',
  red: '#FF6B6B',
  blue: '#3897F0',
  black: '#101404',
};

export interface ThemeColors {
  bgCanvas: string;
  bgAmbientGlow: string;
  bgSurfaceSmoked: string;
  bgSurface: string;
  bgElevated: string;
  bgMuted: string;
  borderSubtle: string;
  borderFocus: string;
  borderHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentLime: string;
  accentLimeDarkText: string;
  accentLimeGlow: string;
  accentPrimary: string;
  accentContrast: string;
  accentActive: string;
  status: {
    overdue: { text: string; bg: string; border: string };
    warning: { text: string; bg: string; border: string };
    scheduled: { text: string; bg: string; border: string };
    completed: { text: string; bg: string; border: string };
    neutral: { text: string; bg: string; border: string };
  };
}

export const appColors: ThemeColors = {
  bgCanvas: C.canvas,
  bgAmbientGlow: '#2A1E14',
  bgSurfaceSmoked: C.glass,
  bgSurface: C.surface,
  bgElevated: C.surface2,
  bgMuted: C.surface3,
  borderSubtle: C.stroke,
  borderFocus: C.strokeStrong,
  borderHighlight: 'rgba(255,255,255,0.12)',
  textPrimary: C.ink,
  textSecondary: C.ink2,
  textMuted: C.muted,
  accentLime: C.lime,
  accentLimeDarkText: C.black,
  accentLimeGlow: 'rgba(223,255,69,0.12)',
  accentPrimary: C.lime,
  accentContrast: C.black,
  accentActive: C.lime,
  status: {
    overdue: { text: C.red, bg: 'rgba(64,20,24,0.65)', border: '#6A242B' },
    warning: { text: '#FBBF24', bg: 'rgba(56,36,14,0.65)', border: '#6E4519' },
    scheduled: { text: C.blue, bg: 'rgba(20,46,67,0.65)', border: '#24516E' },
    completed: { text: C.green, bg: 'rgba(20,52,30,0.65)', border: '#246338' },
    neutral: { text: C.muted, bg: C.surface2, border: C.stroke },
  },
};

export const darkColors = appColors;
export const lightColors = appColors;