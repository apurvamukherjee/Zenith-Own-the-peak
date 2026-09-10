import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { TbDroplet, TbMoon, TbGasStation, TbChartLine, TbCalendar, TbWallet } from "react-icons/tb";

const chips = [
  { to: "/water", label: "Water", icon: TbDroplet },
  { to: "/sleep", label: "Sleep", icon: TbMoon },
  { to: "/fuel", label: "Fuel", icon: TbGasStation },
  { to: "/expenses", label: "Spend", icon: TbWallet },
  { to: "/progress", label: "Progress", icon: TbChartLine },
  { to: "/calendar", label: "Calendar", icon: TbCalendar },
];

// Module-level so it survives the strip unmounting/remounting between routes.
let savedScrollX = 0;

export function NavStrip() {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  // Restore the saved scroll offset when the strip mounts on a new page.
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = savedScrollX;
  }, [pathname]);

  // Hide on Home (has its own quick links) and on the pages already in the strip
  if (pathname === "/" || chips.some((c) => c.to === pathname)) return null;

  return (
    <div ref={ref} onScroll={(e) => { savedScrollX = e.currentTarget.scrollLeft; }}
      style={{ overflowX: "auto", whiteSpace: "nowrap", padding: "0 16px 8px",
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
