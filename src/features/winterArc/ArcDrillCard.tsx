import { useState } from "react";
import { motion } from "framer-motion";
import { App, Popconfirm } from "antd";
import { TbSnowflake, TbCheck, TbAlertTriangle, TbShieldHalf, TbFirstAidKit, TbSchool, TbHome } from "react-icons/tb";
import type { MuscleGroup } from "../../db/types";
import { setSetting, useSetting } from "../../hooks/useSettings";
import { hapticSuccess } from "../../lib/haptics";
import { todayKey } from "../../lib/date.utils";
import { ARC_DAYS, ARC_END, daysUntilArc, minimumOf, shiftDate, drillAmount as amount, ARC_RESERVES, shouldShowGate, type Drill, type Readiness } from "../../lib/winterArc";
import { useArcToday, completeDrill, pauseDay, setReadiness, type ArcToday } from "./useWinterArc";
import { ArcGate } from "./ArcGate";
import { ArcChecklist } from "./ArcChecklist";
import { ArcBossPanel } from "./ArcBossPanel";
import { ArcAfter } from "./ArcAfter";
import { ArcWrappedSheet } from "./ArcWrapped";
import { GAUNTLET } from "../../lib/arcCalendar";
import { VowSheet } from "./VowSheet";
import { parseVow } from "../../lib/arcChecklist";
import "./arc.css";

const PHASE_LABEL = { calibration: "Calibration", build: "Build", deload: "Deload", taper: "Taper", finale: "Finale" } as const;
const READINESS: { r: Readiness; label: string }[] = [{ r: "fine", label: "Fine" }, { r: "sore", label: "Sore" }, { r: "wrecked", label: "Wrecked" }];

export function ArcDrillCard({ trainedToday }: { trainedToday: MuscleGroup[] | undefined }) {
  const joined = useSetting("arcJoined");
  const reserves = useSetting("arcReserves");
  const signed = !!parseVow(String(useSetting("arcVow")));
  const [vowOpen, setVowOpen] = useState(false);
  const arc = useArcToday(trainedToday);
  const date = todayKey();
  // The post-arc card (Wrapped + 2027 handoff) stays up through January.
  if (date > ARC_END) return joined && date < "2027-02-01" ? <ArcAfter /> : null;

  const blackIce = Number(reserves) === 0;
  const join = async (r: number) => { await setSetting("arcReserves", r); await setSetting("arcJoined", date); setVowOpen(true); };
  const vow = vowOpen && <VowSheet onClose={() => setVowOpen(false)} />;
  const until = daysUntilArc(date);
  if (until > 0 || !joined) {
    return (
      <div className="arc-card">
        <div className="arc-card__eyebrow"><TbSnowflake size={14} /> Winter Arc · the final 61</div>
        <div className="arc-card__title display">{until > 0 ? `${until} day${until === 1 ? "" : "s"} out` : "It's already started"}</div>
        <p className="arc-card__copy">Nov 1 → Dec 31. One random drill a day. Miss one and you owe it. 3 reserves, no excuses.</p>
        {joined ? (
          <div className="arc-card__done">
            <TbCheck size={16} /> You're in{blackIce ? " — Black Ice" : ""}. Lock in.
            <button type="button" className="arc-card__link" onClick={() => setVowOpen(true)}>{signed ? "Edit vow" : "Sign your vow"}</button>
            {until > 0 && (
              <button type="button" className="arc-card__link" onClick={() => void setSetting("arcReserves", blackIce ? ARC_RESERVES : 0)}>
                {blackIce ? "Take the 3 reserves" : "Go Black Ice"}
              </button>
            )}
          </div>
        ) : (
          <div className="arc-card__actions">
            <motion.button type="button" className="arc-card__cta" whileTap={{ scale: 0.92 }}
              onClick={() => void join(ARC_RESERVES)}>Join the arc</motion.button>
            <button type="button" className="arc-card__ghost" onClick={() => void join(0)}>
              Black Ice · 0 reserves
            </button>
          </div>
        )}
        {vow}
      </div>
    );
  }

  if (!arc) return <div className="arc-card arc-card--loading" />;
  return (
    <>
      <ArcDay arc={arc} signed={signed} onVow={() => setVowOpen(true)} />
      <ArcChecklist date={arc.date} />
      {vow}
    </>
  );
}

