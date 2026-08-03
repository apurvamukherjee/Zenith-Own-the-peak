import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { App } from "antd";
import { db } from "../../db/db";
import { onMutation } from "../../lib/mutations";
import { hapticSuccess } from "../../lib/haptics";
import { useSetting } from "../../hooks/useSettings";
import { useXP } from "../../hooks/useXP";
import { LEVELS, type LevelDef } from "../../lib/xp";
import {
  buildVaultContext, syncCosmetics, ACCENT_THEMES, frameById,
} from "../../lib/rewardVault";

// Count of freshly-unlocked cosmetics the user hasn't opened /vault for.
export function useUnseenCosmetics(): number {
  const rows = useLiveQuery(() => db.cosmeticUnlocks.where("seen").equals(0).toArray(), []) ?? [];
  return rows.length;
}

export async function markAllCosmeticsSeen() {
  const fresh = await db.cosmeticUnlocks.where("seen").equals(0).toArray();
  await Promise.all(fresh.map((f) => db.cosmeticUnlocks.update(f.id, { seen: 1 })));
}

// Set of unlocked (non-default) cosmetic ids — accent themes + frames share
// one id namespace/table, same pattern as db.achievements.
export function useVaultUnlocks(): Set<string> {
  const rows = useLiveQuery(() => db.cosmeticUnlocks.toArray(), []) ?? [];
  return new Set(rows.map((r) => r.id));
}

// Titles need no unlock storage — any level at/below current XP is
// equippable, derived live from useXP() (level 0 "Unranked" excluded, it's
// not a flex). Mirrors LEVELS in lib/xp.ts.
export function useEquippableTitles(): LevelDef[] {
  const { totalXP } = useXP();
  return LEVELS.filter((l) => l.level > 0 && l.xpRequired <= totalXP);
}

// Currently-equipped title: the explicit setting if still reachable at
// current XP, else falls back to the current level's name.
export function useEquippedTitle(): string {
  const { totalXP, level } = useXP();
  const equipped = String(useSetting("equippedTitle"));
  if (!equipped) return level.name;
  const stillReachable = LEVELS.some((l) => l.name === equipped && l.xpRequired <= totalXP);
  return stillReachable ? equipped : level.name;
}

function labelFor(id: string): string {
  return ACCENT_THEMES.find((a) => a.id === id)?.label ?? frameById(id)?.label ?? id;
}

// App-wide engine: mounted once (AppShell), same debounced-on-mutation-bus
// pattern as useAchievementEngine. Purely cosmetic — grants no XP, unlike the
// achievement engine's badge-tier XP grants.
export function useRewardVaultEngine() {
  const { message } = App.useApp();
  const toasted = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    let t: number | undefined;

    const run = async () => {
      const ctx = await buildVaultContext();
      const fresh = await syncCosmetics(ctx);
      if (!alive) return;
      const newIds = fresh.filter((id) => !toasted.current.has(id));
      newIds.forEach((id) => toasted.current.add(id));
      if (newIds.length === 0) return;

      void hapticSuccess();
      if (newIds.length === 1) {
        message.success({ content: `✨ Unlocked — ${labelFor(newIds[0])}`, duration: 4 });
        return;
      }
      // 2+ unlocks in one scan — merge into a single tap-to-Vault toast.
      message.success({
        content: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span>✨ {newIds.length} vault items unlocked</span>
            <a href="/vault" onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.location.pathname = "/vault"; }}
               style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline" }}>
              See them →
            </a>
          </span>
        ),
        duration: 6,
      });
    };

    // Small initial delay so first paint isn't blocked by the scan.
    const boot = window.setTimeout(run, 1200);
    const off = onMutation(() => { window.clearTimeout(t); t = window.setTimeout(run, 1500); });
    return () => { alive = false; off(); window.clearTimeout(t); window.clearTimeout(boot); };
  }, [message]);
}
