import { mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Winter Arc partner pact + consistency board. Like social.ts, the caller is
// always derived from auth, never passed in. Friends see kept/missed per day
// and nothing else.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ARC_DAYS = 61;

async function progressOf(ctx: QueryCtx, userId: Id<"users">) {
  return ctx.db.query("arcProgress").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
}

/** Replace the caller's kept-day list. */
export const pushArcProgress = mutation({
  args: { kept: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const kept = [...new Set(args.kept.filter((d) => DATE.test(d)))].sort().slice(-ARC_DAYS);
    const row = await progressOf(ctx, userId);
    if (row) await ctx.db.patch(row._id, { kept, updatedAt: Date.now() });
    else await ctx.db.insert("arcProgress", { userId, kept, updatedAt: Date.now() });
  },
});

/** Pick (or clear) your Arc Partner — only someone you already follow. */
export const setArcPartner = mutation({
  args: { partnerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    if (args.partnerId) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower_followed", (q) => q.eq("followerId", userId).eq("followedId", args.partnerId!))
        .unique();
      if (!follows) throw new Error("Follow them first");
    }
    const row = await progressOf(ctx, userId);
    if (row) await ctx.db.patch(row._id, { partnerId: args.partnerId, updatedAt: Date.now() });
    else await ctx.db.insert("arcProgress", { userId, kept: [], partnerId: args.partnerId, updatedAt: Date.now() });
  },
});
