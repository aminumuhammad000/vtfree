/**
 * Centralized theme colors for the application.
 * Modify these values to change the app's appearance across all screens.
 */

export const BRAND_COLORS = {
  primary: "#e0b105ff",
  secondary: "#F4C20D",
  accent: "#9333EA",
  success: "#00D166",
  error: "#FF3B30",
  warning: "#FFCC00",
};

export const Colors = {
  light: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    success: BRAND_COLORS.success,
    error: BRAND_COLORS.error,
    warning: BRAND_COLORS.warning,

    text: '#1A1A1A',
    textSecondary: '#757575',
    background: '#ffffff',
    surface: '#F2F2F2',
    border: '#E5E5E5',
    tint: BRAND_COLORS.primary,
    icon: '#687076',
    tabIconDefault: '#999',
    tabIconSelected: BRAND_COLORS.primary,
  },
  dark: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    success: BRAND_COLORS.success,
    error: BRAND_COLORS.error,
    warning: BRAND_COLORS.warning,

    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    background: '#000000',
    surface: '#1E1E1E',
    border: '#333333',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#555',
    tabIconSelected: BRAND_COLORS.primary,
  },
};

export type AppTheme = typeof Colors.light;

import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
