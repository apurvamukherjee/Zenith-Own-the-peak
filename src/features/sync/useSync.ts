import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../../lib/supabase";
import { exportAll, importAll, db } from "../../db/db";
import { onMutation } from "../../lib/mutations";
import { useSetting, setSetting } from "../../hooks/useSettings";

type Status = "idle" | "syncing" | "error";

// Snapshot sync: the whole local DB is stored as one JSON row per user in the
// `backups` table. Auto-backup pushes on change (debounced); Restore pulls it
// back on a new device. Simple, robust, conflict-free (last write wins).
export function useSync() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const autoBackup = useSetting("autoBackup");
  const pushTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const backupNow = useCallback(async () => {
    if (!supabase || !session) return;
    setStatus("syncing");
    try {
      const json = await exportAll();
      const { error } = await supabase.from("backups").upsert({
        user_id: session.user.id,
        data: JSON.parse(json),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setLastBackupAt(new Date().toISOString());
      // lifetime counter (read-modify-write; drives the "Vault" achievement)
      const cur = await db.settings.get("backupCount");
      await setSetting("backupCount", Number(cur?.value ?? 0) + 1);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [session]);

  const restore = useCallback(async (): Promise<"ok" | "empty" | "error"> => {
    if (!supabase || !session) return "error";
    setStatus("syncing");
    try {
      const { data, error } = await supabase
        .from("backups").select("data, updated_at")
        .eq("user_id", session.user.id).maybeSingle();
      if (error) throw error;
      setStatus("idle");
      if (!data?.data) return "empty";
      await importAll(JSON.stringify(data.data));
      setLastBackupAt(data.updated_at);
      return "ok";
    } catch {
      setStatus("error");
      return "error";
    }
  }, [session]);

  // Auto-backup: debounce a push a few seconds after the last change.
  useEffect(() => {
    if (!supabase || !session || Number(autoBackup) !== 1) return;
    const off = onMutation(() => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => { void backupNow(); }, 4000);
    });
    return () => {
      off();
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [session, autoBackup, backupNow]);

  return {
    configured: supabaseConfigured,
    session,
    status,
    lastBackupAt,
    autoBackup: Number(autoBackup) === 1,
    setAutoBackup: (v: boolean) => setSetting("autoBackup", v ? 1 : 0),
    backupNow,
    restore,
    sendCode: (email: string) =>
      supabase?.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }),
    verifyCode: (email: string, token: string) =>
      supabase?.auth.verifyOtp({ email, token, type: "email" }),
    signOut: () => supabase?.auth.signOut(),
  };
}
