# TrackLife — "Build with discipline"

A local-first personal tracker (React + TypeScript + Ant Design). All data lives
in your browser via IndexedDB (Dexie) — no backend, no account. Deploys as a
static site to Vercel and wraps as a native app with Capacitor, no rewrite.

## Modules
- **Splash** — animated launch screen ("Build with discipline · by Apurva").
- **Home** — universal daily overview: today's training, water, sleep, gym streak, study up-next.
- **Train** — your real 6-day PPL split, ghost numbers to beat, PR detection, rest timer.
- **Progress** — per-exercise estimated-1RM curves, gain %, volume, PR log.
- **Water** — pace-aware status + warnings, quick-add, streak, 7-day chart. Auto-bumps goal on gym days.
- **Sleep** — bed/wake log, duration, quality, weekly sleep-debt, 14-night trend.
- **Study** — learning paths (YouTube/course/book), topic backlog, "up next", progress %, notes, time logging.
- **Fuel** — full-to-full mileage, monthly spend, cost/km, mileage trend.
- **Stats (Profile)** — every metric across all modules, bodyweight trend, and JSON backup/restore.

## Run
```bash
npm install
npm run dev
```
Open the printed URL (on your phone over the same Wi-Fi for the real feel).

## Build & deploy (Vercel)
```bash
npm run build      # -> /dist
```
On Vercel: import repo → framework **Vite** → build `npm run build`, output `dist`.

## Wrap as native (later)
```bash
npm i @capacitor/core @capacitor/cli
npx cap init TrackLife com.apurva.tracklife --web-dir=dist
npx cap add android   # and/or ios
npm run build && npx cap sync
```
Then add Capacitor Local Notifications to turn the in-app water/bedtime nudges into real push reminders.

## Structure
- `src/db/` — Dexie schema, DTOs, export/import backup
- `src/config/pplProgram.ts` — your split (edit sets/reps/rest here)
- `src/hooks/` — settings + workout data hooks
- `src/features/<module>/` — one folder per tracker (page + its hooks)
- `src/components/` — shared shell, nav, splash, cards

## Notes
- **Back up regularly** (Stats → Export). Local-only means clearing browser data wipes it.
- Vendor code is split into cacheable chunks; chart pages load recharts on demand.
