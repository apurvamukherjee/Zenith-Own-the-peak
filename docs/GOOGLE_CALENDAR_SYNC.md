# Google Calendar Sync — Setup Guide

Two-way sync between Zenith's Tasks/Events system and a dedicated **"Zenith"**
calendar created in your Google account. Requires Cloud Sync (Convex) to
already be set up — see `DEPLOYMENT.md` part A — the Google refresh token is
stored against that same signed-in account.

This is a one-time setup you do yourself in Google Cloud Console; there's no
manual step for anyone using an already-deployed Zenith instance beyond
Settings → Google Calendar → Connect.

## 1. Create a Google Cloud project + OAuth credentials

1. [console.cloud.google.com](https://console.cloud.google.com) → create a
   new project (or reuse one).
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: External (unless you have a Google Workspace org).
   - Fill in the app name ("Zenith"), your email, scopes — add
     `https://www.googleapis.com/auth/calendar` (the *full* Calendar scope,
     not `calendar.events` — creating the dedicated "Zenith" calendar needs
     the Calendars resource, which the narrower scope doesn't cover).
   - **Publishing status: set to "In production," not "Testing."** This is
     the single most important step and the easiest to skip — while a
     consent screen sits in "Testing," Google expires issued refresh tokens
     after **7 days** regardless of how correct your refresh logic is, which
     looks exactly like "sync mysteriously breaks every week." An unverified
     production app is fine for personal use; visitors just see Google's
     "unverified app" click-through screen once during consent.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI: your Convex deployment's HTTP Actions URL +
     `/google/oauth/callback` — e.g.
     `https://your-deployment.convex.site/google/oauth/callback` for
     production, or `http://127.0.0.1:3211/google/oauth/callback` for the
     local dev backend (`npx convex dev`). **Dev and prod need separate
     entries** — add both if you use both.
   - Save the generated **Client ID** and **Client Secret**.

## 2. Set Convex environment variables

Server-only — never exposed to the client, no `VITE_` prefix:

```bash
# Local dev deployment
npx convex env set GOOGLE_CLIENT_ID "your-client-id.apps.googleusercontent.com"
npx convex env set GOOGLE_CLIENT_SECRET "your-client-secret"
npx convex env set GOOGLE_OAUTH_REDIRECT_URI "http://127.0.0.1:3211/google/oauth/callback"
npx convex env set GOOGLE_OAUTH_APP_REDIRECT_URL "http://localhost:6969"

# Production deployment (repeat with --prod and your real URLs)
npx convex env set GOOGLE_CLIENT_ID "..." --prod
npx convex env set GOOGLE_CLIENT_SECRET "..." --prod
npx convex env set GOOGLE_OAUTH_REDIRECT_URI "https://your-deployment.convex.site/google/oauth/callback" --prod
npx convex env set GOOGLE_OAUTH_APP_REDIRECT_URL "https://your-vercel-domain.app" --prod
```

`GOOGLE_OAUTH_REDIRECT_URI` must exactly match a redirect URI registered in
step 1 (Convex's own site — dev and prod deployments live at different
`.convex.site` domains). `GOOGLE_OAUTH_APP_REDIRECT_URL` is where the OAuth
callback sends the browser *back* to afterward — your Vite app's own URL,
which lands on `/settings` with a `?google=connected` (or `?google=error`)
query param that the Google Calendar card consumes and clears.

## 3. Connect

Settings → Google Calendar → **Connect Google Calendar** → consent screen →
redirected back showing "Connected." First connect creates the dedicated
"Zenith" calendar in your Google account and does an initial full pull.

## How it works

- **One dedicated calendar, not your primary one.** Zenith never touches
  events outside the "Zenith" calendar it creates — disconnecting and
  deleting that calendar from Google fully undoes everything.
- **Pull**: incremental via Google's `syncToken` (full resync only if the
  token expires or on first connect). Runs on Settings/Calendar page
  activity and a manual "Sync now" button — no push notifications/webhooks
  in this version, so a change made directly in Google Calendar can take up
  until your next app open (or "Sync now") to appear in Zenith.
- **Push**: debounced ~4s after any local change, scoped to tasks dated from
  7 days ago through 180 days out (existing history further back stays
  local-only — a first connect won't recreate months of past reminders as
  one-time Google events).
- **Deleting an event in Google** doesn't remove the Zenith task — it flips
  its status to *cancelled*, same as any other Zenith status, so nothing
  disappears without a trace.
- **Deleting a task in Zenith** does remove the Google event (Zenith's
  existing hard-delete convention).
- **Zenith's own recurring tasks** (medicine/supplement/daily habits, etc.)
  currently push to Google as independent one-off events, not a native
  Google recurring series — each occurrence shows separately in Google's UI
  rather than as one repeating event.

## Known limitations (by design, for now)

- **One device at a time.** Zenith's cross-device story is snapshot
  backup/restore, not live merge — two devices independently syncing the
  same Google account against their own local task data can create
  duplicate events. Connect on your primary device.
- No real-time push (Google Calendar `events.watch()` webhooks) — polling only.
- No conflict-resolution UI — last-write-wins by comparing timestamps.
- No per-task-list include/exclude toggle yet — every dated, non-cancelled
  task in the sync window is included.

## Troubleshooting

- **"Reconnect needed" badge** — Google reported your refresh token is no
  longer valid (commonly: you revoked Zenith's access from
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions),
  or a password/security change invalidated it). Nothing already synced is
  lost — just reconnect.
- **Sync breaks after exactly a week** — your OAuth consent screen is still
  in "Testing" publishing status; see step 1.
- **"No refresh token granted on first connect"** — Google only issues a
  refresh token on the *first* consent for a given app+account pair; if
  you'd previously connected and revoked without disconnecting cleanly in
  Zenith, remove Zenith's access at
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
  first, then reconnect.
