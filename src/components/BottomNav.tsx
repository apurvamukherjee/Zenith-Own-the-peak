import { NavLink } from "react-router-dom";
import { HomeFilled, ThunderboltFilled, ReadFilled, DashboardFilled } from "@ant-design/icons";

const items = [
  { to: "/", label: "Home", icon: <HomeFilled /> },
  { to: "/workout", label: "Train", icon: <ThunderboltFilled /> },
  { to: "/nutrition", label: "Fuel", icon: <span style={{ fontSize: 18 }}>🍽️</span> },
  { to: "/study", label: "Learn", icon: <ReadFilled /> },
  { to: "/profile", label: "Stats", icon: <DashboardFilled /> },
];

export function BottomNav() {
  return (
    <nav
      style={{
        position: "sticky", bottom: 0, zIndex: 10,
        display: "flex", justifyContent: "space-around",
        background: "var(--nav-bg)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          style={({ isActive }) => ({
            flex: 1, textAlign: "center", padding: "10px 0 12px",
            color: isActive ? "var(--accent)" : "var(--ink-soft)",
            fontSize: 11, fontWeight: 600, textDecoration: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          })}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{it.icon}</span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
