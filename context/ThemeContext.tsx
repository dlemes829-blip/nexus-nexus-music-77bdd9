import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_ACCENTS, ThemeAccent } from "@/constants/theme";

interface ThemeContextType {
  accent: ThemeAccent;
  isDark: boolean;
  setAccent: (accent: ThemeAccent) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const ACCENT_KEY = "@nexus_accent_v3";
const DARK_KEY = "@nexus_dark_v3";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<ThemeAccent>(THEME_ACCENTS[0]);
  const [isDark, setIsDark] = useState(true); // Default dark like Spotify

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ACCENT_KEY),
      AsyncStorage.getItem(DARK_KEY),
    ]).then(([accentRaw, darkRaw]) => {
      if (accentRaw) {
        const found = THEME_ACCENTS.find((a) => a.id === accentRaw);
        if (found) setAccentState(found);
      }
      if (darkRaw !== null) setIsDark(darkRaw === "true");
    }).catch(() => {});
  }, []);

  const setAccent = useCallback((a: ThemeAccent) => {
    setAccentState(a);
    AsyncStorage.setItem(ACCENT_KEY, a.id).catch(() => {});
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      AsyncStorage.setItem(DARK_KEY, String(!prev)).catch(() => {});
      return !prev;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ accent, isDark, setAccent, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
