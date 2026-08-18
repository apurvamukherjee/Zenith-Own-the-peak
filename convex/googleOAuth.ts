import { mutation, internalMutation, internalQuery, query, action, httpAction, type ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import * as google from "./lib/googleClient";

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx as Parameters<typeof getAuthUserId>[0]);
  if (!userId) throw new Error("Not signed in");
  return userId;
}

function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — plenty for a consent-screen round trip

/** Begin the Google OAuth flow: stash a CSRF state token tied to this user, return the URL to open. */
export const startGoogleOAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const state = randomState();
    await ctx.db.insert("oauthStates", { state, userId, createdAt: Date.now() });
    return { authUrl: google.buildAuthUrl(state) };
  },
});

/**
 * Look up + delete a state token in one call (the callback is unauthenticated
 * — this is how it recovers which Zenith user is connecting). Internal only.
 */
export const consumeOAuthState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();
    if (!row) return null;
    await ctx.db.delete(row._id);
    if (Date.now() - row.createdAt > OAUTH_STATE_TTL_MS) return null;
    return row.userId;
  },
});

/** Upsert the account row after a successful OAuth exchange. */
export const saveGoogleAccount = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
    googleCalendarId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleCalendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      // Google only returns refresh_token on the FIRST consent grant — never
      // blank out a previously-stored one on a later reconnect that didn't
      // re-issue it.
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        googleCalendarId: args.googleCalendarId,
        needsReauth: false,
        ...(args.refreshToken ? { refreshToken: args.refreshToken } : {}),
      });
    } else {
      if (!args.refreshToken) {
        throw new Error("Google did not grant a refresh token on first connect — try disconnecting any prior Zenith access at myaccount.google.com/permissions and reconnecting");
      }
      await ctx.db.insert("googleCalendarAccounts", {
        userId: args.userId,
        refreshToken: args.refreshToken,
        accessToken: args.accessToken,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        googleCalendarId: args.googleCalendarId,
        connectedAt: Date.now(),
        needsReauth: false,
      });
    }
  },
});

/** Full account row incl. tokens — internal, for the sync actions only. */
export const getGoogleAccountInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("googleCalendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

/** Narrow patch helper used by the sync/refresh actions. */
export const patchGoogleAccountInternal = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    syncToken: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    needsReauth: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...patch } = args;
    const existing = await ctx.db
      .query("googleCalendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, patch);
  },
});

export const deleteGoogleAccountInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleCalendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Public status for the Settings card. Never exposes tokens. */
export const googleAccountStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("googleCalendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!row) return { connected: false as const };
    return {
      connected: true as const,
      needsReauth: !!row.needsReauth,
      connectedAt: row.connectedAt,
      lastSyncAt: row.lastSyncAt ?? null,
    };
  },
});

/** Disconnect: best-effort revoke on Google's side, then drop the local row. */
export const disconnectGoogleCalendar = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<void> => {
    const userId = await requireUserId(ctx);
    const account = await ctx.runQuery(internal.googleOAuth.getGoogleAccountInternal, { userId });
    if (account) {
      await google.revokeToken(account.refreshToken);
      await ctx.runMutation(internal.googleOAuth.deleteGoogleAccountInternal, { userId });
    }
  },
});

/**
 * Google's OAuth redirect target — registered in http.ts. No Zenith
 * session/cookie is available here; `state` (via consumeOAuthState) is how
 * this recovers which user is connecting. Creates the dedicated "Zenith"
 * calendar on first connect only — a reconnect reuses the existing one.
 */
export const googleOAuthCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const appUrl = process.env.GOOGLE_OAUTH_APP_REDIRECT_URL;
  if (!appUrl) return new Response("Missing GOOGLE_OAUTH_APP_REDIRECT_URL", { status: 500 });

  function redirectToApp(params: Record<string, string>): Response {
    const dest = new URL(`${appUrl!.replace(/\/$/, "")}/settings`);
    for (const [k, v] of Object.entries(params)) dest.searchParams.set(k, v);
    return Response.redirect(dest.toString(), 302);
  }

  if (url.searchParams.get("error")) {
    return redirectToApp({ google: "error", reason: url.searchParams.get("error") ?? "denied" });
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return redirectToApp({ google: "error", reason: "missing_code" });

  const userId = await ctx.runMutation(internal.googleOAuth.consumeOAuthState, { state });
  if (!userId) return redirectToApp({ google: "error", reason: "expired_state" });

  try {
    const tokens = await google.exchangeCodeForTokens(code);
    const existing = await ctx.runQuery(internal.googleOAuth.getGoogleAccountInternal, { userId });
    const googleCalendarId = existing?.googleCalendarId ?? (await google.createZenithCalendar(tokens.access_token));

    await ctx.runMutation(internal.googleOAuth.saveGoogleAccount, {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
      googleCalendarId,
    });
    return redirectToApp({ google: "connected" });
  } catch (err) {
    return redirectToApp({ google: "error", reason: err instanceof Error ? err.message.slice(0, 180) : "unknown" });
  }
});
