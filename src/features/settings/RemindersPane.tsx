import { useState, type ReactNode } from "react";
import { App, Segmented, Switch } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { TbBellRinging, TbBellOff, TbDroplet, TbBarbell, TbMoonStars, TbPill, TbCalendarEvent, TbMinus, TbPlus, TbSnowflake } from "react-icons/tb";
import { TimeSelect } from "../../components/TimeSelect";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useSetting, setSetting, type SettingKey } from "../../hooks/useSettings";
import { requestNotificationPermission, isNativeNotifications } from "../../lib/notifications";

function webPermission(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

function ToggleRow({ k, row, icon, color, label, hint, children }: {
  k: SettingKey; row: string; icon: ReactNode; color: string; label: string; hint: string; children?: ReactNode;
}) {
  const on = Number(useSetting(k)) === 1;
  return (
    <div data-row={row}>
      <ListRow icon={icon} color={color} label={label} hint={hint}
        right={<Switch checked={on} onChange={(v) => setSetting(k, v ? 1 : 0)} aria-label={label} />} />
      <AnimatePresence initial={false}>
        {on && children && (
          <motion.div className="zs-reveal" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
            <div className="z-row__body zs-reveal__inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RemindersPane() {
  const { message } = App.useApp();
  const native = isNativeNotifications();
  const [perm, setPerm] = useState(webPermission);
  const every = Number(useSetting("remWaterEveryH"));
  const sessionAt = String(useSetting("remSessionAt"));
  const bedAt = String(useSetting("remBedtimeAt"));
  const arcTone = Number(useSetting("arcTone"));
  const arcProfanity = Number(useSetting("arcProfanity")) === 1;
  const granted = native || perm === "granted";

  async function enable() {
    const ok = await requestNotificationPermission();
    setPerm(webPermission());
    message[ok ? "success" : "info"](ok
      ? (native ? "Reminders scheduled — they'll fire even when the app is closed." : "Reminders on while the app is open.")
      : "Allow notifications in your browser settings to get reminders.");
  }

  return (
    <>
      <div className={`zs-perm${granted ? " is-on" : ""}`} data-row="permission">
        <span className="z-ico z-ico--lg" style={{ "--c": granted ? "var(--success)" : "var(--warn)" } as React.CSSProperties}>
          {granted ? <TbBellRinging size={22} /> : <TbBellOff size={22} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="zs-perm__title">
            {native ? "Native reminders" : perm === "granted" ? "Notifications allowed" : perm === "denied" ? "Notifications blocked" : perm === "unsupported" ? "Not supported here" : "Notifications off"}
          </div>
          <div className="zs-perm__hint">
            {native ? "Scheduled on the device — they buzz even when Zenith is closed."
              : perm === "denied" ? "Unblock them in your browser's site settings."
              : "On the web these fire while Zenith is open. The Android app buzzes even when closed."}
          </div>
        </div>
        {perm !== "unsupported" && perm !== "denied" && (
          <button type="button" className={`z-btn${granted ? "" : " z-btn--solid"}`} onClick={enable}>{granted ? "Re-apply" : "Enable"}</button>
        )}
      </div>

      <ListGroup title="Daily rhythm">
        <ToggleRow k="remWater" row="water" icon={<TbDroplet size={16} />} color="var(--info)" label="Hydration nudges" hint={`Every ${every} h through your waking window`}>
          <div className="zs-inline-stepper">
            <span>Every</span>
            <button type="button" className="zs-step zs-step--sm" aria-label="Less often" disabled={every <= 1} onClick={() => setSetting("remWaterEveryH", every - 1)}><TbMinus size={14} /></button>
            <b>{every} h</b>
            <button type="button" className="zs-step zs-step--sm" aria-label="More often" disabled={every >= 6} onClick={() => setSetting("remWaterEveryH", every + 1)}><TbPlus size={14} /></button>
          </div>
        </ToggleRow>
        <ToggleRow k="remSession" row="session" icon={<TbBarbell size={16} />} color="var(--accent)" label="Session reminder" hint={`Nudge to train at ${sessionAt}`}>
          <TimeSelect value={sessionAt} onChange={(v) => setSetting("remSessionAt", v)} />
        </ToggleRow>
        <ToggleRow k="remBedtime" row="bedtime" icon={<TbMoonStars size={16} />} color="var(--gold)" label="Bedtime wind-down" hint={`Protect your sleep at ${bedAt}`}>
          <TimeSelect value={bedAt} onChange={(v) => setSetting("remBedtimeAt", v)} />
        </ToggleRow>
      </ListGroup>

      <ListGroup title="From your plans" footer="Event reminders fire for anything scheduled with “Remind me” on the calendar.">
        <ToggleRow k="remSupps" row="supps" icon={<TbPill size={16} />} color="var(--teal)" label="Supplement & med times" hint="From your Nutrition schedule" />
        <ToggleRow k="remEvents" row="events" icon={<TbCalendarEvent size={16} />} color="var(--info)" label="Event reminders" hint="Per-event alerts from the calendar" />
      </ListGroup>

      <ListGroup title="Winter Arc" footer="Up to 5 a day until the drill's done, getting harsher toward midnight. Mornings after a miss are a comeback, never a roast. Quiet from 30 min before bedtime.">
        <ToggleRow k="remArc" row="arc" icon={<TbSnowflake size={16} />} color="var(--info)" label="Drill pushes" hint="Stops the moment today's drill is done">
          <div className="zs-arc-tone">
            <span>How harsh can it get</span>
            <Segmented size="small" value={arcTone} onChange={(v) => setSetting("arcTone", Number(v))}
              options={[{ label: "Coach", value: 0 }, { label: "Nag", value: 1 }, { label: "Roast", value: 2 }, { label: "Savage", value: 3 }]} />
            <label className="zs-arc-tone__swear">
              <Switch size="small" checked={arcProfanity} onChange={(v) => setSetting("arcProfanity", v ? 1 : 0)} aria-label="Unhinged last push" />
              <span>Unhinged last push <em>(swearing)</em></span>
            </label>
          </div>
        </ToggleRow>
      </ListGroup>
    </>
  );
}
