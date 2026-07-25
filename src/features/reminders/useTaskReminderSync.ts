import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import {
  isNativeNotifications, applyOneOffReminders, startTaskReminderWebLoop,
  TASK_REMINDER_ID_BASE, type OneOffReminder,
} from "../../lib/notifications";

const HORIZON_DAYS = 14;

// Generalizes reminders beyond the hardcoded water/bedtime/session/supplement
// set: any calendar event with a time + "remind me" (Phase 8's EventEditorSheet)
// gets a real one-off notification. Mounted once at app root, alongside
// useReminderEngine (which still owns the repeating daily reminders).
export function useTaskReminderSync(): void {
  const remEvents = Number(useSetting("remEvents")) === 1;

  const reminders = useLiveQuery(async () => {
    if (!remEvents) return [] as OneOffReminder[];
    const today = dayjs().format("YYYY-MM-DD");
    const end = dayjs().add(HORIZON_DAYS, "day").format("YYYY-MM-DD");
    const tasks = await db.tasks
      .where("date").between(today, end, true, true)
      .and((t) => !!t.time && t.remindBefore != null && t.status !== "done" && t.status !== "cancelled")
      .toArray();
    const now = dayjs();
    const out: OneOffReminder[] = [];
    for (const t of tasks) {
      if (!t.id || !t.time || t.remindBefore == null) continue;
      const at = dayjs(`${t.date} ${t.time}`, "YYYY-MM-DD HH:mm").subtract(t.remindBefore, "minute");
      if (at.isBefore(now)) continue;
      out.push({
        id: TASK_REMINDER_ID_BASE + t.id,
        title: t.title,
        body: t.location ? `Scheduled ${t.time} · ${t.location}` : `Scheduled for ${t.time}`,
        at: at.toDate(),
      });
    }
    return out;
  }, [remEvents]) ?? [];

  const key = reminders.map((r) => `${r.id}:${r.at.getTime()}`).join(",");
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isNativeNotifications()) {
      void applyOneOffReminders(reminders);
    } else {
      cleanup = startTaskReminderWebLoop(() => reminders);
    }
    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
