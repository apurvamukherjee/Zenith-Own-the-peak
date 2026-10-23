import { useEffect } from "react";
import { useSetting } from "../../hooks/useSettings";
import { useTrainingToday } from "../dashboard/useHomeData";
import { isNativeNotifications, applyOneOffReminders, startTaskReminderWebLoop, ARC_RANGE } from "../../lib/notifications";
import { planArcPushes } from "../../lib/arcVoice";
import { drillAmount, minimumOf } from "../../lib/winterArc";
import { useArcToday } from "./useWinterArc";

// Re-plans the arc's pushes from real data on every relevant change: finishing
// or pausing today cancels the rest of today's, and each open re-writes the
// 7-day pre-schedule that covers the days you don't open the app.

export function useArcVoice(): void {
  const on = Number(useSetting("remArc")) === 1;
  const joined = String(useSetting("arcJoined"));
  const tone = Number(useSetting("arcTone"));
  const profanity = Number(useSetting("arcProfanity")) === 1;
  const wakeHour = Number(useSetting("wakeHour"));
  const bedtime = String(useSetting("remBedtimeAt"));
  const training = useTrainingToday();
  const arc = useArcToday(training?.muscles);

  const pushes = on && arc ? planArcPushes({
    today: arc.date, now: Date.now(), joined, todayCovered: !!arc.row, missed: arc.missed,
    drill: { name: arc.drill.name, amount: drillAmount(arc.drill), minimum: drillAmount(minimumOf(arc.drill)) },
    wakeHour, bedtime, ceiling: Math.max(0, Math.min(3, tone)) as 0 | 1 | 2 | 3, profanity,
  }) : [];

  const key = pushes.map((p) => `${p.id}:${p.at.getTime()}:${p.body}`).join("|");
  useEffect(() => {
    if (isNativeNotifications()) {
      void applyOneOffReminders(pushes, ARC_RANGE);
      return;
    }
    return startTaskReminderWebLoop(() => pushes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
