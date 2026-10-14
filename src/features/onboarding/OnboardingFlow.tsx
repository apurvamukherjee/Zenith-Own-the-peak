import { useState } from "react";
import { Input } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { TbArrowRight, TbCheck, TbMinus, TbPlus, TbDroplet, TbMeat, TbSunrise } from "react-icons/tb";
import { Embers } from "../../components/ui/Hero";
import { setSetting } from "../../hooks/useSettings";
import { hapticLight } from "../../lib/haptics";
import "./onboarding.css";

const steps = [
  { title: "What should we call you?", sub: "This is your personal tracker — local, private, yours." },
  { title: "When do you wake up?", sub: "Hydration pace and reminders start from here." },
  { title: "Set your daily targets", sub: "Tune these anytime in Settings → Daily targets." },
];

function Stepper({ icon, label, value, unit, step, min, max, onChange }: {
  icon: React.ReactNode; label: string; value: number; unit: string; step: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const set = (v: number) => { onChange(Math.min(max, Math.max(min, v))); void hapticLight(); };
  return (
    <div className="ob-stepper">
      <div className="ob-stepper__label">{icon}{label}</div>
      <div className="ob-stepper__row">
        <button type="button" aria-label={`Less ${label}`} disabled={value <= min} onClick={() => set(value - step)}><TbMinus size={18} /></button>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.b key={value} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}>{value.toLocaleString()}<small>{unit}</small></motion.b>
        </AnimatePresence>
        <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => set(value + step)}><TbPlus size={18} /></button>
      </div>
    </div>
  );
}

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
    <div className="ob">
      <div className="ob__aura" aria-hidden />
      <Embers />
      <div className="ob__inner">
        <motion.img src="/logo-mark.png" alt="Zenith" width={52} height={52} className="ob__logo"
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} />
        <div className="ob__progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => <i key={i}><motion.span initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }} /></i>)}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <h2 className="display ob__title">{steps[step].title}</h2>
            <p className="ob__sub">{steps[step].sub}</p>

            {step === 0 && (
              <Input size="large" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                className="ob__name" autoFocus maxLength={24} onPressEnter={() => setStep(1)} />
            )}
            {step === 1 && (
              <div className="ob__hours" role="radiogroup" aria-label="Wake-up hour">
                {[5, 6, 7, 8, 9, 10, 11].map((h) => (
                  <button key={h} type="button" role="radio" aria-checked={wake === h} className={wake === h ? "is-on" : ""} onClick={() => { setWake(h); void hapticLight(); }}>
                    {wake === h && <motion.span layoutId="ob-hour" className="ob__hour-bg" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
                    <span className="ob__hour-label"><TbSunrise size={14} /> {String(h).padStart(2, "0")}:00</span>
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="ob__targets">
                <Stepper icon={<TbDroplet size={15} />} label="Water" value={water} unit=" ml" step={250} min={1000} max={6000} onChange={setWater} />
                <Stepper icon={<TbMeat size={15} />} label="Protein" value={protein} unit=" g" step={5} min={30} max={300} onChange={setProtein} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="ob__nav">
          <button type="button" className="z-btn z-btn--ghost" onClick={() => { void setSetting("onboarded", 1); onDone(); }}>Skip</button>
          {step < 2 ? (
            <button type="button" className="z-btn z-btn--solid ob__next" onClick={() => setStep(step + 1)}>Next <TbArrowRight size={17} /></button>
          ) : (
            <button type="button" className="z-btn z-btn--solid ob__next" onClick={finish}><TbCheck size={17} /> Let's go</button>
          )}
        </div>
      </div>
    </div>
  );
}
