import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { db } from "../../db/db";
import { onMutation, suppressMutations } from "../../lib/mutations";
import { todayKey } from "../../lib/date.utils";
import type { TaskDto } from "../../db/types";
import { taskToGoogleEventBody, googleEventToTaskChanges, type PulledEventLike } from "./googleTaskMapping";
import dayjs from "dayjs";

// Only genuinely-scheduled, non-cancelled tasks are calendar-visible to begin
// with (same population lib/icsExport.ts already uses). Push is additionally
// bounded to a window around today so a first connect doesn't recreate every
// dated task ever logged (e.g. months of past daily med reminders) as
// one-time Google events — existing history stays local-only.
const PUSH_WINDOW_PAST_DAYS = 7;
const PUSH_WINDOW_FUTURE_DAYS = 180;

type Status = "idle" | "syncing" | "error";

export function useGoogleCalendarSync() {
  const { isAuthenticated } = useConvexAuth();
  const accountStatus = useQuery(api.googleOAuth.googleAccountStatus, isAuthenticated ? {} : "skip");
  const startOAuth = useMutation(api.googleOAuth.startGoogleOAuth);
  const disconnectAction = useAction(api.googleOAuth.disconnectGoogleCalendar);
  const pullAction = useAction(api.googleCalendarSync.pullGoogleCalendarChanges);
  const pushAction = useAction(api.googleCalendarSync.pushGoogleCalendarChanges);

  const [status, setStatus] = useState<Status>("idle");
  const pushTimer = useRef<number | null>(null);
  const wasConnected = useRef(false);
  const busyRef = useRef(false); // collapses overlapping pull/push calls

  const pullNow = useCallback(async () => {
    if (!isAuthenticated || !accountStatus?.connected || accountStatus.needsReauth || busyRef.current) return;
    busyRef.current = true;
    setStatus("syncing");
    try {
      const { changed } = await pullAction({});
      suppressMutations(true);
      try {
        for (const event of changed as PulledEventLike[]) {
          const match = await db.tasks.where("googleEventId").equals(event.id).first();
          const changes = googleEventToTaskChanges(event);
          const stamp = {
            googleUpdatedAt: event.updated ? Date.parse(event.updated) : Date.now(),
            syncedAt: Date.now(),
          };
          if (match?.id) {
            await db.tasks.update(match.id, { ...changes, ...stamp, updatedAt: stamp.syncedAt });
          } else if (event.status !== "cancelled") {
            // Brand-new event from Google's side (created directly there, or
            // the first time we've ever seen it) — changes already carries
            // every field a new TaskDto needs (title/status/priority/listId/date).
            await db.tasks.add({
              ...changes,
              googleEventId: event.id,
              ...stamp,
              createdAt: stamp.syncedAt,
              updatedAt: stamp.syncedAt,
            } as TaskDto);
          }
          // A cancelled event with no local match is most likely the
          // confirmation of a delete we just pushed — nothing to do.
        }
      } finally {
        suppressMutations(false);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      busyRef.current = false;
    }
  }, [isAuthenticated, accountStatus?.connected, accountStatus?.needsReauth, pullAction]);

  const pushNow = useCallback(async () => {
    if (!isAuthenticated || !accountStatus?.connected || accountStatus.needsReauth || busyRef.current) return;
    busyRef.current = true;
    setStatus("syncing");
    try {
      const windowStart = dayjs(todayKey()).subtract(PUSH_WINDOW_PAST_DAYS, "day").format("YYYY-MM-DD");
      const windowEnd = dayjs(todayKey()).add(PUSH_WINDOW_FUTURE_DAYS, "day").format("YYYY-MM-DD");
      const windowTasks = await db.tasks.where("date").between(windowStart, windowEnd, true, true).toArray();
      const dirty = windowTasks.filter((t) => t.status !== "cancelled" && t.updatedAt > (t.syncedAt ?? 0));

      const outboxRows = await db.googleSyncOutbox.toArray();

      if (dirty.length === 0 && outboxRows.length === 0) {
        setStatus("idle");
        return;
      }

      const { saved } = await pushAction({
        upserts: dirty.map((t) => ({
          localTaskId: t.id!,
          googleEventId: t.googleEventId,
          body: taskToGoogleEventBody(t),
        })),
        deletedEventIds: outboxRows.map((r) => r.googleEventId),
      });

      suppressMutations(true);
      try {
        for (const s of saved) {
          const stamp = Date.now();
          await db.tasks.update(s.localTaskId, {
            googleEventId: s.googleEventId,
            googleUpdatedAt: s.updated ? Date.parse(s.updated) : stamp,
            syncedAt: stamp,
          });
        }
        if (outboxRows.length) await db.googleSyncOutbox.bulkDelete(outboxRows.map((r) => r.id!));
      } finally {
        suppressMutations(false);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      busyRef.current = false;
    }
  }, [isAuthenticated, accountStatus?.connected, accountStatus?.needsReauth, pushAction]);

  const syncNow = useCallback(async () => {
    await pullNow();
    await pushNow();
  }, [pullNow, pushNow]);

  async function connect() {
    const { authUrl } = await startOAuth({});
    window.location.href = authUrl;
  }
  async function disconnect() {
    await disconnectAction({});
  }

  // First pull the moment the account transitions disconnected → connected
  // (right after the OAuth redirect lands back on Settings), not on Zenith
  // sign-in — those are different events.
  useEffect(() => {
    if (accountStatus?.connected && !accountStatus.needsReauth && !wasConnected.current) {
      wasConnected.current = true;
      void pullNow();
    }
    if (!accountStatus?.connected) wasConnected.current = false;
  }, [accountStatus?.connected, accountStatus?.needsReauth, pullNow]);

  // Debounced push whenever local data changes. Reuses the same bus/pattern
  // as auto-backup (src/features/sync/useSync.ts) — imprecise (any Dexie
  // write anywhere resets this timer, not just task edits) but that's the
  // established, already-shipping precedent for this exact kind of debounce.
  useEffect(() => {
    if (!isAuthenticated || !accountStatus?.connected || accountStatus.needsReauth) return;
    const off = onMutation(() => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => { void pushNow(); }, 4000);
    });
    return () => {
      off();
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [isAuthenticated, accountStatus?.connected, accountStatus?.needsReauth, pushNow]);

  return {
    status: accountStatus ?? null,
    syncStatus: status,
    connect,
    disconnect,
    syncNow,
    pullNow,
  };
}

// Background half of sync — mounted once app-wide (in AppShell, gated behind
// convexConfigured same as everything else Convex-dependent) so the debounced
// push-on-change and pull-on-connect effects run regardless of which page the
// user has open, not just while Settings is. GoogleCalendarCard additionally
// calls useGoogleCalendarSync() itself for its own UI (status/connect/
// disconnect/manual sync) — a second, independent hook instance; the only
// cost of the overlap is a possible redundant extra pull right after connect,
// which is harmless (upsert-by-googleEventId makes re-applying a no-op).
export function GoogleCalendarSyncEngine() {
  useGoogleCalendarSync();
  return null;
}
