// Unified reminders. On a Capacitor native build it schedules REAL OS local
// notifications that fire even when the app is closed. On the web it falls back
// to in-tab Notification pings while the app is open. The native plugin is
// loaded via a dynamic string import so it never enters the web bundle.

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

export interface LiveState { waterMl?: number; waterGoal?: number; }

function waterBody(state?: LiveState): string {
  if (!state?.waterGoal) return "Time for a few sips — stay on pace.";
  const behind = (state.waterGoal ?? 3500) - (state.waterMl ?? 0);
  if (behind <= 0) return "Goal hit — nice! Keep sipping if you trained today.";
  if (behind > 1500) return `You're ${behind}ml behind — that's a lot. Drink up now.`;
  if (behind > 500) return `About ${behind}ml to go — a couple of glasses will close the gap.`;
  return "On pace — keep it going. Quick sip.";
}

// Build the concrete daily reminder list from config.
export function planReminders(c: ReminderConfig, includeSupps = true, state?: LiveState): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  let id = 1000;
  if (c.water) {
    const end = c.wakeHour + c.wakingWindowH;
    for (let h = c.wakeHour + c.waterEveryH; h < end; h += c.waterEveryH) {
      out.push({ id: id++, title: "💧 Hydrate", body: waterBody(state), at: hm(h % 24) });
    }
  }
  if (c.session) out.push({ id: id++, title: "⚡ Train", body: "Session time. Go earn today's numbers.", at: c.sessionAt });
  if (includeSupps && c.supps) for (const s of c.suppSchedules) out.push({ id: id++, title: `🧪 ${s.label}`, body: "Scheduled dose.", at: s.time });
  if (c.bedtime) out.push({ id: id++, title: "😴 Wind down", body: "Bedtime — sleep is where you grow.", at: c.bedtimeAt });
  return out;
}

export function isNativeNotifications(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

async function loadPlugin(): Promise<any | null> {
  try {
    const mod = "@capacitor/local-notifications";
    return (await import(/* @vite-ignore */ mod)).LocalNotifications;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNativeNotifications()) {
    const LN = await loadPlugin();
    if (!LN) return false;
    const res = await LN.requestPermissions();
    return res.display === "granted";
  }
  if (typeof Notification === "undefined") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

// Schedule all reminders as repeating daily native notifications.
export async function applyNativeReminders(c: ReminderConfig): Promise<boolean> {
  const LN = await loadPlugin();
  if (!LN) return false;
  const planned = planReminders(c);
  try {
    const pending = await LN.getPending();
    if (pending.notifications?.length) await LN.cancel({ notifications: pending.notifications });
    await LN.schedule({
      notifications: planned.map((p) => {
        const [h, m] = p.at.split(":").map(Number);
        return { id: p.id, title: p.title, body: p.body, schedule: { on: { hour: h, minute: m }, repeats: true } };
      }),
    });
    return true;
  } catch {
    return false;
  }
}

// Web fallback: fire due reminders while the tab is open (checked each minute).
export function startWebReminderLoop(getConfig: () => ReminderConfig): () => void {
  const firedThisMinute = new Set<string>();
  const tick = () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const now = new Date();
    const key = hm(now.getHours(), now.getMinutes());
    if (firedThisMinute.has(key)) return;
    for (const p of planReminders(getConfig(), false)) {
      if (p.at === key) {
        new Notification(p.title, { body: p.body });
        firedThisMinute.add(key);
      }
    }
    if (firedThisMinute.size > 200) firedThisMinute.clear();
  };
  const iv = window.setInterval(tick, 30000);
  tick();
  return () => window.clearInterval(iv);
}
