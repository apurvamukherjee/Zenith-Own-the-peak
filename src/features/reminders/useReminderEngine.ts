import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import {
  type ReminderConfig, isNativeNotifications, applyNativeReminders, startWebReminderLoop,
} from "../../lib/notifications";

// Builds the live reminder config from settings + supplement schedules and
// keeps the platform scheduler in sync. Mounted once at app root.
export function useReminderEngine(): ReminderConfig {
  const remWater = useSetting("remWater");
  const remWaterEveryH = useSetting("remWaterEveryH");
  const remBedtime = useSetting("remBedtime");
  const remBedtimeAt = useSetting("remBedtimeAt");
  const remSession = useSetting("remSession");
  const remSessionAt = useSetting("remSessionAt");
  const remSupps = useSetting("remSupps");
  const wakeHour = useSetting("wakeHour");
  const wakingWindowH = useSetting("wakingWindowH");

  const suppSchedules = useLiveQuery(async () => {
    const rows = await db.schedules.toArray();
    return rows
      .filter((s) => s.kind !== "meal")
      .map((s) => ({ id: s.id ?? 0, label: s.label, time: s.time }));
  }, []) ?? [];

  const config: ReminderConfig = {
    water: Number(remWater) === 1, waterEveryH: Number(remWaterEveryH),
    bedtime: Number(remBedtime) === 1, bedtimeAt: String(remBedtimeAt),
    session: Number(remSession) === 1, sessionAt: String(remSessionAt),
    supps: Number(remSupps) === 1,
    wakeHour: Number(wakeHour), wakingWindowH: Number(wakingWindowH),
    suppSchedules,
  };

  const key = JSON.stringify(config);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (isNativeNotifications()) {
      void applyNativeReminders(config);
    } else {
      cleanup = startWebReminderLoop(() => config);
    }
    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return config;
}
