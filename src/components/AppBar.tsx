import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TbChevronLeft, TbSun, TbMoon } from "react-icons/tb";
import { metaFor } from "../lib/routes";
import { useSetting, setSetting } from "../hooks/useSettings";

// Slim persistent top bar. Back button appears only on secondary (non-tab) pages.
// Dark/light toggle always visible at the right edge.
export function AppBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const meta = metaFor(pathname);
  const showBack = !meta.tab;
  const themeMode = useSetting("themeMode") as "dark" | "light" | "system";
  const resolved = themeMode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : themeMode;

  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 15, height: 48,
        display: "flex", alignItems: "center", gap: 6, padding: "0 8px",
        background: "var(--nav-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <AnimatePresence mode="wait">
        {showBack && (
          <motion.button
            key="back"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            onClick={() => nav(-1)}
            aria-label="Go back"
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              color: "var(--violet)", fontSize: 15, fontWeight: 600, padding: "6px 8px",
            }}
          >
            <TbChevronLeft /> {meta.title}
          </motion.button>
        )}
      </AnimatePresence>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => setSetting("themeMode", resolved === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        style={{
          border: "none", background: "transparent", cursor: "pointer",
          color: "var(--ink-soft)", padding: "6px 8px", display: "flex", alignItems: "center",
        }}
      >
        {resolved === "dark" ? <TbSun size={18} /> : <TbMoon size={18} />}
      </button>
    </div>
  );
}
