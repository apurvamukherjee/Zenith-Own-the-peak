# Zenith — "Build with discipline"

A local-first personal operating system for university/working life. React +
TypeScript + Ant Design + Framer Motion. All data lives on-device (IndexedDB via
Dexie) — no backend, no account. Deploys static to Vercel; wraps native with
Capacitor. Built to add a backend later without touching the UI (see ARCHITECTURE.md).

## Modules
- **Splash** — animated launch ("Build with discipline · by Apurva").
- **Home** — daily command center: training, nutrition, water, sleep, gym streak, study up-next, bike mileage.
- **Train / Progress** — real 6-day PPL split, ghost numbers, PR detection, rest timer, e1RM curves.
- **Nutrition** — protein/calorie targets, meal log, and a timed schedule for meds, supplements & meals with due/overdue status and reminders.
- **Water** — pace-aware warnings, quick-add, streak, gym-day auto-bump.
- **Sleep** — bed/wake log, duration, quality, weekly sleep-debt, trend.
- **Study** — learning paths, topic backlog, "up next", progress %, notes, time logging.
- **Fuel** — full-to-full mileage, monthly spend, cost/km, trend.
- **Stats** — every metric across modules, bodyweight trend, JSON backup/restore.

## Navigation
5 root tabs (Home · Train · Nutrition · Learn · Stats). Secondary pages (Water,
Sleep, Fuel, Progress) open from Home cards with an animated **back button** in a
persistent top bar. Route changes slide directionally (drill-in forward, back
backward) via Framer Motion.

## Run
```bash
npm install
npm run dev
```

## Build & deploy (Vercel)
```bash
npm run build   # -> /dist ; Vercel preset: Vite, output: dist
```

## Reminders
In-browser reminders fire while the app is open (toggle in Nutrition). Real
background notifications come with the Capacitor wrap (`@capacitor/local-notifications`).

## Backup
Stats → Export writes a JSON of everything; Import restores it. Do this regularly —
local-only means clearing browser data wipes the device copy.
