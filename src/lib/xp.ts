import { db } from "../db/db";
import type { XpEventDto } from "../db/types";

// ─────────────────────────────────────────────────────────────────────────────
// XP RATES  (researched against Zenith mutation bus events)
// Every rate is a named constant so it's easy to balance-tune later.
// ─────────────────────────────────────────────────────────────────────────────
export const XP = {
  set:           2,   // complete one set
  pr:            25,  // new e1RM personal record
  session_done:  5,   // any session with ≥1 set completed
  discipline_80: 10,  // discipline ring crosses 80% for the day
  discipline_100:15,  // perfect day
  perfect_week:  50,  // 7 consecutive days ≥80% discipline
  streak_day:    5,   // streak ticked over (once per calendar day)
  water_goal:    3,   // daily water goal hit
  sleep:         2,   // any sleep entry logged (once per day)
  meal:          1,   // meal logged (capped 5 per day to prevent farming)
  badge_bronze:  10,
  badge_silver:  20,
  badge_gold:    40,
  badge_iron:    60,   // "platinum" renamed to iron
  badge_mythic:  100,
} as const;
export type XpAction = keyof typeof XP;

// ─────────────────────────────────────────────────────────────────────────────
// LEVELS  (level = floor(sqrt(totalXP / 50)), soft cap at 20)
// Formula mirrors an RPG curve: early levels are fast, later ones grind.
// ─────────────────────────────────────────────────────────────────────────────
export interface LevelDef { level: number; name: string; xpRequired: number; }
export const LEVELS: LevelDef[] = [
  { level: 0,  name: "Unranked",   xpRequired: 0      },
  { level: 1,  name: "Recruit",    xpRequired: 50     },
  { level: 2,  name: "Initiate",   xpRequired: 200    },
  { level: 3,  name: "Grinder",    xpRequired: 450    },
  { level: 4,  name: "Iron",       xpRequired: 800    },
  { level: 5,  name: "Bronze",     xpRequired: 1_250  },
  { level: 6,  name: "Tempered",   xpRequired: 1_800  },
  { level: 7,  name: "Steel",      xpRequired: 2_450  },
  { level: 8,  name: "Forged",     xpRequired: 3_200  },
  { level: 9,  name: "Hardened",   xpRequired: 4_050  },
  { level: 10, name: "Silver",     xpRequired: 5_000  },
  { level: 11, name: "Adamant",    xpRequired: 6_050  },
  { level: 12, name: "Obsidian",   xpRequired: 7_200  },
  { level: 13, name: "Gold",       xpRequired: 8_450  },
  { level: 14, name: "Sovereign",  xpRequired: 9_800  },
  { level: 15, name: "Warlord",    xpRequired: 11_250 },
  { level: 16, name: "Mythic",     xpRequired: 12_800 },
  { level: 17, name: "Legend",     xpRequired: 14_450 },
  { level: 18, name: "Apex",       xpRequired: 16_200 },
  { level: 19, name: "Eternal",    xpRequired: 18_050 },
  { level: 20, name: "Zenith",     xpRequired: 20_000 },
];

export function xpToLevel(totalXP: number): LevelDef {
  // Walk backwards to find the highest level threshold met.
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function nextLevel(current: LevelDef): LevelDef | null {
  const next = LEVELS.find((l) => l.level === current.level + 1);
  return next ?? null;
}

// Fraction 0–1 progress from current level threshold to next.
export function levelProgress(totalXP: number): number {
  const cur = xpToLevel(totalXP);
  const nxt = nextLevel(cur);
  if (!nxt) return 1; // max level
  const range = nxt.xpRequired - cur.xpRequired;
  const earned = totalXP - cur.xpRequired;
  return Math.min(1, earned / range);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** ISO week key: "2025-W12" */
export function isoWeek(d = new Date()): string {
  // Copy date so we don't mutate the original.
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // ISO weeks start on Monday. Adjust Thursday to find the correct year.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Grant XP and persist to the xpEvents table. Returns the XpEventDto id. */
export async function grantXP(action: XpAction): Promise<number> {
  const xp = XP[action];
  const event: Omit<XpEventDto, "id"> = {
    action,
    xp,
    weekKey: isoWeek(),
    createdAt: Date.now(),
  };
  return db.xpEvents.add(event as XpEventDto);
}

/** Total XP across all time. */
export async function getTotalXP(): Promise<number> {
  const all = await db.xpEvents.toArray();
  return all.reduce((s, e) => s + e.xp, 0);
}

/** XP earned in the current ISO week. */
export async function getWeekXP(): Promise<number> {
  const wk = isoWeek();
  const events = await db.xpEvents.where("weekKey").equals(wk).toArray();
  return events.reduce((s, e) => s + e.xp, 0);
}
