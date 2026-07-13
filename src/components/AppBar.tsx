import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LeftOutlined } from "@ant-design/icons";
import { metaFor } from "../lib/routes";

// Slim persistent top bar. Back button appears only on secondary (non-tab) pages.
export function AppBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const meta = metaFor(pathname);
  const showBack = !meta.tab;

  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 15, height: 48,
        display: "flex", alignItems: "center", gap: 6, padding: "0 8px",
        background: "rgba(245,245,251,0.85)", backdropFilter: "blur(12px)",
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
            <LeftOutlined /> {meta.title}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
