import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, InputNumber, Modal, App } from "antd";
import { motion } from "framer-motion";
import { TbDroplet, TbMeat, TbBarbell, TbMoon, TbBolt } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { addWater } from "../water/useWater";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useSetting } from "../../hooks/useSettings";
import { useBackClose } from "../../hooks/useBackClose";
import { useIsMobile } from "../../hooks/useIsMobile";

// Two-tap logging surface. Designed to be the deep-link target of a
// homescreen shortcut / PWA icon — big buttons, no scrolling on a phone,
// zero-chrome. From here, water logs inline via a mini modal (2 taps:
// open → confirm), the others jump to their pages.
export function QuickLogPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const waterGoal = useSetting("waterGoalMl");
  const [waterOpen, setWaterOpen] = useState(false);
  const [ml, setMl] = useState(500);
  useBackClose(waterOpen, () => setWaterOpen(false));
  const isMobile = useIsMobile();

  async function logWater() {
    await addWater(ml);
    hapticSuccess();
    message.success(`+${ml}ml water logged`);
    setWaterOpen(false);
  }

  const actions: Array<{
    key: string; label: string; hint: string;
    icon: typeof TbDroplet; grad: string; onClick: () => void;
  }> = [
    {
      key: "water", label: "Water", hint: `Goal ${(waterGoal / 1000).toFixed(1)}L`,
      icon: TbDroplet,
      grad: "linear-gradient(135deg,#0f2a34 0%,#1a5e6a 100%)",
      onClick: () => { hapticLight(); setWaterOpen(true); },
    },
    {
      key: "meal", label: "Meal", hint: "Log food",
      icon: TbMeat,
      grad: "linear-gradient(135deg,#3a0b12 0%,#8a1c2a 100%)",
      onClick: () => { hapticLight(); navigate("/nutrition"); },
    },
    {
      key: "set", label: "Set", hint: "Log a workout set",
      icon: TbBarbell,
      grad: "linear-gradient(135deg,#0d0709 0%,#3f0b15 100%)",
      onClick: () => { hapticLight(); navigate("/workout"); },
    },
    {
      key: "sleep", label: "Sleep", hint: "Log last night",
      icon: TbMoon,
      grad: "linear-gradient(135deg,#0c1224 0%,#2a2160 100%)",
      onClick: () => { hapticLight(); navigate("/sleep"); },
    },
  ];

  return (
    <PageTransition>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <TbBolt size={22} style={{ color: "var(--accent)" }} />
          <span className="display" style={{ fontSize: 24, fontWeight: 800 }}>Quick log</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
          Two taps. Nothing else.
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        marginTop: 6, marginBottom: 4,
      }}>
        {actions.map((a, i) => (
          <motion.button
            key={a.key}
            onClick={a.onClick}
            aria-label={`Log ${a.label}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              aspectRatio: "1 / 1",
              minHeight: 140,
              padding: 18,
              borderRadius: 22,
              border: "1px solid var(--border)",
              background: a.grad,
              color: "#fff",
              display: "flex", flexDirection: "column",
              alignItems: "flex-start", justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 8px 26px rgba(0,0,0,0.28)",
              textAlign: "left",
            }}
          >
            <a.icon size={34} />
            <div style={{ marginTop: "auto" }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.3 }}>{a.label}</div>
              <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600 }}>{a.hint}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <Button type="link" onClick={() => navigate("/")}>← Back to dashboard</Button>
      </div>

      <Modal
        open={waterOpen}
        onCancel={() => setWaterOpen(false)}
        onOk={logWater}
        okText={`Log ${ml}ml`}
        title="Quick water log"
        centered={!isMobile}
        styles={isMobile ? {
          content: { borderRadius: "20px 20px 0 0", padding: 20 },
          mask: { background: "rgba(0,0,0,0.55)" },
        } : undefined}
      >
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {[250, 500, 750, 1000].map((v) => (
            <Button
              key={v} block
              type={ml === v ? "primary" : "default"}
              onClick={() => setMl(v)}
              style={{ flex: 1, minWidth: 68 }}
            >
              {v}ml
            </Button>
          ))}
        </div>
        <InputNumber
          inputMode="decimal"
          value={ml} onChange={(v) => setMl(v ?? 500)}
          min={50} step={50}
          style={{ width: "100%", marginTop: 10 }}
          suffix="ml"
        />
      </Modal>
    </PageTransition>
  );
}
