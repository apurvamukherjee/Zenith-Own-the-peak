// Unified reminders. On a Capacitor native build it schedules REAL OS local
// notifications that fire even when the app is closed. On the web it falls back
// to in-tab Notification pings while the app is open.
// Static import on purpose: a bare dynamic import() survives into the bundle
// unresolved and fails inside the Android WebView. The plugin is a thin
// registerPlugin proxy, so the web bundle cost is negligible.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications as LN } from "@capacitor/local-notifications";

export interface ReminderConfig {
  water: boolean; waterEveryH: number;
  bedtime: boolean; bedtimeAt: string;   // HH:mm
  session: boolean; sessionAt: string;   // HH:mm
  supps: boolean;
  wakeHour: number; wakingWindowH: number;
  suppSchedules: { id: number; label: string; time: string }[];
}

interface PlannedReminder { id: number; title: string; body: string; at: string } // at = HH:mm

function hm(h: number, m = 0) { return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; }

interface LiveState { waterMl?: number; waterGoal?: number; }

function waterBody(state?: LiveState): string {
  if (!state?.waterGoal) return "Time for a few sips — stay on pace.";
  const behind = (state.waterGoal ?? 3500) - (state.waterMl ?? 0);
  if (behind <= 0) return "Goal hit — nice! Keep sipping if you trained today.";
  if (behind > 1500) return `You're ${behind}ml behind — that's a lot. Drink up now.`;
  if (behind > 500) return `About ${behind}ml to go — a couple of glasses will close the gap.`;
  return "On pace — keep it going. Quick sip.";
}

// Build the concrete daily reminder list from config.
function planReminders(c: ReminderConfig, includeSupps = true, state?: LiveState): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  let id = 1000;
  if (c.water) {
    const end = c.wakeHour + c.wakingWindowH;
    for (let h = c.wakeHour + c.waterEveryH; h < end; h += c.waterEveryH) {
      out.push({ id: id++, title: "Hydrate", body: waterBody(state), at: hm(h % 24) });
    }
  }
  if (c.session) out.push({ id: id++, title: "Train", body: "Session time. Go earn today's numbers.", at: c.sessionAt });
  if (includeSupps && c.supps) for (const s of c.suppSchedules) out.push({ id: id++, title: s.label, body: "Scheduled dose.", at: s.time });
  if (c.bedtime) out.push({ id: id++, title: "Wind down", body: "Bedtime — sleep is where you grow.", at: c.bedtimeAt });
  return out;
}

// Android Chrome throws on `new Notification()`; it only allows notifications
// through a service worker registration (public/sw.js).
export async function notify(title: string, body: string): Promise<void> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (reg) await reg.showNotification(title, { body, icon: "/icons/icon-192.png", tag: title });
  else new Notification(title, { body });
}

export function isNativeNotifications(): boolean {
  return Capacitor.isNativePlatform();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNativeNotifications()) {
    const res = await LN.requestPermissions();
    if (res.display !== "granted") return false;
    // Only ever sent to the "Alarms & reminders" screen from this explicit tap;
    // without it, reminders still fire, just inexactly (Doze may delay them).
    if (!(await canExact())) await LN.changeExactNotificationSetting();
    return true;
  }
  if (typeof Notification === "undefined") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

// Repeating daily reminders (planReminders, ids 1000+) and one-off dated task
// reminders (ids TASK_REMINDER_ID_BASE+) both live in the same native pending
// queue, so each scheduler only ever cancels/rewrites notifications in its own
// id range — otherwise re-syncing one would wipe out the other.
export const TASK_REMINDER_ID_BASE = 20000;
const DAILY_REMINDER_ID_BASE = 1000;
// Below both ranges so neither re-sync cancels a running rest timer.
const REST_TIMER_ID = 1;