function ArcDay({ arc, signed, onVow }: { arc: ArcToday; signed: boolean; onVow: () => void }) {
  const { drill, row } = arc;
  const done = row?.kind === "done";
  const { message } = App.useApp();
  const [wrapped, setWrapped] = useState(false);
  const later = String(useSetting("arcGateLater"));
  const skipped = String(useSetting("arcSkipped"));
  const blackIce = Number(useSetting("arcReserves")) === 0;
  const finish = (d: Drill) => {
    void completeDrill(arc, d).then((comeback) => {
      hapticSuccess();
      if (comeback) void message.success("Got back up. +15 XP — the chain re-links.");
    });
  };

  return (
    <div className={`arc-card${done ? " is-done" : ""}${row?.kind === "exempt" ? " is-exempt" : ""}`}>
      {shouldShowGate(arc.date, !!row, later, skipped, new Date().getHours()) && <ArcGate arc={arc} onFinish={finish} />}
      {wrapped && <ArcWrappedSheet onClose={() => setWrapped(false)} />}
      <div className="arc-card__eyebrow">
        <TbSnowflake size={14} /> Winter Arc · Day {arc.day}/{ARC_DAYS} · {PHASE_LABEL[arc.phase]}
      </div>
      {arc.gauntlet !== null && (
        <div className="arc-card__theme"><b>Festival Gauntlet</b> {arc.gauntlet}/{GAUNTLET.need} kept · Nov 8–19 · survive, don't thrive</div>
      )}
      {arc.theme && (
        <div className={`arc-card__theme${arc.theme.indoor ? " is-indoor" : ""}`}>
          <b>{arc.theme.indoor && <TbHome size={12} />} {arc.theme.title}</b> {arc.theme.copy}
          {arc.theme.examPrompt && !arc.exam && (
            <button type="button" className="arc-card__link" onClick={() => void setSetting("arcExamUntil", shiftDate(arc.date, 6))}>Turn on Exam Mode</button>
          )}
        </div>
      )}
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
            <div className="arc-card__done">
              <TbCheck size={16} /> {drill.kind === "full" ? "Drill cleared" : "Chain kept"}
              {arc.date === ARC_END && <button type="button" className="arc-card__link" onClick={() => setWrapped(true)}>Open your Wrapped</button>}
            </div>
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
      <ArcBossPanel date={arc.date} />
      <div className="arc-card__progress" aria-label={`Chapter ${arc.chapter.n}: ${arc.chapter.kept} of ${arc.chapter.days} kept`}>
        <span>Ch {arc.chapter.n}</span>
        <div className="arc-card__pips">
          {Array.from({ length: arc.chapter.days }, (_, i) => <i key={i} className={i < arc.chapter.kept ? "is-on" : ""} />)}
        </div>
        <span className="arc-card__total">{arc.kept + (signed ? 1 : 0)}/{ARC_DAYS + 1}{signed ? " · Day 0 ✓" : ""}</span>
      </div>
      <div className="arc-card__foot">
        <span><TbShieldHalf size={13} /> {blackIce ? "Black Ice" : `${arc.reservesLeft} reserve${arc.reservesLeft === 1 ? "" : "s"}`}</span>
        {skipped === arc.date && !row && <span>Skipped — you owe one</span>}
        <span>{arc.kept} kept</span>
        {arc.scars > 0 && <span>{arc.scars} scar{arc.scars === 1 ? "" : "s"}</span>}
        <button type="button" className="arc-card__link" onClick={onVow}>{signed ? "Vow" : "Sign your vow"}</button>
        <button type="button" className="arc-card__link" aria-pressed={arc.exam}
          onClick={() => void setSetting("arcExamUntil", arc.exam ? "" : shiftDate(arc.date, 6))}>
          <TbSchool size={13} /> {arc.exam ? "Exam Mode on · end it" : "Exam Mode"}
        </button>
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
