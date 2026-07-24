import { useState } from "react";
import { Button, Input, InputNumber, Segmented } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { TbArrowRight, TbCheck } from "react-icons/tb";
import { setSetting } from "../../hooks/useSettings";

const steps = [
  { title: "What should we call you?", sub: "This is your personal tracker." },
  { title: "When do you wake up?", sub: "So we can pace your hydration." },
  { title: "Set your daily targets", sub: "You can change these anytime in Settings." },
];

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Apurva");
  const [wake, setWake] = useState(9);
  const [water, setWater] = useState(3500);
  const [protein, setProtein] = useState(100);

  async function finish() {
    await setSetting("name", name.trim() || "Apurva");
    await setSetting("wakeHour", wake);
    await setSetting("waterGoalMl", water);
    await setSetting("proteinTargetG", protein);
    await setSetting("onboarded", 1);
    onDone();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "var(--bg)",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 360, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img src="/logo-mark.png" alt="Zenith" width={44} height={44} style={{ objectFit: "contain" }} />
        </div>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= step ? "var(--accent)" : "var(--border)", transition: "background 0.3s" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <h2 className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{steps[step].title}</h2>
            <p style={{ color: "var(--ink-soft)", marginBottom: 24, fontSize: 14 }}>{steps[step].sub}</p>

            {step === 0 && (
              <Input size="large" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                style={{ fontSize: 18, fontWeight: 700 }} autoFocus />
            )}
            {step === 1 && (
              <Segmented block size="large" value={wake}
                onChange={(v) => setWake(v as number)}
                options={[6, 7, 8, 9, 10].map((h) => ({ label: `${h}:00`, value: h }))} />
            )}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Water goal (ml)</div>
                  <InputNumber inputMode="decimal" size="large" value={water} onChange={(v) => setWater(v ?? 3500)} step={250} min={1000} style={{ width: "100%" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Protein target (g)</div>
                  <InputNumber inputMode="decimal" size="large" value={protein} onChange={(v) => setProtein(v ?? 100)} step={10} min={30} style={{ width: "100%" }} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <Button type="text" onClick={() => { setSetting("onboarded", 1); onDone(); }}>Skip</Button>
          {step < 2 ? (
            <Button type="primary" size="large" icon={<TbArrowRight />} onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button type="primary" size="large" icon={<TbCheck />} onClick={finish}>Let's go</Button>
          )}
        </div>
      </div>
    </div>
  );
}
