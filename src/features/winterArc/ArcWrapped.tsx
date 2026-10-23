import { App } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import { TbSnowflake, TbShare2, TbLock } from "react-icons/tb";
import { db } from "../../db/db";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { useSetting } from "../../hooks/useSettings";
import { shareText } from "../../lib/saveFile";
import { arcBadgeFacts, SECOND_WIND } from "../../lib/arcCalendar";
import { wraithHp, parseJson, type TrialScore } from "../../lib/arcBosses";
import { personaFor, trialDeltas, bestRun, wrappedText, type WrappedStats } from "../../lib/arcWrapped";
import { parseVow } from "../../lib/arcChecklist";

export function useArcWrapped(): WrappedStats | undefined {
  const joined = String(useSetting("arcJoined"));
  const reserves = Number(useSetting("arcReserves"));
  const trialsRaw = String(useSetting("arcTrials"));
  const bossesRaw = String(useSetting("arcBossScores"));
  const murph = String(useSetting("arcMurph"));
  return useLiveQuery(async () => {
    const [rows, xpRows] = await Promise.all([
      db.arcDays.toArray(),
      db.xpEvents.where("createdAt").between(new Date(2026, 10, 1).getTime(), new Date(2027, 0, 1).getTime()).toArray(),
    ]);
    const facts = arcBadgeFacts(rows, joined, reserves);
    const kept = new Set(rows.filter((r) => r.kind === "done" || r.kind === "repaired").map((r) => r.date));
    const nov = [...kept].filter((d) => d < SECOND_WIND).length;
    const bosses = Object.keys(parseJson<Record<string, number>>(bossesRaw, {})).length;
    return {
      persona: personaFor(facts, rows.filter((r) => r.kind === "repaired").length, nov, kept.size - nov),
      kept: kept.size, bestRun: bestRun(kept),
      trials: trialDeltas(parseJson<Record<string, TrialScore>>(trialsRaw, {})),
      bosses, murph, reservesUsed: facts.reservesUsed,
      wraithSlain: wraithHp(facts.kept, bosses + (murph ? 1 : 0), facts.scars) === 0,
      xp: xpRows.reduce((n, e) => n + e.xp, 0),
    };
  }, [joined, reserves, trialsRaw, bossesRaw, murph]);
}

export function ArcWrappedSheet({ onClose }: { onClose: () => void }) {
  const { message } = App.useApp();
  const s = useArcWrapped();
  const vow = parseVow(String(useSetting("arcVow")));
  useBackClose(true, onClose);
  if (!s) return null;
  const share = async () => {
    const out = await shareText("Winter Arc 2026", wrappedText(s));
    if (out === "copied") void message.success("Copied — paste it anywhere.");
  };
  return (
    <Sheet open onCancel={onClose} footer={null} destroyOnHidden title={<span className="arc-vow__title"><TbSnowflake size={16} /> Winter Arc · Wrapped</span>}>
      <div className="arc-wrapped">
        <div className="arc-wrapped__hero">
          <span>Your arc was</span>
          <h2 className="display">{s.persona.title}</h2>
          <p>{s.persona.line}</p>
        </div>
        <div className="arc-wrapped__grid">
          <div><b>{s.kept}</b><span>/61 kept</span></div>
          <div><b>{s.bestRun}</b><span>best run</span></div>
          <div><b>{s.bosses}</b><span>bosses</span></div>
          <div><b>+{s.xp}</b><span>XP</span></div>
        </div>
        {s.trials.length > 0 && (
          <ul className="arc-wrapped__trials">
            {s.trials.map((t) => (
              <li key={t.label}><span>{t.label}</span><b>{t.first}{t.unit} → {t.last}{t.unit}</b>
                <em className={t.delta >= 0 ? "is-up" : ""}>{t.delta >= 0 ? "+" : ""}{t.delta}</em></li>
            ))}
          </ul>
        )}
        <div className="arc-wrapped__tags">
          {s.murph && <span>Murph · {s.murph}</span>}
          {s.wraithSlain && <span>Wraith slain</span>}
          <span>{s.reservesUsed} reserve{s.reservesUsed === 1 ? "" : "s"} spent</span>
        </div>
        {vow?.goal && (
          <div className="arc-wrapped__vow"><TbLock size={13} /> <span>Your vow, Day 0: “{vow.goal}”</span> <em>Only you see this — it's not in the share.</em></div>
        )}
        <button type="button" className="z-btn z-btn--solid arc-vow__sign" onClick={() => void share()}><TbShare2 size={15} /> Share your Wrapped</button>
      </div>
    </Sheet>
  );
}
