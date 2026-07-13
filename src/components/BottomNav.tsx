import { NavLink } from "react-router-dom";
import { HomeFilled, ThunderboltFilled, ReadFilled, DashboardFilled } from "@ant-design/icons";
import { VIOLET } from "../theme";

const items = [
  { to: "/", label: "Home", icon: <HomeFilled /> },
  { to: "/workout", label: "Train", icon: <ThunderboltFilled /> },
  { to: "/study", label: "Learn", icon: <ReadFilled /> },
  { to: "/fuel", label: "Fuel", icon: <span style={{ fontSize: 18 }}>🏍️</span> },
  { to: "/profile", label: "Stats", icon: <DashboardFilled /> },
];

export function BottomNav() {
  return (
    <nav
      style={{
        position: "sticky", bottom: 0, zIndex: 10,
        display: "flex", justifyContent: "space-around",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderTop: "1px solid #ecebf3",
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
            color: isActive ? VIOLET : "#9a96ab",
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
