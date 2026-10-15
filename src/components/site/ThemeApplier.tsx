import { useEffect } from "react";
import { THEME_PRESETS, useTheme } from "@/lib/site-store";

/** Writes the chosen brand color into CSS variables so every button/badge/accent updates. */
export function ThemeApplier() {
  const [theme] = useTheme();
  useEffect(() => {
    const root = document.documentElement;
    const preset = THEME_PRESETS.find((p) => p.id === theme.preset);
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--ring", theme.primary);
    if (preset) root.style.setProperty("--background", preset.bg);
    else root.style.removeProperty("--background");
  }, [theme]);
  return null;
}
