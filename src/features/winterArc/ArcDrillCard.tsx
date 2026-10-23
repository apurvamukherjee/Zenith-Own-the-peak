import { motion } from "framer-motion";
import { App, Popconfirm } from "antd";
import { TbSnowflake, TbCheck, TbAlertTriangle, TbShieldHalf, TbFirstAidKit } from "react-icons/tb";
import type { MuscleGroup } from "../../db/types";
import { setSetting, useSetting } from "../../hooks/useSettings";
import { hapticSuccess } from "../../lib/haptics";
import { todayKey } from "../../lib/date.utils";
import { ARC_DAYS, ARC_END, daysUntilArc, minimumOf, shiftDate, drillAmount as amount, shouldShowGate, type Drill, type Readiness } from "../../lib/winterArc";
import { useArcToday, completeDrill, pauseDay, setReadiness, type ArcToday } from "./useWinterArc";
import { ArcGate } from "./ArcGate";
import "./arc.css";

const PHASE_LABEL = { calibration: "Calibration", build: "Build", deload: "Deload", taper: "Taper", finale: "Finale" } as const;
const READINESS: { r: Readiness; label: string }[] = [{ r: "fine", label: "Fine" }, { r: "sore", label: "Sore" }, { r: "wrecked", label: "Wrecked" }];

export function ArcDrillCard({ trainedToday }: { trainedToday: MuscleGroup[] | undefined }) {
  const joined = useSetting("arcJoined");
  const arc = useArcToday(trainedToday);
  const date = todayKey();
  if (date > ARC_END) return null;

  const until = daysUntilArc(date);
  if (until > 0 || !joined) {
    return (
      <div className="arc-card">
        <div className="arc-card__eyebrow"><TbSnowflake size={14} /> Winter Arc · the final 61</div>
        <div className="arc-card__title display">{until > 0 ? `${until} day${until === 1 ? "" : "s"} out` : "It's already started"}</div>
        <p className="arc-card__copy">Nov 1 → Dec 31. One random drill a day. Miss one and you owe it. 3 reserves, no excuses.</p>
        {joined
          ? <div className="arc-card__done"><TbCheck size={16} /> You're in. Lock in.</div>
          : <motion.button type="button" className="arc-card__cta" whileTap={{ scale: 0.92 }}
              onClick={() => void setSetting("arcJoined", date)}>Join the arc</motion.button>}
      </div>
    );
  }

  if (!arc) return <div className="arc-card arc-card--loading" />;
  return <ArcDay arc={arc} />;
}

function ArcDay({ arc }: { arc: ArcToday }) {
  const { drill, row } = arc;
  const done = row?.kind === "done";
  const { message } = App.useApp();
  const later = String(useSetting("arcGateLater"));
  const skipped = String(useSetting("arcSkipped"));
  const finish = (d: Drill) => {
    void completeDrill(arc, d).then((comeback) => {
      hapticSuccess();
      if (comeback) void message.success("Got back up. +15 XP — the chain re-links.");
    });
  };

  return (
    <div className={`arc-card${done ? " is-done" : ""}${row?.kind === "exempt" ? " is-exempt" : ""}`}>
      {shouldShowGate(arc.date, !!row, later, skipped, new Date().getHours()) && <ArcGate arc={arc} onFinish={finish} />}
      <div className="arc-card__eyebrow">
        <TbSnowflake size={14} /> Winter Arc · Day {arc.day}/{ARC_DAYS} · {PHASE_LABEL[arc.phase]}
      </div>
      {row?.kind === "exempt" ? (
        <>
          <div className="arc-card__title display">Paused</div>
          <p className="arc-card__copy">Sick or hurt days don't count against you. Rest up — the arc waits.</p>
        </>
      ) : (
        <>
          <div className="arc-card__title display">{drill.name}</div>
          <div className="arc-card__stats">
            <span className="arc-card__amount">{amount(drill)}</span>
            {drill.debtDays > 0 && <span className="arc-card__debt"><TbAlertTriangle size={13} /> {drill.debtDays}-day debt</span>}
          </div>
          {done ? (
            <div className="arc-card__done"><TbCheck size={16} /> {drill.kind === "full" ? "Drill cleared" : "Chain kept"}</div>
          ) : (
            <>
              <div className="arc-card__ready" role="radiogroup" aria-label="How do you feel">
                {READINESS.map(({ r, label }) => (
                  <button key={r} type="button" role="radio" aria-checked={arc.readiness === r}
                    className={arc.readiness === r ? "is-on" : ""} onClick={() => void setReadiness(arc.date, r)}>{label}</button>
                ))}
              </div>
              <div className="arc-card__actions">
                <motion.button type="button" className="arc-card__cta" whileTap={{ scale: 0.92 }} onClick={() => finish(drill)}>Done</motion.button>
                {drill.kind === "full" && (
                  <button type="button" className="arc-card__ghost" onClick={() => finish(minimumOf(drill))}>
                    5-min minimum · {amount(minimumOf(drill))}
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
      <div className="arc-card__foot">
        <span><TbShieldHalf size={13} /> {arc.reservesLeft} reserve{arc.reservesLeft === 1 ? "" : "s"}</span>
        <span>{arc.kept} kept</span>
        {arc.scars > 0 && <span>{arc.scars} scar{arc.scars === 1 ? "" : "s"}</span>}
        {!row && (
          <Popconfirm title="Sick or injured today?" description="No miss, no debt." okText="Pause today" cancelText="Cancel"
            onConfirm={() => void pauseDay(arc.date)}>
            <button type="button" className="arc-card__link"><TbFirstAidKit size={13} /> Sick / injured</button>
          </Popconfirm>
        )}
        {arc.missed > 0 && (
          <Popconfirm title="Were you sick yesterday?" description="Marks yesterday as paused instead of missed." okText="Pause yesterday" cancelText="Cancel"
            onConfirm={() => void pauseDay(shiftDate(arc.date, -1))}>
            <button type="button" className="arc-card__link">Sick yesterday</button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
}
