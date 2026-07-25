"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const localHost =
      window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const previewParam = new URLSearchParams(window.location.search).get("app-preview");
    if (localHost && previewParam === "1") sessionStorage.setItem("vynta-app-preview", "1");
    if (localHost && previewParam === "0") sessionStorage.removeItem("vynta-app-preview");
    const localPreview =
      localHost &&
      (previewParam === "1" || sessionStorage.getItem("vynta-app-preview") === "1");
    const native = Capacitor.isNativePlatform() || localPreview;
    document.documentElement.classList.toggle("native-app", native);
    document.documentElement.dataset.platform = localPreview
      ? "preview"
      : native
        ? Capacitor.getPlatform()
        : "web";

    return () => {
      document.documentElement.classList.remove("native-app");
      delete document.documentElement.dataset.platform;
    };
  }, []);

  return children;
}