// The plugin opens the "Alarms & reminders" settings screen on every schedule()
// that asks for an exact alarm it isn't allowed — i.e. on every app launch,
// since the engines re-sync on mount. So only request exact when already granted.
async function canExact(): Promise<boolean> {
  return (await LN.checkExactNotificationSetting()).exact_alarm === "granted";
}

// Schedule all reminders as repeating daily native notifications.
export async function applyNativeReminders(c: ReminderConfig): Promise<boolean> {
  const planned = planReminders(c);
  try {
    const exact = await canExact();
    const pending = await LN.getPending();
    const ours = pending.notifications.filter((n) => n.id >= DAILY_REMINDER_ID_BASE && n.id < TASK_REMINDER_ID_BASE);
    if (ours.length) await LN.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    await LN.schedule({
      notifications: planned.map((p) => {
        const [h, m] = p.at.split(":").map(Number);
        return { id: p.id, title: p.title, body: p.body, schedule: { on: { hour: h, minute: m }, repeats: true }, isExactNotification: exact };
      }),
    });
    return true;
  } catch {
    return false;
  }
}

// Rest timer on native: scheduled with the OS up front because WebView timers
// stall once the app is backgrounded, so a fire-at-zero ping would never land.
export async function scheduleRestNotification(title: string, body: string, at: Date): Promise<void> {
  if ((await LN.checkPermissions()).display !== "granted") return;
  const exact = await canExact();
  await LN.schedule({ notifications: [{ id: REST_TIMER_ID, title, body, schedule: { at, allowWhileIdle: true }, isExactNotification: exact }] });
}
export async function cancelRestNotification(): Promise<void> {
  await LN.cancel({ notifications: [{ id: REST_TIMER_ID }] });
}

export interface OneOffReminder { id: number; title: string; body: string; at: Date }

// Schedule one-off (non-repeating) native notifications for specific dated
// calendar events with a "remind me" time set — distinct from the repeating
// time-of-day reminders above.
export async function applyOneOffReminders(reminders: OneOffReminder[]): Promise<boolean> {
  try {
    const exact = await canExact();
    const pending = await LN.getPending();
    const ours = pending.notifications.filter((n) => n.id >= TASK_REMINDER_ID_BASE);
    if (ours.length) await LN.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    if (reminders.length) {
      await LN.schedule({
        notifications: reminders.map((r) => ({
          id: r.id, title: r.title, body: r.body, schedule: { at: r.at, allowWhileIdle: true }, isExactNotification: exact,
        })),
      });
    }
    return true;
  } catch {
    return false;
  }
}

// Web fallback for one-off task reminders: checked every 30s, fires once a
// reminder's moment has arrived (and hasn't been missed by more than 2
// minutes, so a stale one from before the tab was opened doesn't fire late).
export function startTaskReminderWebLoop(getReminders: () => OneOffReminder[]): () => void {
  const fired = new Set<number>();
  const tick = () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const now = Date.now();
    for (const r of getReminders()) {
      if (fired.has(r.id)) continue;
      const diffMs = r.at.getTime() - now;
      if (diffMs <= 0 && diffMs > -120_000) {
        void notify(r.title, r.body);
        fired.add(r.id);
      }
    }
    if (fired.size > 500) fired.clear();
  };
  const iv = window.setInterval(tick, 30000);
  tick();
  return () => window.clearInterval(iv);
}

// Web fallback: fire due reminders while the tab is open (checked each minute).
export function startWebReminderLoop(getConfig: () => ReminderConfig): () => void {
  const firedThisMinute = new Set<string>();
  const tick = () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const now = new Date();
    const key = hm(now.getHours(), now.getMinutes());
    if (firedThisMinute.has(key)) return;
    for (const p of planReminders(getConfig())) {
      if (p.at === key) {
        void notify(p.title, p.body);
        firedThisMinute.add(key);
      }
    }
    if (firedThisMinute.size > 200) firedThisMinute.clear();
  };
  const iv = window.setInterval(tick, 30000);
  tick();
  return () => window.clearInterval(iv);
}
