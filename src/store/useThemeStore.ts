// [MÓVIL] Ruta: src/store/useThemeStore.ts

import { create } from 'zustand';

type FontSizeSize = 'normal' | 'large' | 'xlarge';
type ContrastMode = 'normal' | 'high';

interface ThemeState {
  fontSize: FontSizeSize;
  contrast: ContrastMode;
  setFontSize: (size: FontSizeSize) => void;
  setContrast: (mode: ContrastMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  fontSize: 'normal',
  contrast: 'normal',
  setFontSize: (size) => set({ fontSize: size }),
  setContrast: (mode) => set({ contrast: mode }),
}));

// Hook generador de Tema para usar en los componentes
export const useAppTheme = () => {
  const { fontSize, contrast } = useThemeStore();

  // Factor de escala de fuente
  const fontScale = fontSize === 'normal' ? 1 : fontSize === 'large' ? 1.2 : 1.4;

  // Paleta de Colores Dinámica
  const colors = {
    background: contrast === 'high' ? '#ffffff' : '#f8fafc', // slate-50
    surface: contrast === 'high' ? '#ffffff' : '#ffffff',
    textPrimary: contrast === 'high' ? '#000000' : '#0f172a', // slate-900
    textSecondary: contrast === 'high' ? '#333333' : '#475569', // slate-600
    border: contrast === 'high' ? '#000000' : '#e2e8f0', // slate-200
    primary: contrast === 'high' ? '#0000ee' : '#2563eb', // blue-600
    primaryLight: contrast === 'high' ? '#e6e6ff' : '#eff6ff', // blue-50
    success: contrast === 'high' ? '#006600' : '#059669', // emerald-600
    successLight: contrast === 'high' ? '#e6ffe6' : '#ecfdf5', // emerald-50
    danger: contrast === 'high' ? '#cc0000' : '#e11d48', // rose-600
    warning: contrast === 'high' ? '#660066' : '#4f46e5', // indigo-600
  };

  // Tamaños de texto dinámicos
  const typography = {
    xs: 12 * fontScale,
    sm: 14 * fontScale,
    base: 16 * fontScale,
    lg: 18 * fontScale,
    xl: 20 * fontScale,
    h2: 24 * fontScale,
    h1: 32 * fontScale,
  };

  return { colors, typography };
};