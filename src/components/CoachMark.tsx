import { motion } from "framer-motion";
import { TbX, TbBulb } from "react-icons/tb";

export function CoachMark({ steps, current, onNext, onDone }: {
  steps: { title: string; body: string }[];
  current: number;
  onNext: () => void;
  onDone: () => void;
}) {
  const s = steps[current];
  if (!s) return null;
  const isLast = current >= steps.length - 1;

  return (
    <motion.div key={current} className="z-coach" role="note"
      initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
      <div className="z-coach__head">
        <span className="z-ico z-ico--sm"><TbBulb size={15} /></span>
        <span className="z-coach__title">{s.title}</span>
        <button type="button" onClick={onDone} aria-label="Dismiss tip" className="z-coach__x"><TbX size={16} /></button>
      </div>
      <div className="z-coach__body">{s.body}</div>
      <div className="z-coach__foot">
        <span className="z-coach__dots" aria-label={`Tip ${current + 1} of ${steps.length}`}>
          {steps.map((_, i) => <i key={i} className={i === current ? "is-on" : ""} />)}
        </span>
        <button type="button" className="z-btn z-btn--solid" onClick={isLast ? onDone : onNext}>{isLast ? "Got it" : "Next"}</button>
      </div>
    </motion.div>
  );
}
