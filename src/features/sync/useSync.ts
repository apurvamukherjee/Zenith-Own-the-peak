import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { exportAll, importAll, db } from "../../db/db";
import { onMutation } from "../../lib/mutations";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { getTotalXP, xpToLevel, isoWeek } from "../../lib/xp";
import { computeTodayScore } from "../../lib/todayScore";
import { computeUnifiedStreak } from "../../lib/streak.utils";
import { ACHIEVEMENTS } from "../../lib/achievements";

export { convexConfigured } from "../../lib/convexClient";

type Status = "idle" | "syncing" | "error";

// One status for the whole app: the background engine and whichever screen
// shows the Sync card must agree on "syncing", and a second backup must never
// start while one is in flight.
let syncStatus: Status = "idle";
const statusListeners = new Set<() => void>();
function setSyncStatus(next: Status) {
  syncStatus = next;
  statusListeners.forEach((l) => l());
}
function subscribeStatus(l: () => void) {
  statusListeners.add(l);
  return () => { statusListeners.delete(l); };
}
const getStatus = () => syncStatus;
const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

// Snapshot sync: the whole local DB is stored as one file per user in Convex
// file storage (see convex/backups.ts — a plain document field would risk
// hitting Convex's ~1MiB doc cap once dayPhotos accumulates). Auto-backup
// pushes on change (debounced); Restore pulls it back on a new device.
export function useSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut: authSignOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const backupRow = useQuery(api.backups.getBackup, isAuthenticated ? {} : "skip");

  const ensureProfile = useMutation(api.social.ensureProfile);
  const pushWeeklySnapshot = useMutation(api.social.pushWeeklySnapshot);
  const generateUploadUrl = useMutation(api.backups.generateUploadUrl);
  const saveBackup = useMutation(api.backups.saveBackup);

  const status = useSyncExternalStore(subscribeStatus, getStatus);
  const lastBackupAt = backupRow ? new Date(backupRow.updatedAt).toISOString() : null;
  const autoBackup = useSetting("autoBackup");

  const backupNow = useCallback(async () => {
    if (!isAuthenticated || getStatus() === "syncing") return;
    setSyncStatus("syncing");
    try {
      // 1. Upload the full local export as a file (3-step Convex upload flow).
      const json = await exportAll();
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const { storageId } = await uploadRes.json();
      await saveBackup({ storageId });

      // Lifetime counter (read-modify-write; drives the "Vault" achievement).
      const cur = await db.settings.get("backupCount");
      await setSetting("backupCount", Number(cur?.value ?? 0) + 1);

      // 2. Ensure profile + push weekly leaderboard snapshot. The stats are
      // computed here (client-side, from Dexie) since Convex functions have
      // no access to IndexedDB — only the persistence step is server-side.
      const name = String((await db.settings.get("name"))?.value ?? "Anonymous");
      const shareCode = await ensureProfile({ displayName: name }).catch(() => "");
      if (shareCode) await db.settings.put({ key: "shareCode" as any, value: shareCode });

      const totalXP = await getTotalXP();
      const level = xpToLevel(totalXP);
      const weekKey = isoWeek();
      const waterGoal = Number((await db.settings.get("waterGoalMl"))?.value ?? 3500);
      const proteinTarget = Number((await db.settings.get("proteinTargetG"))?.value ?? 100);
      const streak = await computeUnifiedStreak();
      const todayScore = await computeTodayScore(waterGoal, proteinTarget);

      const monday = getMonday(new Date());
      const sets = await db.workoutSets.where("date").aboveOrEqual(monday).toArray();
      const volumeKg = Math.round(sets.reduce((s, r) => s + r.weightKg * r.reps, 0));

      const weekEvents = await db.xpEvents.where("weekKey").equals(weekKey).toArray();
      const weekXP = weekEvents.reduce((s, e) => s + e.xp, 0);

      const allBadges = await db.achievements.toArray();
      const tierRank: Record<string, number> = { mythic: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
      const badgeViews = allBadges
        .map((b) => {
          const def = ACHIEVEMENTS.find((a) => a.id === b.id);
          return def ? { id: def.id, name: def.name, tier: def.tier } : null;
        })
        .filter(Boolean) as { id: string; name: string; tier: string }[];
      badgeViews.sort((a, b) => (tierRank[b.tier] ?? 0) - (tierRank[a.tier] ?? 0));
      const topBadges = badgeViews.slice(0, 6);

      await pushWeeklySnapshot({
        weekKey,
        disciplineAvg: todayScore.score,
        streakEnd: streak,
        volumeKg,
        xpEarned: weekXP,
        level: level.level,
        totalXp: totalXP,
        topBadges,
        badgeCount: allBadges.length,
      }).catch(() => {});

      // Our own settings writes above bump the mutation bus on a macrotask;
      // let those land while we still read as "syncing" so the auto-backup
      // listener can tell them from real edits.
      await nextTick();
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
    }
  }, [isAuthenticated, generateUploadUrl, saveBackup, ensureProfile, pushWeeklySnapshot]);

  const restore = useCallback(async (): Promise<"ok" | "empty" | "busy" | "error"> => {
    if (!isAuthenticated) return "error";
    if (getStatus() === "syncing") return "busy";
    if (!backupRow) return "empty";
    setSyncStatus("syncing");
    try {
      const res = await fetch(backupRow.url);
      if (!res.ok) throw new Error(`Backup download failed: ${res.status}`);
      await importAll(await res.text());
      setSyncStatus("idle");
      return "ok";
    } catch {
      setSyncStatus("error");
      return "error";
    }
  }, [isAuthenticated, backupRow]);

  return {
    isLoading,
    session: isAuthenticated && viewer ? { user: { id: viewer.id, email: viewer.email ?? "" } } : null,
    status,
    lastBackupAt,
    autoBackup: Number(autoBackup) === 1,
    setAutoBackup: (v: boolean) => setSetting("autoBackup", v ? 1 : 0),
    backupNow,
    restore,
    sendCode: (email: string) => signIn("resend-otp", { email }),
    verifyCode: (email: string, code: string) => signIn("resend-otp", { email, code }),
    signOut: () => authSignOut(),
  };
}

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

// Headless, mounted once in AppShell (behind convexConfigured): owns the
// sign-in push and auto-backup so they run app-wide, not only while a screen
// that happens to call useSync() is open.
export function CloudSyncEngine() {
  const { isAuthenticated } = useConvexAuth();
  const { backupNow, autoBackup } = useSync();
  const timer = useRef<number | null>(null);
  const pushedForSession = useRef(false);

  // Push right after sign-in so profile, leaderboard and backup exist
  // without waiting for the next local edit.
  useEffect(() => {
    if (!isAuthenticated) { pushedForSession.current = false; return; }
    if (pushedForSession.current) return;
    pushedForSession.current = true;
    void backupNow();
  }, [isAuthenticated, backupNow]);

  useEffect(() => {
    if (!isAuthenticated || !autoBackup) return;
    const off = onMutation((table) => {
      // backupNow's own writes (backupCount, shareCode) land in settings
      // mid-backup; acting on them would re-upload forever.
      // ponytail: a user settings edit made during those few seconds is also
      // skipped until the next change; tag writes by source if that matters.
      if (table === "settings" && getStatus() === "syncing") return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => { void backupNow(); }, 4000);
    });
    return () => {
      off();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [isAuthenticated, autoBackup, backupNow]);

  return null;
}
