import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Button, Tag, App } from "antd";
import { TbCalendarEvent, TbBrandGoogle, TbRefresh } from "react-icons/tb";
import dayjs from "dayjs";
import { convexConfigured } from "../../lib/convexClient";
import { useSync } from "../sync/useSync";
import { useGoogleCalendarSync } from "./useGoogleCalendarSync";

// Two-way Google Calendar sync. Requires Cloud sync (Convex + signed in)
// first — the Google refresh token is stored against that same account —
// so this mirrors SyncCard's convexConfigured-gated split, one level deeper.
export function GoogleCalendarCard() {
  if (!convexConfigured) return null; // SyncCard above already explains cloud sync setup
  return <GoogleCalendarCardInner />;
}

function GoogleCalendarCardInner() {
  const s = useSync();
  if (!s.session) {
    return (
      <Card size="small" style={{ marginBottom: 12 }}
        title={<span><TbCalendarEvent style={{ verticalAlign: "-2px" }} /> Google Calendar</span>}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Sign in to Cloud sync above first — Google Calendar sync is tied to that account.
        </div>
      </Card>
    );
  }
  return <GoogleCalendarCardConnected />;
}

function GoogleCalendarCardConnected() {
  const { message } = App.useApp();
  const g = useGoogleCalendarSync();
  const [params, setParams] = useSearchParams();

  // Consume the ?google=connected|error&reason=... the OAuth callback
  // redirects back with, once, then strip it from the URL.
  useEffect(() => {
    const result = params.get("google");
    if (!result) return;
    if (result === "connected") message.success("Google Calendar connected");
    else if (result === "error") message.error(`Google Calendar: ${params.get("reason") ?? "couldn't connect"}`);
    const next = new URLSearchParams(params);
    next.delete("google");
    next.delete("reason");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume once on mount only
  }, []);

  const status = g.status;
  const busy = g.syncStatus === "syncing";

  return (
    <Card size="small" style={{ marginBottom: 12 }}
      title={<span><TbCalendarEvent style={{ verticalAlign: "-2px" }} /> Google Calendar</span>}
      extra={
        status?.connected
          ? status.needsReauth
            ? <Tag color="orange" style={{ borderRadius: 8 }}>Reconnect needed</Tag>
            : <Tag color="green" style={{ borderRadius: 8 }}>Connected</Tag>
          : null
      }>
      {!status?.connected ? (
        <>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
            Two-way sync with a dedicated "Zenith" calendar in your Google account —
            tasks and events flow both ways. Connect on one device at a time for now.
          </div>
          <Button type="primary" icon={<TbBrandGoogle />} onClick={g.connect}>Connect Google Calendar</Button>
        </>
      ) : status.needsReauth ? (
        <>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
            Google access expired or was revoked. Reconnect to resume syncing —
            nothing already synced is lost.
          </div>
          <Button type="primary" icon={<TbBrandGoogle />} onClick={g.connect}>Reconnect</Button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {busy ? "Syncing…" : status.lastSyncAt ? `Last synced ${dayjs(status.lastSyncAt).format("HH:mm")}` : "Not synced yet"}
            </div>
            <Button type="text" danger onClick={g.disconnect}>Disconnect</Button>
          </div>
          <Button block icon={<TbRefresh />} loading={busy} onClick={g.syncNow}>Sync now</Button>
        </>
      )}
    </Card>
  );
}
