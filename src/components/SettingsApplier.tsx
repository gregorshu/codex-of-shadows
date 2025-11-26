"use client";

import { useEffect } from "react";
import { useAppData } from "@/lib/app-data-context";

type ResolvedTheme = "light" | "dark";

function resolveTheme(preference: "light" | "dark" | "system", mediaQuery: MediaQueryList): ResolvedTheme {
  if (preference === "system") {
    return mediaQuery.matches ? "dark" : "light";
  }
  return preference;
}

export function SettingsApplier() {
  const { data } = useAppData();

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (nextTheme: "light" | "dark" | "system") => {
      const resolved = resolveTheme(nextTheme, mediaQuery);
      root.dataset.theme = resolved;
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
