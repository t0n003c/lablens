export type ThemeChoice = "system" | "light" | "dark";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

export function applyTheme(theme: ThemeChoice) {
  if (typeof document === "undefined") return;
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    return;
  }
  document.documentElement.dataset.theme = theme;
}

export function readStoredTheme() {
  try {
    const theme = window.localStorage.getItem("lablens-theme");
    return isThemeChoice(theme) ? theme : undefined;
  } catch {
    return undefined;
  }
}

export function storeTheme(theme: ThemeChoice) {
  try {
    window.localStorage.setItem("lablens-theme", theme);
  } catch {
    return;
  }
}
