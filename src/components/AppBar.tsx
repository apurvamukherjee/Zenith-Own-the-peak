import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TbChevronLeft } from "react-icons/tb";
import { metaFor } from "../lib/routes";

// Back-navigation bar for secondary (non-tab) pages only — tab pages (Home,
// Train, etc.) render nothing here. No longer sticky: scrolls away with the
// page instead of pinning to the top. The dark/light toggle that used to live
// here now lives only in Settings → Appearance.
export function AppBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const meta = metaFor(pathname);

  if (meta.tab) return null;

  return (
    <div
      style={{
        height: 48,
        display: "flex", alignItems: "center", gap: 6, padding: "0 8px",
        background: "var(--nav-bg)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
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
    </div>
  );
}
