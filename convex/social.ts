import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Server-side port of the old src/lib/social.ts (Supabase). The key
// difference: every function derives the caller's identity from
// ctx.auth.getUserIdentity() (via getAuthUserId) instead of trusting a
// client-supplied userId — Supabase relied on hand-written RLS policies for
// that; Convex functions just don't accept the arg in the first place.

const badgeShape = v.object({ id: v.string(), name: v.string(), tier: v.string() });

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ZN-${code}`;
}

async function findProfileByUser(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  return userId;
}

/** Ensure the caller has a profile row with a share code. Idempotent. */
export const ensureProfile = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await findProfileByUser(ctx, userId);
    if (existing) return existing.shareCode;

    // Retry on the (extremely unlikely) share-code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const shareCode = genCode();
      const clash = await ctx.db
        .query("profiles")
        .withIndex("by_shareCode", (q) => q.eq("shareCode", shareCode))
        .unique();
      if (clash) continue;
      await ctx.db.insert("profiles", {
        userId,
        displayName: args.displayName || "Anonymous",
        shareCode,
        level: 1,
        totalXp: 0,
        topBadges: [],
        badgeCount: 0,
        public: false,
        updatedAt: Date.now(),
      });
      return shareCode;
    }
    throw new Error("Could not allocate a unique share code");
  },
});

/** Push this week's score + level/badges snapshot (called alongside backup). */
export const pushWeeklySnapshot = mutation({
  args: {
    weekKey: v.string(),
    disciplineAvg: v.number(),
    streakEnd: v.number(),
    volumeKg: v.number(),
    xpEarned: v.number(),
    level: v.number(),
    totalXp: v.number(),
    topBadges: v.array(badgeShape),
    badgeCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const profile = await findProfileByUser(ctx, userId);
    if (!profile) throw new Error("Call ensureProfile first");

    await ctx.db.patch(profile._id, {
      level: args.level,
      totalXp: args.totalXp,
      topBadges: args.topBadges,
      badgeCount: args.badgeCount,
      updatedAt: Date.now(),
    });

    const existingScore = await ctx.db
      .query("weeklyScores")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekKey", args.weekKey))
      .unique();
    if (existingScore) {
      await ctx.db.patch(existingScore._id, {
        disciplineAvg: args.disciplineAvg,
        streakEnd: args.streakEnd,
        volumeKg: args.volumeKg,
        xpEarned: args.xpEarned,
      });
    } else {
      await ctx.db.insert("weeklyScores", {
        userId,
        weekKey: args.weekKey,
        disciplineAvg: args.disciplineAvg,
        streakEnd: args.streakEnd,
        volumeKg: args.volumeKg,
        xpEarned: args.xpEarned,
      });
    }
  },
});

/** Follow a user by their share code. Returns their display name or null. */
export const followByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const code = args.code.toUpperCase().trim();
    const target = await ctx.db
      .query("profiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", code))
      .unique();
    if (!target) return null;
    if (target.userId === userId) return null; // can't follow yourself

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_followed", (q) => q.eq("followerId", userId).eq("followedId", target.userId))
      .unique();
    if (!existing) {
      await ctx.db.insert("follows", { followerId: userId, followedId: target.userId });
    }
    return target.displayName;
  },
});

/** Unfollow a user. */
export const unfollowUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_followed", (q) => q.eq("followerId", userId).eq("followedId", args.targetUserId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** ISO week key: "2025-W12" — mirrors src/lib/xp.ts isoWeek(). */
function isoWeek(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Your scores + all followed users' scores for the current week. Reactive. */
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const weekKey = isoWeek();

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    const allIds = [userId, ...follows.map((f) => f.followedId)];

    const rows = await Promise.all(
      allIds.map(async (id) => {
        const profile = await findProfileByUser(ctx, id);
        if (!profile) return null;
        const score = await ctx.db
          .query("weeklyScores")
          .withIndex("by_user_week", (q) => q.eq("userId", id).eq("weekKey", weekKey))
          .unique();
        return {
          userId: id,
          displayName: profile.displayName,
          level: profile.level,
          shareCode: profile.shareCode,
          discipline: score?.disciplineAvg ?? 0,
          streak: score?.streakEnd ?? 0,
          volumeKg: score?.volumeKg ?? 0,
          xpEarned: score?.xpEarned ?? 0,
          isMe: id === userId,
          topBadges: profile.topBadges,
          badgeCount: profile.badgeCount,
        };
      }),
    );

    return rows
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.discipline - a.discipline || b.volumeKg - a.volumeKg);
  },
});
