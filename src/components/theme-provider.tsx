"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "vynta-theme";

type ThemeContextValue = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored || "dark";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("vynta-theme-change", handler);
  return () => window.removeEventListener("vynta-theme-change", handler);
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("vynta-theme-change"));
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, getTheme, () => "dark");
  const resolved = resolveTheme(theme);

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    notify();
  };

  const toggle = () => setTheme(resolved === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
