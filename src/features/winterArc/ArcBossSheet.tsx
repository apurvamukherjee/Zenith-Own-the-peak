import { useEffect, useRef, useState } from "react";
import { App, InputNumber, Segmented } from "antd";
import { TbPlayerPlayFilled, TbPlayerPauseFilled, TbRefresh, TbCards, TbSwords } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { playBellDing, playTick } from "../../lib/audio";
import { fmtMinSec } from "../../lib/date.utils";
import { type BossDef, type MurphTier, deck, murphPlan, PLANK_CAP_SEC } from "../../lib/arcBosses";
import { saveBossScore, saveTrial, finishMurph, type ArcBossState } from "./useArcBosses";

export type BossMode = { type: "boss"; boss: BossDef } | { type: "trial"; n: number } | { type: "murph" };

// Wall-clock based so a backgrounded tab doesn't drift; ticks on each new minute.
function BossTimer({ minutes, deathBy }: { minutes?: number; deathBy?: boolean }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [banked, setBanked] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const iv = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(iv);
  }, [startedAt]);
  const sec = Math.floor((banked + (startedAt !== null ? now - startedAt : 0)) / 1000);
  const total = minutes ? minutes * 60 : 0;
  const over = !!total && sec >= total;
  const minute = Math.floor(sec / 60) + 1;

  const lastMinute = useRef(1);
  useEffect(() => {
    if (startedAt === null) return;
    if (over) { playBellDing(); hapticSuccess(); setBanked(total * 1000); setStartedAt(null); return; }
    if (minute !== lastMinute.current) { lastMinute.current = minute; playTick(); hapticLight(); }
  }, [minute, over, startedAt, total]);

  const toggle = () => {
    if (startedAt === null) { setStartedAt(Date.now()); setNow(Date.now()); }
    else { setBanked((b) => b + Date.now() - startedAt); setStartedAt(null); }
  };
  const reset = () => { setStartedAt(null); setBanked(0); lastMinute.current = 1; };

  return (
    <div className="arc-timer">
      <div className="arc-timer__clock">{fmtMinSec(total ? Math.max(0, total - sec) : sec)}</div>
      {deathBy && <div className="arc-timer__sub">Minute {minute} · {minute} push-up{minute === 1 ? "" : "s"} this minute</div>}
      {over && <div className="arc-timer__sub">Time.</div>}
      <div className="arc-timer__row">
        <button type="button" className="z-btn z-btn--solid" onClick={toggle} disabled={over}>
          {startedAt !== null ? <><TbPlayerPauseFilled size={14} /> Pause</> : <><TbPlayerPlayFilled size={14} /> {sec ? "Resume" : "Start"}</>}
        </button>
        <button type="button" className="z-btn" onClick={reset} aria-label="Reset timer"><TbRefresh size={14} /></button>
      </div>
    </div>
  );
}

function DeckDraw({ seed, legsRecent, onCleared }: { seed: string; legsRecent: boolean; onCleared: (n: number) => void }) {
  const [cards] = useState(() => deck(seed, legsRecent));
  const [i, setI] = useState(0);
  const card = i > 0 ? cards[i - 1] : undefined;
  return (
    <div className="arc-deck">
      {card ? (
        <div className={`arc-deck__card${card.suit === "♥" || card.suit === "♦" ? " is-red" : ""}`}>
          <b>{card.rank}{card.suit}</b><span>{card.reps} {card.move}</span>
        </div>
      ) : <div className="arc-deck__card is-back"><TbCards size={28} /></div>}
      <button type="button" className="z-btn z-btn--solid" disabled={i >= cards.length}
        onClick={() => { hapticLight(); setI(i + 1); onCleared(i); }}>
        {i === 0 ? "Draw the first card" : i >= cards.length ? "Deck cleared" : "Done — next card"}
      </button>
      <div className="arc-timer__sub">{i > 0 ? `${i - 1} cleared · ${cards.length - i + 1} left` : "52 cards"}</div>
    </div>
  );
}

