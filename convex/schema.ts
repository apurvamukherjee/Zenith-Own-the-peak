import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Mirrors the old Supabase `profiles` / `weekly_scores` / `follows` / `backups`
// tables from Phase 5 (see CLAUDE.md), minus the `activities` table — nothing
// in src/ ever consumed it, so it isn't recreated here.
export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    shareCode: v.string(),
    level: v.number(),
    totalXp: v.number(),
    topBadges: v.array(
      v.object({ id: v.string(), name: v.string(), tier: v.string() }),
    ),
    badgeCount: v.number(),
    public: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_shareCode", ["shareCode"]),

  weeklyScores: defineTable({
    userId: v.id("users"),
    weekKey: v.string(),
    disciplineAvg: v.number(),
    streakEnd: v.number(),
    volumeKg: v.number(),
    xpEarned: v.number(),
  })
    .index("by_user_week", ["userId", "weekKey"])
    .index("by_week", ["weekKey"]),

  follows: defineTable({
    followerId: v.id("users"),
    followedId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_follower_followed", ["followerId", "followedId"]),

  backups: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
