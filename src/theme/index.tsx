import React, { createContext, useContext, useMemo } from 'react';
import { appColors, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing, radii, layout } from './spacing';

export interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  layout: typeof layout;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo(
    () => ({
      isDark: true, // Permanent rich warm obsidian & lime style
      colors: appColors,
      typography,
      spacing,
      radii,
      layout,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      isDark: true,
      colors: appColors,
      typography,
      spacing,
      radii,
      layout,
    };
  }
  return context;
};

export * from './colors';
export * from './typography';
export * from './spacing';
