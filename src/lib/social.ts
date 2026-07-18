import { supabase } from "./supabase";
import { db } from "../db/db";
import { getTotalXP, isoWeek } from "./xp";
import { xpToLevel } from "./xp";
import { computeTodayScore } from "./todayScore";
import { computeUnifiedStreak } from "./streak.utils";

// ─────────────────────────────────────────────────────────────────────────────
// SHARE CODE — 6-char alphanumeric, prefixed "ZN-". Generated once on first
// sync login, cached locally in settings, written to profiles table.
// ─────────────────────────────────────────────────────────────────────────────
function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ZN-${code}`;
}

/** Ensure the user has a profile row with a share code. Idempotent. */
export async function ensureProfile(userId: string, displayName: string): Promise<string> {
  if (!supabase) return "";
  // Check for existing profile
  const { data: existing } = await supabase
    .from("profiles").select("share_code").eq("user_id", userId).single();
  if (existing?.share_code) {
    await db.settings.put({ key: "shareCode" as any, value: existing.share_code });
    return existing.share_code;
  }
  // Generate unique code (retry on collision — extremely unlikely)
  let code = genCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("profiles").upsert({
      user_id: userId,
      display_name: displayName || "Anonymous",
      share_code: code,
      level: 1,
      total_xp: 0,
      public: false,
    }, { onConflict: "user_id" });
    if (!error) {
      await db.settings.put({ key: "shareCode" as any, value: code });
      return code;
    }
    if (error.code === "23505") { code = genCode(); continue; } // unique violation
    console.error("ensureProfile:", error);
    return "";
  }
  return "";
}

/** Push weekly scores + level to Supabase (called alongside backup). */
export async function pushWeeklySnapshot(userId: string): Promise<void> {
  if (!supabase) return;
  const totalXP = await getTotalXP();
  const level = xpToLevel(totalXP);
  const weekKey = isoWeek();

  // Compute this week's discipline average from local scores
  const waterGoal = Number((await db.settings.get("waterGoalMl"))?.value ?? 3500);
  const proteinTarget = Number((await db.settings.get("proteinTargetG"))?.value ?? 100);
  const streak = await computeUnifiedStreak();

  // Get today's score as a proxy for discipline_avg (full week avg requires
  // computing 7 days — we'll refine this in Week 3, for now today's score
  // drives the leaderboard which refreshes on every sync).
  const todayScore = await computeTodayScore(waterGoal, proteinTarget);

  // Volume this week from sets
  const monday = getMonday(new Date());
  const sets = await db.workoutSets.where("date").aboveOrEqual(monday).toArray();
  const volumeKg = Math.round(sets.reduce((s, r) => s + r.weightKg * r.reps, 0));

  // Week XP
  const weekEvents = await db.xpEvents.where("weekKey").equals(weekKey).toArray();
  const weekXP = weekEvents.reduce((s, e) => s + e.xp, 0);

  // Upsert weekly score
  await supabase.from("weekly_scores").upsert({
    user_id: userId,
    week_key: weekKey,
    discipline_avg: todayScore.score,
    streak_end: streak,
    volume_kg: volumeKg,
    xp_earned: weekXP,
  }, { onConflict: "user_id,week_key" });

  // Update profile level
  await supabase.from("profiles").update({
    level: level.level,
    total_xp: totalXP,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
}

/** Follow a user by their share code. Returns the followed user's display name or null. */
export async function followByCode(myUserId: string, code: string): Promise<string | null> {
  if (!supabase) return null;
  const { data: target } = await supabase
    .from("profiles").select("user_id, display_name").eq("share_code", code.toUpperCase().trim()).single();
  if (!target) return null;
  if (target.user_id === myUserId) return null; // can't follow yourself

  await supabase.from("follows").upsert({
    follower_id: myUserId,
    followed_id: target.user_id,
  }, { onConflict: "follower_id,followed_id" });

  return target.display_name;
}

/** Get leaderboard: your scores + all followed users' scores for current week. */
export async function getLeaderboard(myUserId: string): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const weekKey = isoWeek();

  // Get who I follow
  const { data: follows } = await supabase
    .from("follows").select("followed_id").eq("follower_id", myUserId);
  const followedIds = (follows ?? []).map((f: any) => f.followed_id);
  const allIds = [myUserId, ...followedIds];

  // Get profiles
  const { data: profiles } = await supabase
    .from("profiles").select("user_id, display_name, level, total_xp, share_code").in("user_id", allIds);

  // Get weekly scores
  const { data: scores } = await supabase
    .from("weekly_scores").select("*").eq("week_key", weekKey).in("user_id", allIds);

  const entries: LeaderboardEntry[] = (profiles ?? []).map((p: any) => {
    const s = (scores ?? []).find((sc: any) => sc.user_id === p.user_id);
    return {
      userId: p.user_id,
      displayName: p.display_name,
      level: p.level,
      shareCode: p.share_code,
      discipline: s?.discipline_avg ?? 0,
      streak: s?.streak_end ?? 0,
      volumeKg: s?.volume_kg ?? 0,
      xpEarned: s?.xp_earned ?? 0,
      isMe: p.user_id === myUserId,
    };
  });

  // Sort by discipline desc, then volume desc
  entries.sort((a, b) => b.discipline - a.discipline || b.volumeKg - a.volumeKg);
  return entries;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  level: number;
  shareCode: string;
  discipline: number;
  streak: number;
  volumeKg: number;
  xpEarned: number;
  isMe: boolean;
}

/** Unfollow a user. */
export async function unfollowUser(myUserId: string, targetUserId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("follows").delete().eq("follower_id", myUserId).eq("followed_id", targetUserId);
}

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}
