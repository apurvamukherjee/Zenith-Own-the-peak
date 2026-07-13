import { useEffect, useRef } from "react";
import type { ScheduleDto, ScheduleLogDto } from "../db/types";
import { slotStatus } from "../features/nutrition/useNutrition";

// While the app is open, checks the schedule each minute and fires a browser
// notification for anything now due. Real background reminders arrive when the
// app is wrapped with Capacitor Local Notifications (see ARCHITECTURE.md).
export function useReminders(schedules: ScheduleDto[], logs: ScheduleLogDto[]) {
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const doneIds = new Set(logs.map((l) => l.scheduleId));

    const check = () => {
      for (const s of schedules) {
        if (!s.active || !s.id) continue;
        const status = slotStatus(s.time, doneIds.has(s.id));
        const key = `${s.id}-${new Date().toDateString()}`;
        if (status === "due" && !notified.current.has(key)) {
          notified.current.add(key);
          new Notification(`Zenith · ${s.label}`, {
            body: s.dose ? `${s.dose} · scheduled ${s.time}` : `Scheduled for ${s.time}`,
          });
        }
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [schedules, logs]);
}

export async function requestReminderPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}
