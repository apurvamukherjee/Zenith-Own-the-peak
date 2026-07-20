import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { TbHome2, TbBarbell, TbApple, TbBook2, TbChartHistogram, TbCheckbox } from "react-icons/tb";
import type { IconType } from "react-icons";

const items: { to: string; label: string; Icon: IconType }[] = [
  { to: "/", label: "Home", Icon: TbHome2 },
  { to: "/workout", label: "Train", Icon: TbBarbell },
  { to: "/nutrition", label: "Nutrition", Icon: TbApple },
  { to: "/tasks", label: "Tasks", Icon: TbCheckbox },
  { to: "/study", label: "Learn", Icon: TbBook2 },
  { to: "/profile", label: "Stats", Icon: TbChartHistogram },
];

export function BottomNav() {
  return (
    <nav
      className="altar-nav"
      style={{
        position: "sticky", bottom: 0, zIndex: 10,
        display: "flex", justifyContent: "space-around",
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === "/"}
          style={{ position: "relative", flex: 1, textAlign: "center", padding: "9px 0 11px", textDecoration: "none" }}>
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  style={{
                    position: "absolute", top: 4, left: "50%", marginLeft: -24,
                    width: 48, height: 30, borderRadius: 11,
                    background: "var(--accent)", opacity: 0.16, zIndex: 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              <motion.span
                animate={{ scale: isActive ? 1.06 : 1 }}
                style={{
                  position: "relative", zIndex: 1,
                  color: isActive ? "var(--accent)" : "var(--ink-soft)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  fontSize: 11, fontWeight: 600,
                }}
              >
                <Icon size={22} />
                {label}
              </motion.span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
