import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Input, Popconfirm } from "antd";
import { TbSnowflake, TbAlertTriangle, TbFirstAidKit } from "react-icons/tb";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useBackClose } from "../../hooks/useBackClose";
import { ARC_DAYS, ARC_END, FINAL_CALL_HOUR, drillAmount, minimumOf, formatFor, formatLabel, type Drill } from "../../lib/winterArc";
import { pauseDay, type ArcToday } from "./useWinterArc";

// "I am soft" only exists inside the opt-in swearing tier: a self-insult you
// don't believe makes the next day worse (Wood et al. 2009), a debt statement
// doesn't.
const PHRASE = "I'm skipping today. I owe one drill.";
const SOFT_PHRASE = "I am soft. I owe one drill.";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
export function ArcGate({ arc, onFinish }: { arc: ArcToday; onFinish: (d: Drill) => void }) {
  const profanity = Number(useSetting("arcProfanity")) === 1;
  const [skipping, setSkipping] = useState(false);
  const [typed, setTyped] = useState("");
  const [plan, setPlan] = useState("");
  const later = () => void setSetting("arcGateLater", `${arc.date}|${new Date().getHours()}`);
  useBackClose(true, later);

  const phrase = profanity ? SOFT_PHRASE : PHRASE;
  const canSkip = norm(typed) === norm(phrase) && plan.trim().length >= 8;
  const skip = async () => {
    await setSetting("arcIfThen", plan.trim());
    await setSetting("arcSkipped", arc.date);
  };
  const { drill } = arc;
  const format = formatLabel(formatFor(arc.date, drill), drill.unit);
  const finalCall = new Date().getHours() >= FINAL_CALL_HOUR;
  const navigate = useNavigate();
  // Dismiss for now (same as "Later today") so Back from /arc doesn't land on the gate again.
  const explain = () => { later(); navigate("/arc"); };

  return createPortal(
    <motion.div className="arc-gate" role="dialog" aria-modal="true" aria-labelledby="arc-gate-title"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="arc-gate__panel">
        <div className="arc-card__eyebrow"><TbSnowflake size={14} /> Winter Arc · Day {arc.day}/{ARC_DAYS}</div>
        <h2 id="arc-gate-title" className="arc-gate__title display">{finalCall ? "Final call." : "The drill comes first."}</h2>

        <div className="arc-gate__drill">
          <div className="arc-gate__name">{drill.name}</div>
          <div className="arc-card__stats">
            <span className="arc-card__amount">{drillAmount(drill)}</span>
            {drill.debtDays > 0 && <span className="arc-card__debt"><TbAlertTriangle size={13} /> {drill.debtDays}-day debt — clear it to re-link</span>}
          </div>
          {format && <div className="arc-card__format">{format}</div>}
        </div>

        <p className="arc-gate__why">
          {arc.date === ARC_END
            ? <>Last day — there's no tomorrow to repay it. Clear it and the arc is closed.{" "}</>
            : <>Clear it to keep the chain. Miss it and tomorrow's drill carries <b>+50%</b> to repay it; reserves cover what debt can't, anything left is a scar.{" "}</>}
          <button type="button" className="arc-card__link" onClick={explain}>How it works</button>
        </p>

        {!skipping ? (
          <>
            <motion.button type="button" className="arc-card__cta arc-gate__wide" whileTap={{ scale: 0.95 }} onClick={() => onFinish(drill)}>
              Done — I did it
            </motion.button>
            {drill.kind === "full" && (
              <button type="button" className="arc-card__ghost arc-gate__wide" onClick={() => onFinish(minimumOf(drill))}>
                5-min minimum · {drillAmount(minimumOf(drill))} (keeps the chain)
              </button>
            )}
            <div className="arc-gate__row">
              <button type="button" className="arc-card__link" onClick={later}>Later today</button>
              <button type="button" className="arc-card__link" onClick={() => setSkipping(true)}>Skip today</button>
              <Popconfirm title="Sick or injured today?" description="No miss, no debt." okText="Pause today" cancelText="Cancel"
                onConfirm={() => void pauseDay(arc.date)}>
                <button type="button" className="arc-card__link"><TbFirstAidKit size={13} /> Sick / injured</button>
              </Popconfirm>
            </div>
          </>
        ) : (
          <div className="arc-gate__skip">
            <label>
              <span>Type it to skip: <b>{phrase}</b></span>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" aria-label="Skip phrase" />
            </label>
            <label>
              <span>Tomorrow's plan — if what happens, then what will you do?</span>
              <Input.TextArea value={plan} onChange={(e) => setPlan(e.target.value)} autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="If I'm back late from class, I'll do the drill before dinner." aria-label="If-then plan" />
            </label>
            <div className="arc-gate__row">
              <button type="button" className="arc-card__ghost" disabled={!canSkip} onClick={() => void skip()}>Skip — it's a miss</button>
              <button type="button" className="arc-card__link" onClick={() => setSkipping(false)}>Back</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}
