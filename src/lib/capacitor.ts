"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App as CapacitorApp } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";

export function useNativeFeatures() {
  const [isNative, setIsNative] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (!native) return;

    SplashScreen.hide().catch(() => {});

    StatusBar.setStyle({ style: Style.Default }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#f6f4f1" }).catch(() => {});

    const networkListener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected);
    });

    Network.getStatus().then((status) => setIsOnline(status.connected));

    const appListener = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
    });

    Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});

    return () => {
      networkListener.then((l) => l.remove());
      appListener.then((l) => l.remove());
    };
  }, []);

  return { isNative, isOnline };
}

export async function setStatusBarDark(isDark: boolean) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDark ? "#050505" : "#f6f4f1" });
  } catch {}
}

export async function nativeHaptic() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function saveSessionNative(key: string, value: string) {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(key, value);
    return;
  }
  try {
    await Preferences.set({ key, value });
  } catch {
    localStorage.setItem(key, value);
  }
}

export async function getSessionNative(key: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return localStorage.getItem(key);
  }
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return localStorage.getItem(key);
  }
}

export async function removeSessionNative(key: string) {
  if (!Capacitor.isNativePlatform()) {
    localStorage.removeItem(key);
    return;
  }
  try {
    await Preferences.remove({ key });
  } catch {
    localStorage.removeItem(key);
  }
}
