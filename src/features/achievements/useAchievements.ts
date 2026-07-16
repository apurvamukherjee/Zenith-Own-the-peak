import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { App } from "antd";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import { onMutation } from "../../lib/mutations";
import { hapticSuccess } from "../../lib/haptics";
import {
  ACHIEVEMENTS, ACHIEVEMENT_COUNT, buildContext, syncAchievements, defById,
  type AchievementContext,
} from "../../lib/achievements";
import type { AchievementDef } from "../../lib/achievements";

export interface AchievementView {
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt: number | null;
  ratio: number;
  value: string;
}

// Merged view: every definition + live progress + unlock state, ordered
// unlocked-first then by proximity to unlocking.
export function useAchievements() {
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const [ctx, setCtx] = useState<AchievementContext | null>(null);

  const unlocks = useLiveQuery(() => db.achievements.toArray(), []) ?? [];

  // Recompute the context whenever any table changes (debounced light).
  useEffect(() => {
    let alive = true;
    const run = () => buildContext(waterGoal, proteinTarget).then((c) => { if (alive) setCtx(c); });
    run();
    let t: number | undefined;
    const off = onMutation(() => { window.clearTimeout(t); t = window.setTimeout(run, 800); });
    return () => { alive = false; off(); window.clearTimeout(t); };
  }, [waterGoal, proteinTarget]);

  const unlockMap = new Map(unlocks.map((u) => [u.id, u]));
  const views: AchievementView[] = ACHIEVEMENTS.map((def) => {
    const u = unlockMap.get(def.id);
    const p = ctx ? def.progress(ctx) : { done: false, ratio: 0, value: "" };
    return {
      def,
      unlocked: !!u,
      unlockedAt: u?.unlockedAt ?? null,
      ratio: u ? 1 : p.ratio,
      value: p.value,
    };
  }).sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked && b.unlocked) return (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0);
    return b.ratio - a.ratio;
  });

  return {
    views,
    ready: ctx !== null,
    unlockedCount: unlocks.length,
    total: ACHIEVEMENT_COUNT,
  };
}

// Count of freshly-unlocked achievements the user hasn't opened the Hall for.
export function useUnseenAchievements(): number {
  const rows = useLiveQuery(() => db.achievements.where("seen").equals(0).toArray(), []) ?? [];
  return rows.length;
}

export async function markAllSeen() {
  const fresh = await db.achievements.where("seen").equals(0).toArray();
  await Promise.all(fresh.map((f) => db.achievements.update(f.id, { seen: 1 })));
}

// App-wide engine: mounted once (AppShell). Recomputes on change (debounced),
// unlocks newly-earned badges, and pops a toast + haptic for each. Silent for
// already-unlocked ones. Toast is guarded so a re-render can't double-fire.
export function useAchievementEngine() {
  const { message } = App.useApp();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const toasted = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    let t: number | undefined;

    const run = async () => {
      const ctx = await buildContext(waterGoal, proteinTarget);
      const fresh = await syncAchievements(ctx);
      if (!alive) return;
      for (const id of fresh) {
        if (toasted.current.has(id)) continue;
        toasted.current.add(id);
        const d = defById(id);
        if (d) {
          void hapticSuccess();
          message.success({ content: `🏆 Unlocked — ${d.name}`, duration: 4 });
          // Egg #15: every mythic unlock grows the mountain in Settings→About.
          // We touch the setting directly instead of through setSetting to keep
          // this file dependency-light; the mutation bus still fires.
          if (d.tier === "mythic") {
            void db.settings.get("mountainPeaks").then((row) => {
              const cur = Number(row?.value ?? 0);
              void db.settings.put({ key: "mountainPeaks", value: cur + 1 });
            });
          }
        }
      }
    };

    // Small initial delay so first paint isn't blocked by the scan.
    const boot = window.setTimeout(run, 1200);
    const off = onMutation(() => { window.clearTimeout(t); t = window.setTimeout(run, 1500); });
    return () => { alive = false; off(); window.clearTimeout(t); window.clearTimeout(boot); };
  }, [waterGoal, proteinTarget, message]);
}
