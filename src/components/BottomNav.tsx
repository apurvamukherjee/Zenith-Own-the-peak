import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { TbHome2, TbBarbell, TbApple, TbBook2, TbChartHistogram } from "react-icons/tb";
import type { IconType } from "react-icons";
import { hapticLight } from "../lib/haptics";

// Tasks tab hidden per product decision — feature/route/data untouched, just
// not surfaced in nav. Re-add `{ to: "/tasks", label: "Tasks", Icon: TbCheckbox }`
// (between Nutrition and Learn) to bring it back.
const items: { to: string; label: string; Icon: IconType }[] = [
  { to: "/", label: "Home", Icon: TbHome2 },
  { to: "/workout", label: "Train", Icon: TbBarbell },
  { to: "/nutrition", label: "Nutrition", Icon: TbApple },
  { to: "/study", label: "Learn", Icon: TbBook2 },
  { to: "/profile", label: "Stats", Icon: TbChartHistogram },
];

// Floating glass dock. Fixed (not sticky) so it never depends on ancestor flex
// sizing; indicator is a single transform-translated element (compositor-only)
// instead of a framer layoutId, which can mis-measure during route/resize changes.
export function BottomNav() {
  const { pathname } = useLocation();
  const active = items.findIndex((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)));

  // Hide while typing: on mobile browsers the on-screen keyboard otherwise
  // drags a fixed bar on top of the focused field.
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    const on = (e: FocusEvent) => setTyping(isField(e.target));
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => { document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
  }, []);

  return (
    <nav className={`dock${typing ? " dock--hidden" : ""}`} aria-label="Primary">
      <div className="dock__track">
        <span
          aria-hidden
          className="dock__indicator"
          style={{ transform: `translateX(${Math.max(active, 0) * 100}%)`, opacity: active < 0 ? 0 : 1 }}
        />
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className="dock__item" onClick={() => void hapticLight()}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
