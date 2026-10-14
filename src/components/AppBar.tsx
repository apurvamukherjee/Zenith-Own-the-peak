import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TbChevronLeft } from "react-icons/tb";
import { metaFor } from "../lib/routes";

// Back bar for secondary (non-tab) pages only. iOS large-title pattern: the
// page's own SectionTitle is the big title, and this bar's small centered
// copy only fades in once that has scrolled away — never two titles at once.
export function AppBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const meta = metaFor(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const on = () => setScrolled(main.scrollTop > 64);
    on();
    main.addEventListener("scroll", on, { passive: true });
    return () => main.removeEventListener("scroll", on);
  }, [pathname]);

  if (meta.tab) return null;

  return (
    <div className={`z-appbar${scrolled ? " is-scrolled" : ""}`}>
      <motion.button
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => nav(-1)} aria-label="Go back" className="z-appbar__back"
      >
        <TbChevronLeft size={22} />
      </motion.button>
      <div className="z-appbar__title" aria-hidden={!scrolled}>{meta.title}</div>
      <span className="z-appbar__spacer" />
    </div>
  );
}