export function ArcBossSheet({ mode, state, date, onClose }: { mode: BossMode; state: ArcBossState; date: string; onClose: () => void }) {
  const { message } = App.useApp();
  useBackClose(true, onClose);
  const [score, setScore] = useState<number | null>(mode.type === "boss" ? state.bossScore ?? null : null);
  const logged = mode.type === "trial" ? state.trial?.logged : undefined;
  const [pushups, setPushups] = useState<number | null>(logged?.pushups ?? null);
  const [plank, setPlank] = useState<number | null>(logged?.plank ?? null);
  const [deathBy, setDeathBy] = useState<number | null>(logged?.deathBy ?? null);
  const [tier, setTier] = useState<MurphTier>((state.murphDone || "half") as MurphTier);

  const done = (msg: string) => { hapticSuccess(); void message.success(msg); onClose(); };
  const title = mode.type === "boss" ? mode.boss.title : mode.type === "trial" ? `Trials #${mode.n}` : "Hostel Murph";

  return (
    <Sheet open onCancel={onClose} footer={null} destroyOnHidden
      title={<span className="arc-vow__title"><TbSwords size={16} /> {title}</span>}>
      <div className="arc-boss">
        {mode.type === "boss" && (
          <>
            <p>{mode.boss.rules}</p>
            {mode.boss.legs && state.legsRecent && (
              <p className="arc-vow__note">Legs in the last 48h — {mode.boss.kind === "deck" ? "hearts are crunches instead of squats." : "swap the squats for glute bridges, or do this later in the week."}</p>
            )}
            {state.beat !== undefined && <p className="arc-boss__beat">Boss HP: <b>{state.beat}</b> {mode.boss.scoreLabel} — beat it.</p>}
            {mode.boss.kind === "deck"
              ? <DeckDraw seed={`${date}:${mode.boss.id}`} legsRecent={state.legsRecent} onCleared={setScore} />
              : mode.boss.kind === "quality" ? null
              : <BossTimer minutes={mode.boss.minutes} deathBy={mode.boss.kind === "deathby"} />}
            <label className="arc-boss__score">
              <span>Your score · {mode.boss.scoreLabel}</span>
              <InputNumber min={0} max={999} value={score} onChange={setScore} inputMode="decimal" />
            </label>
            <button type="button" className="z-btn z-btn--solid arc-vow__sign" disabled={score === null}
              onClick={() => void saveBossScore(mode.boss.id, score ?? 0).then(() => done("Boss logged. The Wraith felt that."))}>
              Log the fight
            </button>
          </>
        )}

        {mode.type === "trial" && (
          <>
            <p>Same three tests on Day 1, Day 31 and Dec 30 — the Wrapped card compares them. Fresh, warmed up, strict form.</p>
            <label className="arc-boss__score"><span>Max strict push-ups (one set)</span>
              <InputNumber min={0} max={300} value={pushups} onChange={setPushups} inputMode="decimal" /></label>
            <label className="arc-boss__score"><span>Plank hold, seconds (capped at {PLANK_CAP_SEC})</span>
              <InputNumber min={0} max={PLANK_CAP_SEC} value={plank} onChange={setPlank} inputMode="decimal" /></label>
            <label className="arc-boss__score"><span>Death by push-ups — minutes survived</span>
              <InputNumber min={0} max={60} value={deathBy} onChange={setDeathBy} inputMode="decimal" /></label>
            <BossTimer deathBy />
            <button type="button" className="z-btn z-btn--solid arc-vow__sign" disabled={pushups === null || plank === null || deathBy === null}
              onClick={() => void saveTrial(mode.n, { pushups: pushups ?? 0, plank: plank ?? 0, deathBy: deathBy ?? 0 }).then(() => done(`Trials #${mode.n} on the record.`))}>
              Save Trials
            </button>
          </>
        )}

        {mode.type === "murph" && (
          <>
            <p>Close the Arc. Partition it however you like — no bar needed. Pick a tier you'll actually finish.</p>
            <Segmented block value={tier} onChange={(v) => setTier(v as MurphTier)}
              options={[{ label: "Half", value: "half" }, { label: "Intermediate", value: "intermediate" }, { label: "Full", value: "full" }]} />
            <ul className="arc-boss__plan">
              {murphPlan(tier, state.legsRecent).map((m) => <li key={m.move}><b>{m.amount}</b> {m.move}</li>)}
            </ul>
            {state.legsRecent && <p className="arc-vow__note">Legs in the last 48h, so the squats became plank minutes.</p>}
            <BossTimer />
            <button type="button" className="z-btn z-btn--solid arc-vow__sign"
              onClick={() => void finishMurph(tier).then(() => done("Murph done. The arc is closed."))}>
              {state.murphDone ? "Update tier" : "I finished it"}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
