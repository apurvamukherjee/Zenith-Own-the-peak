import { useState } from "react";
import { App, Popconfirm } from "antd";
import { TbSwords, TbFlask, TbCoins, TbGhost2, TbCheck } from "react-icons/tb";
import { chapterOf } from "../../lib/arcCalendar";
import { WRAITH_HP, WAGER_STAKE } from "../../lib/arcBosses";
import { useArcBosses, placeWager } from "./useArcBosses";
import { ArcBossSheet, type BossMode } from "./ArcBossSheet";
import { ArcPartnerChip } from "./ArcSocial";
import { convexConfigured } from "../../lib/convexClient";

// Bosses, Trials, the Wraith and the wager live under the drill on the card:
// the drill keeps the chain, these are the fights on top of it.
export function ArcBossPanel({ date }: { date: string }) {
  const { message } = App.useApp();
  const s = useArcBosses(date);
  const [mode, setMode] = useState<BossMode | null>(null);
  if (!s) return null;
  const ch = chapterOf(date);

  return (
    <div className="arc-boss-panel">
      <div className="arc-wraith" aria-label={`Winter Wraith: ${s.wraith} of ${WRAITH_HP} HP`}>
        <span><TbGhost2 size={13} /> Winter Wraith</span>
        <div className="arc-wraith__bar"><i style={{ width: `${Math.min(100, s.wraith / WRAITH_HP * 100)}%` }} /></div>
        <b>{s.wraith === 0 ? "Slain" : `${s.wraith} HP`}</b>
      </div>
      <div className="arc-boss-panel__chips">
        {s.trial && (
          <button type="button" className={`arc-pill${s.trial.logged ? " is-done" : ""}`} onClick={() => setMode({ type: "trial", n: s.trial!.n })}>
            {s.trial.logged ? <TbCheck size={13} /> : <TbFlask size={13} />} Trials #{s.trial.n}{s.trial.logged ? ` · ${s.trial.logged.pushups} push-ups` : ""}
          </button>
        )}
        {s.boss && (
          <button type="button" className={`arc-pill${s.bossScore !== undefined ? " is-done" : ""}`} onClick={() => setMode({ type: "boss", boss: s.boss! })}>
            {s.bossScore !== undefined ? <TbCheck size={13} /> : <TbSwords size={13} />} Boss · {s.boss.title}
            {s.bossScore !== undefined ? ` · ${s.bossScore}` : s.beat !== undefined ? ` · beat ${s.beat}` : ""}
          </button>
        )}
        {s.murph && (
          <button type="button" className={`arc-pill${s.murphDone ? " is-done" : ""}`} onClick={() => setMode({ type: "murph" })}>
            {s.murphDone ? <TbCheck size={13} /> : <TbSwords size={13} />} Hostel Murph{s.murphDone ? ` · ${s.murphDone}` : ""}
          </button>
        )}
        {s.wagerOpen && (
          <Popconfirm title={`Stake ${WAGER_STAKE} XP on a perfect Chapter ${ch.n}?`} description="Every day covered → you get 100 back. One miss and it's gone."
            okText="Stake it" cancelText="No" onConfirm={() => void placeWager(ch.n, date).then(() => message.success("Staked. Don't blink."))}>
            <button type="button" className="arc-pill"><TbCoins size={13} /> Wager {WAGER_STAKE} XP</button>
          </Popconfirm>
        )}
        {s.wager && <span className="arc-pill is-static"><TbCoins size={13} /> {WAGER_STAKE} XP on Ch {s.wager.chapter}</span>}
        {convexConfigured && <ArcPartnerChip />}
      </div>
      {mode && <ArcBossSheet mode={mode} state={s} date={date} onClose={() => setMode(null)} />}
    </div>
  );
}
