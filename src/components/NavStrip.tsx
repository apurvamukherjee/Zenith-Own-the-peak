import { useEffect, useRef, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { TbDroplet, TbMoon, TbGasStation, TbChartLine, TbCalendar, TbWallet, TbFlame } from "react-icons/tb";

const chips = [
  { to: "/water", label: "Water", icon: TbDroplet, c: "var(--info)" },
  { to: "/sleep", label: "Sleep", icon: TbMoon, c: "var(--gold)" },
  { to: "/fuel", label: "Fuel", icon: TbGasStation, c: "var(--gold)" },
  { to: "/expenses", label: "Spend", icon: TbWallet, c: "var(--success)" },
  { to: "/habits", label: "Habits", icon: TbFlame, c: "var(--accent)" },
  { to: "/progress", label: "Progress", icon: TbChartLine, c: "var(--teal)" },
  { to: "/calendar", label: "Calendar", icon: TbCalendar, c: "var(--accent)" },
];

// Module-level so it survives the strip unmounting/remounting between routes.
let savedScrollX = 0;

export function NavStrip() {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = savedScrollX;
  }, [pathname]);

  // Hidden on Home (has its own shortcuts) and on the pages already in the strip.
  if (pathname === "/" || chips.some((c) => c.to === pathname)) return null;

  return (
    <nav ref={ref} className="z-navstrip" aria-label="Modules" onScroll={(e) => { savedScrollX = e.currentTarget.scrollLeft; }}>
      {chips.map((c) => (
        <Link key={c.to} to={c.to} className="z-navstrip__chip" style={{ "--c": c.c } as CSSProperties}>
          <c.icon size={15} /> {c.label}
        </Link>
      ))}
    </nav>
  );
}
