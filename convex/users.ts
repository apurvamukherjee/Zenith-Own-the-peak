import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Thin identity lookup — SyncCard shows the signed-in email, and Convex Auth
// doesn't expose a "current user" query out of the box.
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { id: user._id, email: user.email ?? null };
  },
});
