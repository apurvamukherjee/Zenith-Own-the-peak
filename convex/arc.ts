import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Winter Arc partner pact + consistency board. Like social.ts, the caller is
// always derived from auth, never passed in. Friends see kept/missed per day
// and nothing else.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ARC_DAYS = 61;
const COOP_WRAITH_HP = ARC_DAYS * 2;

// Pure calendar arithmetic on a YYYY-MM-DD key — UTC is safe here because the
// key is already a local day; nothing is converted from a timestamp.
function prevDay(d: string): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

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

/** You + everyone you follow, ranked by arc days kept (consistency, not kg). */
export const getArcBoard = query({
  args: { today: v.string(), chapterStart: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const follows = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", userId)).collect();
    const me = await progressOf(ctx, userId);
    const mine = new Set(me?.kept ?? []);

    const rows = await Promise.all([userId, ...follows.map((f) => f.followedId)].map(async (id) => {
      const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", id)).unique();
      const p = id === userId ? me : await progressOf(ctx, id);
      if (!profile || !p) return null;
      const kept = new Set(p.kept);
      const mutual = id !== userId && me?.partnerId === id && p.partnerId === userId;
      let sharedFlame = 0;
      if (mutual) {
        let d = mine.has(args.today) && kept.has(args.today) ? args.today : prevDay(args.today);
        while (mine.has(d) && kept.has(d)) { sharedFlame++; d = prevDay(d); }
      }
      return {
        userId: id,
        displayName: profile.displayName,
        isMe: id === userId,
        kept: kept.size,
        keptToday: kept.has(args.today),
        chapterKept: p.kept.filter((d) => d >= args.chapterStart && d <= args.today).length,
        partner: id === userId ? null
          : mutual ? "mutual" as const
          : me?.partnerId === id ? "pending" as const
          : p.partnerId === userId ? "invited" as const
          : null,
        sharedFlame,
        coopWraithHp: mutual ? Math.max(0, COOP_WRAITH_HP - kept.size - mine.size) : null,
      };
    }));
    return rows.filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => b.kept - a.kept);
  },
});
