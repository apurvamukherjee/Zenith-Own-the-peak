import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";

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
