import { GoogleCalendarSyncEngine } from "../features/googleCalendar/useGoogleCalendarSync";
import { CloudSyncEngine } from "../features/sync/useSync";
import { ArcSocialSync } from "../features/winterArc/ArcSocial";

// Background Convex engines (Google Calendar push/pull, auto-backup, Winter
// Arc board sync). AppShell lazy-loads this only when convexConfigured, so
// the Convex libraries stay out of the startup bundle.
export default function CloudEngines() {
  return (
    <>
      <GoogleCalendarSyncEngine />
      <CloudSyncEngine />
      <ArcSocialSync />
    </>
  );
}
