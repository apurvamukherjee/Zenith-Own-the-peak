import { db } from "../db/db";
import { xpToLevel, getTotalXP } from "./xp";
import { TIER_META, type Tier, defById } from "./achievements";

// ─────────────────────────────────────────────────────────────────────────────
// REWARD VAULT — cosmetic unlocks (accent themes + avatar frames), local-only.
// Purely visual, zero gameplay effect. Mirrors lib/achievements.ts's shape:
// a registry of defs with an `unlock(ctx)` predicate, a light context builder,
// and db.cosmeticUnlocks persists *which* ids have been unlocked.
//
// Titles are deliberately NOT part of this registry — they're derived live
// from lib/xp.ts's LEVELS (any level at/below current XP is equippable), so
// they need no unlock storage at all. See features/vault/useRewardVault.ts.
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultContext {
  totalXp: number;
  level: number;
  tierCounts: Record<Tier, number>;
  hasCompletionist: boolean;
}

export async function buildVaultContext(): Promise<VaultContext> {
  const [totalXp, unlocked] = await Promise.all([
    getTotalXP(),
    db.achievements.toArray(),
  ]);
  const level = xpToLevel(totalXp).level;
  const tierCounts: Record<Tier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, mythic: 0 };
  let hasCompletionist = false;
  for (const u of unlocked) {
    if (u.id === "completionist") hasCompletionist = true;
    const def = defById(u.id);
    if (def) tierCounts[def.tier]++;
  }
  return { totalXp, level, tierCounts, hasCompletionist };
}

// ---- Accent themes --------------------------------------------------------
// Gated on the same LEVELS milestones from lib/xp.ts, so each theme's name
// matches the level name that unlocks it. `gothic-red` is the default brand
// identity (CLAUDE.md: "Gothic dark is the default and primary identity") and
// is always unlocked — it never gets a db.cosmeticUnlocks row.
export interface AccentThemeDef {
  id: string;
  label: string;
  hint: string;
  light: string;
  dark: string;
  unlock: (ctx: VaultContext) => boolean;
}

export const DEFAULT_ACCENT = "gothic-red";

export const ACCENT_THEMES: AccentThemeDef[] = [
  { id: "gothic-red", label: "Gothic Red", hint: "Own the peak. Default.", light: "#c8112a", dark: "#ff2740", unlock: () => true },
  { id: "bronze", label: "Bronze", hint: "Reach Level 5 — Bronze.", light: "#9a5a1f", dark: "#d98a3d", unlock: (c) => c.level >= 5 },
  { id: "gold", label: "Gold", hint: "Reach Level 13 — Gold.", light: "#a8790a", dark: "#f6b93b", unlock: (c) => c.level >= 13 },
  { id: "violet", label: "Violet", hint: "Reach Level 16 — Mythic.", light: "#6b2fb3", dark: "#9b5cff", unlock: (c) => c.level >= 16 },
  { id: "zenith", label: "Zenith", hint: "Reach Level 20 — Zenith. The peak.", light: "#141013", dark: "#f5efe6", unlock: (c) => c.level >= 20 },
];

export function accentById(id: string): AccentThemeDef {
  return ACCENT_THEMES.find((a) => a.id === id) ?? ACCENT_THEMES[0];
}

export function isAccentUnlocked(id: string, unlockedIds: Set<string>): boolean {
  return id === DEFAULT_ACCENT || unlockedIds.has(id);
}

// ---- Avatar frames ---------------------------------------------------------
// A gradient ring around the avatar. The 5 tier frames reuse TIER_META
// directly (same gradients as Hall of Frame badges) — no new palette to
// balance. The Completionist frame is a unique shimmer, gated on that one
// mythic badge specifically.
export interface FrameDef {
  id: string;
  label: string;
  hint: string;
  grad: string;
  glow: string;
  unlock: (ctx: VaultContext) => boolean;
}

export const FRAMES: FrameDef[] = [
  { id: "bronze-frame", label: "Bronze Frame", hint: "Own 5 bronze badges.", grad: TIER_META.bronze.grad, glow: TIER_META.bronze.glow, unlock: (c) => c.tierCounts.bronze >= 5 },
  { id: "silver-frame", label: "Silver Frame", hint: "Own 5 silver badges.", grad: TIER_META.silver.grad, glow: TIER_META.silver.glow, unlock: (c) => c.tierCounts.silver >= 5 },
  { id: "gold-frame", label: "Gold Frame", hint: "Own 5 gold badges.", grad: TIER_META.gold.grad, glow: TIER_META.gold.glow, unlock: (c) => c.tierCounts.gold >= 5 },
  { id: "iron-frame", label: "Iron Frame", hint: "Own 3 iron-tier badges.", grad: TIER_META.platinum.grad, glow: TIER_META.platinum.glow, unlock: (c) => c.tierCounts.platinum >= 3 },
  { id: "mythic-frame", label: "Mythic Frame", hint: "Own 1 mythic badge.", grad: TIER_META.mythic.grad, glow: TIER_META.mythic.glow, unlock: (c) => c.tierCounts.mythic >= 1 },
  {
    id: "completionist-frame", label: "Completionist Frame", hint: "Unlock The Completionist.",
    grad: "conic-gradient(from 0deg, #c98a4b, #cdd6dd, #ffd76b, #a8a2b0, #ff2740, #c98a4b)",
    glow: "rgba(255,39,64,0.55)",
    unlock: (c) => c.hasCompletionist,
  },
];

export function frameById(id: string): FrameDef | undefined {
  return FRAMES.find((f) => f.id === id);
}

// All persisted (non-default) cosmetics — used by the unlock engine to diff
// against db.cosmeticUnlocks.
export function allCosmeticDefs(): { id: string; label: string }[] {
  return [
    ...ACCENT_THEMES.filter((a) => a.id !== DEFAULT_ACCENT),
    ...FRAMES,
  ];
}

export function cosmeticUnlocked(id: string, ctx: VaultContext): boolean {
  const accent = ACCENT_THEMES.find((a) => a.id === id);
  if (accent) return accent.unlock(ctx);
  const frame = frameById(id);
  if (frame) return frame.unlock(ctx);
  return false;
}

// ---- Unlock engine ---------------------------------------------------------
// Mirrors lib/achievements.ts's syncAchievements: diff the registry against
// what's already in db.cosmeticUnlocks, insert newly-earned ids, return them
// so the caller (features/vault/useRewardVault.ts) can toast/haptic.
export async function syncCosmetics(ctx: VaultContext): Promise<string[]> {
  const existing = await db.cosmeticUnlocks.toArray();
  const have = new Set(existing.map((c) => c.id));
  const now = Date.now();
  const fresh: string[] = [];

  for (const def of allCosmeticDefs()) {
    if (have.has(def.id)) continue;
    if (cosmeticUnlocked(def.id, ctx)) {
      await db.cosmeticUnlocks.add({ id: def.id, unlockedAt: now, seen: 0 });
      have.add(def.id);
      fresh.push(def.id);
    }
  }
  return fresh;
}
