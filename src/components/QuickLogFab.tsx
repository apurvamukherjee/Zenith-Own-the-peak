import { useState } from "react";
import { Modal, Button, InputNumber, App } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { TbDroplet, TbMeat, TbBarbell, TbMoon, TbGasStation, TbBolt, TbMicrophone } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { addWater } from "../features/water/useWater";
import { hapticLight } from "../lib/haptics";
import { VoiceLogModal } from "./VoiceLogModal";

const actions = [
  { key: "water", label: "Water", icon: TbDroplet, color: "var(--teal)" },
  { key: "voice", label: "Voice", icon: TbMicrophone, color: "var(--accent)" },
  { key: "meal", label: "Meal", icon: TbMeat, color: "var(--teal)" },
  { key: "workout", label: "Set", icon: TbBarbell, color: "var(--accent)" },
  { key: "sleep", label: "Sleep", icon: TbMoon, color: "var(--accent)" },
  { key: "fuel", label: "Fuel", icon: TbGasStation, color: "var(--gold)" },
];

export function QuickLogFab() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [ml, setMl] = useState(500);

  function handlePick(key: string) {
    setOpen(false);
    if (key === "water") { setWaterOpen(true); return; }
    if (key === "voice") { setVoiceOpen(true); return; }
    const routes: Record<string, string> = { meal: "/nutrition", workout: "/workout", sleep: "/sleep", fuel: "/fuel" };
    navigate(routes[key] ?? "/");
  }

  async function logWater() {
    await addWater(ml);
    hapticLight();
    message.success(`+${ml}ml logged`);
    setWaterOpen(false);
  }

  return (
    <>
      {/* FAB button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 72, right: 20, zIndex: 50,
          width: 52, height: 52, borderRadius: 16,
          background: "var(--accent)", color: "#fff", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(255,39,64,0.35)", cursor: "pointer",
          fontSize: 24,
        }}
        aria-label="Quick log"
      >
        <TbBolt />
      </motion.button>

      {/* Action sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)" }}>
            <motion.div
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                background: "var(--surface)", borderRadius: "20px 20px 0 0",
                padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 12px" }} />
              <button
                onClick={() => { setOpen(false); navigate("/quick"); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "10px 14px", marginBottom: 12,
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--ink)", fontWeight: 700, fontSize: 13,
                  cursor: "pointer",
                }}
                aria-label="Open quick log surface"
              >
                <TbBolt style={{ color: "var(--accent)" }} /> Open Quick log
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                {actions.map((a, i) => (
                  <motion.button key={a.key}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handlePick(a.key)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 8,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${a.color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <a.icon size={22} style={{ color: a.color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline water logger */}
      <Modal open={waterOpen} onCancel={() => setWaterOpen(false)} title="Quick water log" onOk={logWater} okText="Log">
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[250, 500, 750, 1000].map((v) => (
            <Button key={v} block type={ml === v ? "primary" : "default"} onClick={() => setMl(v)}>{v}ml</Button>
          ))}
        </div>
        <InputNumber inputMode="decimal" value={ml} onChange={(v) => setMl(v ?? 500)} min={50} step={50}
          style={{ width: "100%", marginTop: 10 }} suffix="ml" />
      </Modal>

      <VoiceLogModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </>
  );
}
