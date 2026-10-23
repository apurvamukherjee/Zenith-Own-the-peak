import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useSetting } from "../../hooks/useSettings";
import { useTrainingToday } from "../dashboard/useHomeData";
import { isNativeNotifications, applyOneOffReminders, startTaskReminderWebLoop, ensureArcPrivateChannel, ARC_RANGE } from "../../lib/notifications";
import { planArcPushes } from "../../lib/arcVoice";
import { drillAmount, minimumOf, shiftDate } from "../../lib/winterArc";
import { parseVow } from "../../lib/arcChecklist";
import { useArcToday } from "./useWinterArc";

// Re-plans the arc's pushes from real data on every relevant change: finishing
// or pausing today cancels the rest of today's, and each open re-writes the
// 7-day pre-schedule that covers the days you don't open the app.
// iOS caps pending notifications at 64 app-wide, so it gets a 4-day horizon.
const HORIZON_DAYS = Capacitor.getPlatform() === "ios" ? 4 : 7;

export function useArcVoice(): void {
  const on = Number(useSetting("remArc")) === 1;
  const joined = String(useSetting("arcJoined"));
  const tone = Number(useSetting("arcTone"));
  const profanity = Number(useSetting("arcProfanity")) === 1;
  const wakeHour = Number(useSetting("wakeHour"));
  const bedtime = String(useSetting("remBedtimeAt"));
  const skipped = String(useSetting("arcSkipped"));
  const ifThen = String(useSetting("arcIfThen"));
  const vowWhen = parseVow(String(useSetting("arcVow")))?.when;
  const examUntil = String(useSetting("arcExamUntil"));
  const training = useTrainingToday();
  const arc = useArcToday(training?.muscles);

  const pushes = on && arc ? planArcPushes({
    today: arc.date, now: Date.now(), joined, todayCovered: !!arc.row, missed: arc.missed,
    quietToday: skipped === arc.date,
    plan: skipped && ifThen ? { date: shiftDate(skipped, 1), text: ifThen } : undefined,
    drill: { name: arc.drill.name, amount: drillAmount(arc.drill), minimum: drillAmount(minimumOf(arc.drill)) },
    wakeHour, bedtime, anchorMin: vowWhen ? Number(vowWhen.slice(0, 2)) * 60 + Number(vowWhen.slice(3, 5)) : undefined, ceiling: Math.max(0, Math.min(3, tone)) as 0 | 1 | 2 | 3, profanity, horizonDays: HORIZON_DAYS, examUntil,
  }) : [];

  const key = pushes.map((p) => `${p.id}:${p.at.getTime()}:${p.body}`).join("|");
  useEffect(() => {
    if (isNativeNotifications()) {
      void (profanity ? ensureArcPrivateChannel() : Promise.resolve()).then(() => applyOneOffReminders(pushes, ARC_RANGE));
      return;
    }
    return startTaskReminderWebLoop(() => pushes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
