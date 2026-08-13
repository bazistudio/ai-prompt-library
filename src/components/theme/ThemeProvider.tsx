"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  primaryColor: string;
  accentColor: string;
  useAccentHighlights: boolean;
  reduceAnimations: boolean;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setUseAccentHighlights: (use: boolean) => void;
  setReduceAnimations: (reduce: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function getContrastColor(hex: string): string {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return "#07150f";
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  // If the color is light, use a very dark green text; otherwise, use light off-white
  return yiq >= 128 ? "#07150f" : "#fcf4ff";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [primaryColor, setPrimaryColorState] = useState("#1a016f");
  const [accentColor, setAccentColorState] = useState("#c5ffe5");
  const [useAccentHighlights, setUseAccentHighlightsState] = useState(true);
  const [reduceAnimations, setReduceAnimationsState] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("pref-theme") as Theme | null;
    const savedPrimary = localStorage.getItem("pref-primary-color");
    const savedAccent = localStorage.getItem("pref-accent-color");
    const savedHighlights = localStorage.getItem("pref-accent-highlights");
    const savedReduce = localStorage.getItem("pref-reduce-animations");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedTheme) setThemeState(savedTheme);
    if (savedPrimary && isValidHex(savedPrimary)) setPrimaryColorState(savedPrimary);
    if (savedAccent && isValidHex(savedAccent)) setAccentColorState(savedAccent);
    if (savedHighlights) setUseAccentHighlightsState(savedHighlights === "true");
    if (savedReduce) setReduceAnimationsState(savedReduce === "true");
  }, []);

  // Update localStorage and trigger react state
  const setTheme = (val: Theme) => {
    setThemeState(val);
    localStorage.setItem("pref-theme", val);
  };

  const setPrimaryColor = (val: string) => {
    if (isValidHex(val)) {
      setPrimaryColorState(val);
      localStorage.setItem("pref-primary-color", val);
    }
  };

  const setAccentColor = (val: string) => {
    if (isValidHex(val)) {
      setAccentColorState(val);
      localStorage.setItem("pref-accent-color", val);
    }
  };

  const setUseAccentHighlights = (val: boolean) => {
    setUseAccentHighlightsState(val);
    localStorage.setItem("pref-accent-highlights", String(val));
  };

  const setReduceAnimations = (val: boolean) => {
    setReduceAnimationsState(val);
    localStorage.setItem("pref-reduce-animations", String(val));
  };

  // Effect to apply Theme Class
  useEffect(() => {
    const applyTheme = (currentTheme: Theme) => {
      const root = document.documentElement;
      let isLight = false;
      if (currentTheme === "system") {
        isLight = !window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isLight = currentTheme === "light";
      }

      if (isLight) {
        root.classList.add("light");
      } else {
        root.classList.remove("light");
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme("system");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  // Effect to apply Color Variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary-value", primaryColor);
    root.style.setProperty("--color-accent-value", accentColor);

    if (useAccentHighlights) {
      root.style.setProperty("--color-ring-value", accentColor);
    } else {
      root.style.setProperty("--color-ring-value", primaryColor);
    }

    const accentFg = getContrastColor(accentColor);
    root.style.setProperty("--color-accent-foreground-value", accentFg);
  }, [primaryColor, accentColor, useAccentHighlights]);

  // Effect to apply Reduce Motion
  useEffect(() => {
    if (reduceAnimations) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [reduceAnimations]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        primaryColor,
        accentColor,
        useAccentHighlights,
        reduceAnimations,
        setTheme,
        setPrimaryColor,
        setAccentColor,
        setUseAccentHighlights,
        setReduceAnimations,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
