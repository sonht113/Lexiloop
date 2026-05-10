import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  background: string;
  canvas: string;
  surface: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  danger: string;
  warning: string;
  success: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_KEY = 'lexiloop_theme';

const lightColors: ThemeColors = {
  background: '#ffffff',
  canvas: '#f8fafc',
  surface: '#ffffff',
  elevated: '#fcf8ff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#475569',
  primary: '#3525cd',
  primarySoft: '#eef2ff',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
};

const darkColors: ThemeColors = {
  background: '#0b1020',
  canvas: '#111827',
  surface: '#172033',
  elevated: '#14172a',
  border: '#2b364d',
  text: '#f8fafc',
  muted: '#cbd5e1',
  primary: '#8b7cff',
  primarySoft: '#25214f',
  danger: '#f87171',
  warning: '#fbbf24',
  success: '#4ade80',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    SecureStore.getItemAsync(THEME_KEY)
      .then((value) => {
        if (!isMounted) return;
        setModeState(value === 'dark' ? 'dark' : 'light');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await SecureStore.setItemAsync(THEME_KEY, nextMode);
  };

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      isDark: mode === 'dark',
      isLoading,
      setMode,
    }),
    [isLoading, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
}
