import { theme as antdTheme, type ThemeConfig } from "antd";

const shared = {
  borderRadius: 14,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSizeHeading2: 26,
  controlHeight: 40,
};
const components = {
  Card: { borderRadiusLG: 18, paddingLG: 18 },
  Button: { fontWeight: 600, borderRadius: 12, controlHeight: 44 },
  InputNumber: { controlHeight: 44 },
  Segmented: { borderRadius: 12 },
};

export type Mode = "light" | "dark";

export function getTheme(mode: Mode): ThemeConfig {
  const base: ThemeConfig = {
    // CSS-variable mode: AntD writes tokens as real CSS custom properties instead
    // of baking hex values into per-theme class hashes. Combined with the CSS
    // transition rule in index.css, this is what makes dark/light actually
    // *animate* instead of instantly swapping ("blinking").
    cssVar: { key: "zenith" },
    hashed: false,
  };
  if (mode === "dark") {
    return {
      ...base,
      algorithm: antdTheme.darkAlgorithm,
      token: {
        ...shared,
        colorPrimary: "#ff2740",
        colorInfo: "#ff2740",
        colorSuccess: "#37d67a",
        colorWarning: "#f6b93b",
        colorError: "#ff5c7a",
        colorBgLayout: "#08080a",
        colorBgContainer: "#16131a",
        colorBgElevated: "#1c1822",
        colorBorderSecondary: "#2a2330",
        colorTextHeading: "#f3eef2",
      },
      components,
    };
  }
  return {
    ...base,
    token: {
      ...shared,
      colorPrimary: "#c8112a",
      colorInfo: "#c8112a",
      colorSuccess: "#12b3a1",
      colorWarning: "#b8860b",
      colorError: "#c8112a",
      colorBgLayout: "#f5f0f0",
      colorTextHeading: "#1a0f13",
    },
    components,
  };
}

// For style props (color/background) these CSS vars flip with [data-theme].
export const VIOLET = "var(--accent)";
export const TEAL = "var(--teal)";
export const GOLD = "var(--gold)";

// Concrete hexes for contexts where CSS vars don't resolve (recharts SVG attrs).
export const TOKENS = {
  light: { accent: "#c8112a", teal: "#d05018", gold: "#b8860b", danger: "#ff5c7a", grid: "rgba(140,90,95,0.18)" },
  dark: { accent: "#ff2740", teal: "#ff6b3d", gold: "#f6b93b", danger: "#ff5c7a", grid: "rgba(180,160,170,0.14)" },
};
