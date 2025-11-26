"use client";

import { useEffect } from "react";
import { useAppData } from "@/lib/app-data-context";
import { KeeperTheme } from "@/types";

type ResolvedTheme = "light" | "dark";

function resolveColorScheme(preference: KeeperTheme, mediaQuery: MediaQueryList): ResolvedTheme {
  if (preference === "system") {
    return mediaQuery.matches ? "dark" : "light";
  }

  if (preference === "light") {
    return "light";
  }

  return "dark";
}

export function SettingsApplier() {
  const { data } = useAppData();

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (nextTheme: KeeperTheme) => {
      const resolved = resolveColorScheme(nextTheme, mediaQuery);
      root.dataset.theme = nextTheme === "system" ? resolved : nextTheme;
      root.classList.toggle("dark", resolved === "dark");
      root.classList.toggle("light", resolved === "light");
    };

    root.lang = data.settings.language;
    applyTheme(data.settings.theme);

    if (data.settings.theme === "system") {
      const listener = (event: MediaQueryListEvent) => applyTheme(event.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [data.settings.language, data.settings.theme]);

  return null;
}
