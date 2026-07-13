# TrackLife

A local-first personal tracker. Phase 1 ships the **Workout module**: your real
6-day Push/Pull/Legs split, week-wise logging with "ghost" numbers to beat,
automatic PR detection, a rest timer, and a strength-progression dashboard.
All data lives in your browser (IndexedDB via Dexie) — no backend, no account.

## Run it

```bash
npm install
npm run dev
```

Open the printed localhost URL on your phone (same Wi-Fi) or desktop.

## Build & deploy (Vercel)

```bash
npm run build      # outputs to /dist
```

On Vercel: import the repo, framework preset **Vite**, build command
`npm run build`, output dir `dist`. Or `vercel` from the CLI.

## Wrap as a native app (later)

This is a plain web build, so Capacitor wraps it with no rewrite:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init TrackLife com.you.tracklife --web-dir=dist
npx cap add android   # and/or ios
npm run build && npx cap sync
```

## Structure

- `src/db/` — Dexie schema + DTOs (add water/sleep/study/fuel stores here)
- `src/config/pplProgram.ts` — your split; edit sets/reps/rest here
- `src/hooks/useWorkout.ts` — live queries + set logging + PR logic
- `src/features/workout/` — logging page, exercise card, rest timer, progress dashboard
- `src/components/` — reusable shell, nav, cards (shared by future modules)

## What's next

Water, Sleep, Study, and Fuel modules drop into `src/features/*` and reuse the
same shell, cards, and Dexie pattern.
