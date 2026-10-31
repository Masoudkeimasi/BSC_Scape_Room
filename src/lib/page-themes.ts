import type { CSSProperties } from "react";
export type PageTheme = {
  name: string;
  accent: string;
  base: string;
  surface: string;
  // Add the supplied photograph's local URL once the original file is available.
  photograph: string | null;
};
export const pageThemes: Record<string, PageTheme> = {
  home: {
    name: "Midnight teal",
    accent: "#a6efd9",
    base: "#071d21",
    surface: "#102c30",
    photograph: null,
  },
  mission: {
    name: "Indigo",
    accent: "#b8c5ff",
    base: "#10152e",
    surface: "#1b2441",
    photograph: null,
  },
  review: {
    name: "Sandstone",
    accent: "#ffe0a6",
    base: "#251d14",
    surface: "#33291e",
    photograph: null,
  },
  instructor: {
    name: "Slate blue",
    accent: "#bdd8f5",
    base: "#101e2b",
    surface: "#1c3042",
    photograph: null,
  },
  "room-1": {
    name: "Sapphire",
    accent: "#a9ceff",
    base: "#0b1c36",
    surface: "#162e4c",
    photograph: null,
  },
  "room-2": {
    name: "Treasury gold",
    accent: "#ffe0a1",
    base: "#251d0f",
    surface: "#352b1a",
    photograph: null,
  },
  "room-3": {
    name: "Cyan",
    accent: "#91eaff",
    base: "#07232d",
    surface: "#103641",
    photograph: null,
  },
  "room-4": {
    name: "Emerald",
    accent: "#9df0c5",
    base: "#09271d",
    surface: "#143c2d",
    photograph: null,
  },
  "room-5": {
    name: "Amethyst",
    accent: "#dcc2ff",
    base: "#211330",
    surface: "#352344",
    photograph: null,
  },
  "room-6": {
    name: "Copper",
    accent: "#ffc4ad",
    base: "#2c1714",
    surface: "#412620",
    photograph: null,
  },
};
export const designCredit =
  "Designed by Dr Masoud Keimasi for teaching purposes.";
export function themeStyle(theme: PageTheme) {
  return {
    "--page-accent": theme.accent,
    "--page-base": theme.base,
    "--page-surface": theme.surface,
    "--page-photo": theme.photograph ? `url("${theme.photograph}")` : "none",
  } as CSSProperties;
}
