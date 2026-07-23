import { useCallback, useEffect, useRef, useState } from "react";
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

  const [status, setStatus] = useState<Status>("idle");
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  // Ticks on every successful backup so the UI can pulse "cloud saw the change".
  const [lastBackupTick, setLastBackupTick] = useState(0);
  const autoBackup = useSetting("autoBackup");
  const pushTimer = useRef<number | null>(null);
  const hasSyncedThisSession = useRef(false);

  useEffect(() => {
    if (backupRow) setLastBackupAt(new Date(backupRow.updatedAt).toISOString());
  }, [backupRow]);

  const backupNow = useCallback(async () => {
    if (!isAuthenticated) return;
    setStatus("syncing");
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

      setLastBackupAt(new Date().toISOString());
      setLastBackupTick((t) => t + 1);
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

      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [isAuthenticated, generateUploadUrl, saveBackup, ensureProfile, pushWeeklySnapshot]);

  const restore = useCallback(async (): Promise<"ok" | "empty" | "error"> => {
    if (!isAuthenticated) return "error";
    setStatus("syncing");
    try {
      if (!backupRow) {
        setStatus("idle");
        return "empty";
      }
      const res = await fetch(backupRow.url);
      const json = await res.text();
      await importAll(json);
      setLastBackupAt(new Date(backupRow.updatedAt).toISOString());
      setStatus("idle");
      return "ok";
    } catch {
      setStatus("error");
      return "error";
    }
  }, [isAuthenticated, backupRow]);

  // First sync on sign-in: push immediately so profile/leaderboard/backup
  // exist right away instead of waiting for the next local edit + debounce.
  useEffect(() => {
    if (!isAuthenticated || hasSyncedThisSession.current) return;
    hasSyncedThisSession.current = true;
    void backupNow();
  }, [isAuthenticated, backupNow]);

  // Auto-backup: debounce a push a few seconds after the last change.
  useEffect(() => {
    if (!isAuthenticated || Number(autoBackup) !== 1) return;
    const off = onMutation(() => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => {
        void backupNow();
      }, 4000);
    });
    return () => {
      off();
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [isAuthenticated, autoBackup, backupNow]);

  return {
    isLoading,
    session: isAuthenticated && viewer ? { user: { id: viewer.id, email: viewer.email ?? "" } } : null,
    status,
    lastBackupAt,
    lastBackupTick,
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
