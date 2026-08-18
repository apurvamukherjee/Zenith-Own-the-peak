import { action, type ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import * as google from "./lib/googleClient";

async function requireUserId(ctx: ActionCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  return userId;
}

const REFRESH_SAFETY_MARGIN_MS = 60_000;

/**
 * Returns a Google account row guaranteed to have a live access token,
 * refreshing it first if it's expired (or close to it). Throws "needs_reauth"
 * (and flags the account) if Google reports the refresh token itself is no
 * longer valid — e.g. the user revoked access from their Google Account.
 */
async function getValidAccount(ctx: ActionCtx, userId: Id<"users">): Promise<Doc<"googleCalendarAccounts">> {
  const account = await ctx.runQuery(internal.googleOAuth.getGoogleAccountInternal, { userId });
  if (!account) throw new Error("Google Calendar not connected");
  if (account.needsReauth) throw new Error("needs_reauth");
  if (account.accessTokenExpiresAt > Date.now() + REFRESH_SAFETY_MARGIN_MS) return account;

  try {
    const refreshed = await google.refreshAccessToken(account.refreshToken);
    const accessTokenExpiresAt = Date.now() + refreshed.expires_in * 1000;
    await ctx.runMutation(internal.googleOAuth.patchGoogleAccountInternal, {
      userId, accessToken: refreshed.access_token, accessTokenExpiresAt,
    });
    return { ...account, accessToken: refreshed.access_token, accessTokenExpiresAt };
  } catch (err) {
    if (err instanceof Error && (err as Error & { isInvalidGrant?: boolean }).isInvalidGrant) {
      await ctx.runMutation(internal.googleOAuth.patchGoogleAccountInternal, { userId, needsReauth: true });
      throw new Error("needs_reauth");
    }
    throw err;
  }
}

export interface PulledEvent {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  location?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  updated?: string;
  extendedProperties?: { private?: Record<string, string> };
}

/**
 * Pulls everything changed on the Zenith calendar since the last pull (via
 * Google's incremental syncToken), or does a full resync if no token is
 * stored yet or Google reports it expired. Returns the raw changed/deleted
 * events for the client to merge into Dexie — this action never touches
 * IndexedDB, Convex has no access to it.
 */
export const pullGoogleCalendarChanges = action({
  args: {},
  handler: async (ctx, _args): Promise<{ calendarId: string; changed: PulledEvent[] }> => {
    const userId = await requireUserId(ctx);
    const account = await getValidAccount(ctx, userId);

    let syncToken = account.syncToken;
    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;
    const allItems: google.GoogleEvent[] = [];

    // A 410 mid-loop means the syncToken is stale — drop it and restart the
    // whole fetch as a full resync. Only one retry: a full resync can't 410.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        allItems.length = 0;
        pageToken = undefined;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const page = await google.listEvents(account.accessToken, account.googleCalendarId, { syncToken, pageToken });
          allItems.push(...page.items);
          if (page.nextSyncToken) nextSyncToken = page.nextSyncToken;
          if (!page.nextPageToken) break;
          pageToken = page.nextPageToken;
        }
        break;
      } catch (err) {
        if (err instanceof google.SyncTokenExpiredError && attempt === 0) {
          syncToken = undefined;
          continue;
        }
        throw err;
      }
    }

    // Only persist the new token after the full page loop succeeds — a
    // mid-loop network failure leaves the prior token in place, so the next
    // pull just redoes the incremental fetch for free (no partial-state bugs).
    if (nextSyncToken) {
      await ctx.runMutation(internal.googleOAuth.patchGoogleAccountInternal, {
        userId, syncToken: nextSyncToken, lastSyncAt: Date.now(),
      });
    }

    return {
      calendarId: account.googleCalendarId,
      changed: allItems.map((e) => ({
        id: e.id,
        status: e.status,
        summary: e.summary,
        location: e.location,
        description: e.description,
        start: e.start,
        end: e.end,
        updated: e.updated,
        extendedProperties: e.extendedProperties,
      })),
    };
  },
});

const upsertShape = v.object({
  localTaskId: v.number(),
  googleEventId: v.optional(v.string()),
  // Pre-built Google Calendar event JSON — field mapping lives client-side
  // (src/features/googleCalendar/googleTaskMapping.ts) so there's exactly
  // one place that knows how a TaskDto becomes a Google event, not one on
  // each side of the wire.
  body: v.any(),
});

/**
 * Pushes locally-changed tasks to Google (insert or patch) and applies
 * queued deletions. Returns per-task results so the client can persist the
 * resulting googleEventId/updated timestamp back onto each Dexie row.
 */
export const pushGoogleCalendarChanges = action({
  args: {
    upserts: v.array(upsertShape),
    deletedEventIds: v.array(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ saved: { localTaskId: number; googleEventId: string; updated: string | null }[] }> => {
    const userId = await requireUserId(ctx);
    const account = await getValidAccount(ctx, userId);

    const saved: { localTaskId: number; googleEventId: string; updated: string | null }[] = [];
    for (const item of args.upserts) {
      const event = item.googleEventId
        ? await google.patchEvent(account.accessToken, account.googleCalendarId, item.googleEventId, item.body)
        : await google.insertEvent(account.accessToken, account.googleCalendarId, item.body);
      saved.push({ localTaskId: item.localTaskId, googleEventId: event.id, updated: event.updated ?? null });
    }
    for (const eventId of args.deletedEventIds) {
      await google.deleteEvent(account.accessToken, account.googleCalendarId, eventId);
    }
    if (args.upserts.length || args.deletedEventIds.length) {
      await ctx.runMutation(internal.googleOAuth.patchGoogleAccountInternal, { userId, lastSyncAt: Date.now() });
    }
    return { saved };
  },
});
