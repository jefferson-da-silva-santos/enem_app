// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.dark | typeof Colors.light;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then(saved => {
      if (saved) setModeState(saved as ThemeMode);
    });
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('theme_mode', newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
  }, [mode]);

  const isDark = mode === 'system'
    ? systemScheme === 'dark'
    : mode === 'dark';

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}