import { useState } from "react";
import { Card, Switch, TimePicker, InputNumber, Button, App, Divider } from "antd";
import { TbBell, TbBellRinging } from "react-icons/tb";
import dayjs from "dayjs";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { requestNotificationPermission, isNativeNotifications } from "../../lib/notifications";

function Row({ label, hint, checked, onChange, control }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; control?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{hint}</div>}
      </div>
      {checked && control}
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

export function RemindersCard() {
  const { message } = App.useApp();
  const [granted, setGranted] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted");

  const remWater = Number(useSetting("remWater")) === 1;
  const remWaterEveryH = Number(useSetting("remWaterEveryH"));
  const remBedtime = Number(useSetting("remBedtime")) === 1;
  const remBedtimeAt = String(useSetting("remBedtimeAt"));
  const remSession = Number(useSetting("remSession")) === 1;
  const remSessionAt = String(useSetting("remSessionAt"));
  const remSupps = Number(useSetting("remSupps")) === 1;

  async function enable() {
    const ok = await requestNotificationPermission();
    setGranted(ok);
    message[ok ? "success" : "info"](ok
      ? (isNativeNotifications() ? "Reminders scheduled — they'll fire even when the app is closed." : "Reminders on while the app is open.")
      : "Allow notifications to get reminders.");
  }

  return (
    <Card size="small" style={{ marginBottom: 12 }}
      title={<span><TbBell style={{ verticalAlign: "-2px" }} /> Reminders</span>}
      extra={<Button size="small" type={granted ? "default" : "primary"} icon={<TbBellRinging />} onClick={enable}>
        {granted ? "Re-apply" : "Enable"}</Button>}>
      {!isNativeNotifications() && (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>
          On the web these fire while the app is open. Install the native app (Capacitor) for
          reminders that buzz even when it's closed.
        </div>
      )}
      <Row label="Hydration nudges" hint="Every few hours through your day"
        checked={remWater} onChange={(v) => setSetting("remWater", v ? 1 : 0)}
        control={<InputNumber size="small" min={1} max={6} value={remWaterEveryH}
          onChange={(v) => setSetting("remWaterEveryH", v ?? 2)} addonAfter="h" style={{ width: 92 }} />} />
      <Divider style={{ margin: "4px 0" }} />
      <Row label="Session reminder" hint="Nudge to train"
        checked={remSession} onChange={(v) => setSetting("remSession", v ? 1 : 0)}
        control={<TimePicker inputReadOnly size="small" value={dayjs(remSessionAt, "HH:mm")} format="HH:mm"
          needConfirm={false} allowClear={false} onChange={(v) => v && setSetting("remSessionAt", v.format("HH:mm"))} />} />
      <Divider style={{ margin: "4px 0" }} />
      <Row label="Bedtime wind-down" hint="Protect your sleep"
        checked={remBedtime} onChange={(v) => setSetting("remBedtime", v ? 1 : 0)}
        control={<TimePicker inputReadOnly size="small" value={dayjs(remBedtimeAt, "HH:mm")} format="HH:mm"
          needConfirm={false} allowClear={false} onChange={(v) => v && setSetting("remBedtimeAt", v.format("HH:mm"))} />} />
      <Divider style={{ margin: "4px 0" }} />
      <Row label="Supplement / med times" hint="From your Nutrition schedule"
        checked={remSupps} onChange={(v) => setSetting("remSupps", v ? 1 : 0)} />
    </Card>
  );
}
