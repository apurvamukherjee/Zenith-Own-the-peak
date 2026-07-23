import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Snapshot sync: the whole local DB (exportAll() JSON) is stored as one file
// per user, not a document field — exportAll() includes dayPhotos (compressed
// dataURL images), which can exceed Convex's ~1MiB document-size cap. File
// storage has no such ceiling. `backups` only ever holds a pointer to it.

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Record the freshly-uploaded blob as this user's backup, replacing the old one. */
export const saveBackup = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const existing = await ctx.db
      .query("backups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.storage.delete(existing.storageId); // drop the orphaned prior blob
      await ctx.db.patch(existing._id, { storageId: args.storageId, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("backups", { userId, storageId: args.storageId, updatedAt: Date.now() });
    }
  },
});

/** A fetchable URL for the caller's current backup blob, or null if none yet. */
export const getBackup = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("backups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!row) return null;
    const url = await ctx.storage.getUrl(row.storageId);
    if (!url) return null;
    return { url, updatedAt: row.updatedAt };
  },
});
