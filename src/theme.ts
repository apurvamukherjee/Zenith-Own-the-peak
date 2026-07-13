import type { ThemeConfig } from "antd";

// Fun, modern token set layered on Ant Design. Boldness spent on the accent
// and radii; everything else stays calm.
export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: "#7c5cfc",
    colorInfo: "#7c5cfc",
    colorSuccess: "#12b3a1",
    colorWarning: "#ffb020",
    colorError: "#ff5c7a",
    borderRadius: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    fontSizeHeading2: 26,
    colorBgLayout: "#f5f5fb",
    colorTextHeading: "#16131f",
    controlHeight: 40,
  },
  components: {
    Card: { borderRadiusLG: 18, paddingLG: 18 },
    Button: { fontWeight: 600, borderRadius: 12, controlHeight: 44 },
    InputNumber: { controlHeight: 44 },
    Segmented: { borderRadius: 12 },
  },
};

export const GOLD = "#ffb020";
export const VIOLET = "#7c5cfc";
export const TEAL = "#12b3a1";
