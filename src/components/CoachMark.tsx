import { useState } from "react";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { TbX, TbBulb } from "react-icons/tb";
import { db } from "../db/db";
import { setSetting, type SettingKey } from "../hooks/useSettings";

type Step = { title: string; body: string };

/**
 * First-visit tips for a page, dismissed for good via a `coach*` setting.
 * Waits for the setting to load before rendering: seeding local step state
 * from useSetting() read the DEFAULT (0 = not seen) on the first render, so
 * a dismissed tip came back on every visit.
 */
export function CoachTips({ settingKey, steps, hidden }: { settingKey: SettingKey; steps: Step[]; hidden?: boolean }) {
  // null while loading — never confuse "loading" with "not seen yet".
  const seen = useLiveQuery(async () => Number((await db.settings.get(settingKey))?.value ?? 0), [settingKey]) ?? null;
  const [step, setStep] = useState(0);
  if (hidden || seen === null || seen) return null;
  return (
    <CoachMark steps={steps} current={step}
      onNext={() => setStep((s) => s + 1)}
      onDone={() => void setSetting(settingKey, 1)} />
  );
}

export function CoachMark({ steps, current, onNext, onDone }: {
  steps: Step[];
  current: number;
  onNext: () => void;
  onDone: () => void;
}) {
  const s = steps[current];
  if (!s) return null;
  const isLast = current >= steps.length - 1;

  return (
    <motion.div key={current} className="z-coach" role="note"
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}>
      <span className="z-coach__ico" aria-hidden><TbBulb size={15} /></span>
      <div className="z-coach__text">
        <span className="z-coach__title">{s.title}</span>
        <span className="z-coach__body">{s.body}</span>
        <div className="z-coach__foot">
          {steps.length > 1 && (
            <span className="z-coach__dots" aria-label={`Tip ${current + 1} of ${steps.length}`}>
              {steps.map((_, i) => <i key={i} className={i === current ? "is-on" : ""} />)}
            </span>
          )}
          <button type="button" className="z-coach__next" onClick={isLast ? onDone : onNext}>{isLast ? "Got it" : "Next tip"}</button>
        </div>
      </div>
      <button type="button" onClick={onDone} aria-label="Dismiss tips" className="z-coach__x"><TbX size={16} /></button>
    </motion.div>
  );
}
