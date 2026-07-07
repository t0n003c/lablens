"use client";

import { useEffect } from "react";
import { applyTheme, isThemeChoice, readStoredTheme, storeTheme } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const storedTheme = readStoredTheme();
    if (storedTheme) applyTheme(storedTheme);

    let cancelled = false;
    fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        const accountTheme = body.settings?.theme;
        if (!isThemeChoice(accountTheme) || cancelled) return;
        storeTheme(accountTheme);
        applyTheme(accountTheme);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
