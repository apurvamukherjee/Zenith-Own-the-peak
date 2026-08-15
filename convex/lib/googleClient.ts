// Plain fetch wrappers against Google's OAuth2 + Calendar v3 REST endpoints.
// Deliberately dependency-free (no `googleapis` package) so these stay in
// Convex's default runtime — the `googleapis` SDK is Node-oriented and would
// force a `"use node"` directive on every file that imports it, which can
// only export actions (not queries/mutations), forcing an awkward split.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// Full `calendar` scope (not the narrower `calendar.events`) — creating the
// dedicated "Zenith" secondary calendar needs the Calendars resource, which
// `calendar.events` doesn't cover.
const SCOPE = "https://www.googleapis.com/auth/calendar";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing Convex env var: ${name} (see docs/GOOGLE_CALENDAR_SYNC.md)`);
  return v;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPE,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Google token request failed: ${res.status} ${text}`) as Error & { isInvalidGrant?: boolean };
    err.isInvalidGrant = res.status === 400 && text.includes("invalid_grant");
    throw err;
  }
  return res.json();
}

export function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  return tokenRequest({
    code,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
    grant_type: "authorization_code",
  });
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return tokenRequest({
    refresh_token: refreshToken,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });
}

/** Best-effort — used on disconnect. Never throws. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch {
    // best-effort — disconnect proceeds locally regardless
  }
}

export async function createZenithCalendar(accessToken: string): Promise<string> {
  const res = await fetch(`${CALENDAR_API}/calendars`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ summary: "Zenith", description: "Synced from Zenith — Own the peak." }),
  });
  if (!res.ok) throw new Error(`Failed to create Zenith calendar: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}

export interface GoogleEvent {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  location?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  updated?: string;
  recurringEventId?: string;
  extendedProperties?: { private?: Record<string, string> };
}

export interface EventsListPage {
  items: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export class SyncTokenExpiredError extends Error {
  constructor() { super("Google sync token expired — full resync required"); }
}

/**
 * `singleEvents: true` makes Google pre-expand recurring series into
 * individual occurrences instead of returning an RRULE master — this is
 * what lets the mapping layer avoid ever parsing/generating RRULE syntax,
 * symmetric with how Zenith's own spawnRecurring() pre-materializes rows.
 * `showDeleted: true` must be set identically on full and incremental
 * requests (Google requires matching parameters when reusing a syncToken).
 * `orderBy` is deliberately omitted — it's incompatible with `syncToken`.
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  opts: { syncToken?: string; pageToken?: string },
): Promise<EventsListPage> {
  const params = new URLSearchParams({ singleEvents: "true", showDeleted: "true", maxResults: "250" });
  if (opts.syncToken) params.set("syncToken", opts.syncToken);
  if (opts.pageToken) params.set("pageToken", opts.pageToken);

  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 410) throw new SyncTokenExpiredError();
  if (!res.ok) throw new Error(`Google events.list failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { items: data.items ?? [], nextPageToken: data.nextPageToken, nextSyncToken: data.nextSyncToken };
}

export async function insertEvent(accessToken: string, calendarId: string, body: object): Promise<GoogleEvent> {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google events.insert failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function patchEvent(accessToken: string, calendarId: string, eventId: string, body: object): Promise<GoogleEvent> {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google events.patch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Idempotent — a 404/410 (already gone) counts as success. */
export async function deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Google events.delete failed: ${res.status} ${await res.text()}`);
  }
}
