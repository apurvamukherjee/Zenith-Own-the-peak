import { useEffect, useState } from "react";
import { Button } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { TbDeviceMobile, TbX } from "react-icons/tb";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Shows a subtle "install to home screen" prompt on second launch. Uses the
// browser's beforeinstallprompt event where available (Chrome/Edge/Android).
// Dismissed decisions are remembered in Dexie's settings so we don't nag.
export function PwaInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("zenith:pwa-dismissed");
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("zenith:pwa-dismissed", "1");
  }
  async function install() {
    if (!event) return;
    await event.prompt();
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          style={{ position: "fixed", bottom: 120, left: 16, right: 16, zIndex: 40,
            background: "var(--surface)", borderRadius: 14, padding: "12px 14px",
            border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", gap: 12 }}>
          <TbDeviceMobile size={22} style={{ color: "var(--accent)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Install Zenith</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Add to your home screen for a native feel.</div>
          </div>
          <Button type="primary" size="small" onClick={install}>Install</Button>
          <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}><TbX /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
