import { useEffect } from "react";
import { App } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { TbSnowflake, TbCheck } from "react-icons/tb";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import { todayKey } from "../../lib/date.utils";
import { chapterOf } from "../../lib/arcCalendar";
import { ARC_DAYS } from "../../lib/winterArc";

// Everything here calls Convex hooks, so callers mount it only when
// `convexConfigured` (see main.tsx's provider gate).

/** Pushes your kept-day list whenever it changes — the only arc data friends ever see. */
export function ArcSocialSync() {
  const { isAuthenticated } = useConvexAuth();
  const joined = String(useSetting("arcJoined"));
  const push = useMutation(api.arc.pushArcProgress);
  const kept = useLiveQuery(
    async () => (await db.arcDays.toArray()).filter((r) => r.kind === "done" || r.kind === "repaired").map((r) => r.date).sort(),
    [],
  );
  const key = kept?.join(",");
  useEffect(() => {
    if (!isAuthenticated || !joined || kept === undefined) return;
    push({ kept }).catch((e: unknown) => { console.error("arc progress push failed", e); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, joined, key]);
  return null;
}

function useBoard() {
  const { isAuthenticated } = useConvexAuth();
  const today = todayKey();
  return useQuery(api.arc.getArcBoard, isAuthenticated ? { today, chapterStart: chapterOf(today).start } : "skip");
}

/** Consistency board: ranked by days kept, not kg, with "N more to pass X". */
export function ArcBoard() {
  const { message } = App.useApp();
  const board = useBoard();
  const setPartner = useMutation(api.arc.setArcPartner);
  if (!board || board.length === 0) return null;
  const meIdx = board.findIndex((r) => r.isMe);
  const ahead = meIdx > 0 ? board[meIdx - 1] : undefined;
  const me = board[meIdx];

  const pick = (id: Id<"users"> | undefined, name?: string) =>
    setPartner({ partnerId: id }).then(
      () => void message.success(id ? `Asked ${name} to be your Arc Partner.` : "Partner cleared."),
      (e: unknown) => void message.error(e instanceof Error ? e.message : "Couldn't set partner"),
    );

  return (
    <section className="arc-board" aria-label="Winter Arc board">
      <header>
        <b><TbSnowflake size={14} /> Winter Arc</b>
        {ahead && me && <span>{ahead.kept - me.kept + 1} more day{ahead.kept - me.kept + 1 === 1 ? "" : "s"} to pass {ahead.displayName}</span>}
      </header>
      <ol>
        {board.map((r) => (
          <li key={r.userId} className={r.isMe ? "is-me" : ""}>
            <span className="arc-board__name">{r.displayName}{r.isMe ? " (you)" : ""}</span>
            <span className="arc-board__today" title={r.keptToday ? "Kept today" : "Not yet today"}>{r.keptToday ? <TbCheck size={14} /> : "·"}</span>
            <span className="arc-board__kept">{r.kept}/{ARC_DAYS}</span>
            <span className="arc-board__ch">Ch {r.chapterKept}/7</span>
            {!r.isMe && (
              r.partner === "mutual"
                ? <button type="button" className="arc-board__btn is-on" onClick={() => void pick(undefined)}>Partner</button>
                : r.partner === "pending"
                  ? <button type="button" className="arc-board__btn" onClick={() => void pick(undefined)}>Asked…</button>
                  : <button type="button" className="arc-board__btn" onClick={() => void pick(r.userId, r.displayName)}>
                      {r.partner === "invited" ? "Accept partner" : "Partner up"}
                    </button>
            )}
          </li>
        ))}
      </ol>
      <p className="arc-board__note">Friends only see which days you kept. An Arc Partner is mutual: you both pick each other.</p>
    </section>
  );
}
