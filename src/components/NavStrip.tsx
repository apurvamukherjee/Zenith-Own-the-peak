import { Link, useLocation } from "react-router-dom";
import { TbDroplet, TbMoon, TbGasStation, TbChartLine } from "react-icons/tb";

const chips = [
  { to: "/water", label: "Water", icon: TbDroplet },
  { to: "/sleep", label: "Sleep", icon: TbMoon },
  { to: "/fuel", label: "Fuel", icon: TbGasStation },
  { to: "/progress", label: "Progress", icon: TbChartLine },
];

export function NavStrip() {
  const { pathname } = useLocation();
  // Hide on the pages that ARE in the strip
  if (chips.some((c) => c.to === pathname)) return null;

  return (
    <div style={{ overflowX: "auto", whiteSpace: "nowrap", padding: "0 16px 8px",
      display: "flex", gap: 6, WebkitOverflowScrolling: "touch" }}>
      {chips.map((c) => (
        <Link key={c.to} to={c.to} style={{ textDecoration: "none" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 10,
            background: "var(--surface)", border: "1px solid var(--border)",
            fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", whiteSpace: "nowrap",
          }}>
            <c.icon size={14} /> {c.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
