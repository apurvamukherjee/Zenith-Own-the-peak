# CLAUDE.md — Zenith Phase 1 (Final)

## What this is

**Zenith — "Own the peak."** A local-first personal tracker for a 22-year-old
lifter/student in West Bengal. Tracks gym training, nutrition, sleep, water,
study, and bike fuel in one app. Gothic dark theme (black + red) is the default.

Brand: **Zenith** · tagline **"Own the peak"** · signature **"by Apurva"**

## Stack

React 19 + TypeScript (strict) + Vite 5 + Ant Design 5 + Dexie (IndexedDB) +
Framer Motion + Recharts + react-icons (Tabler `react-icons/tb`) + React Router 6
+ dayjs + optional @supabase/supabase-js. **Zero @ant-design/icons** — everything
uses Tabler.

## Run / build

```bash
npm install
npm run dev     # Network URL for phone testing
npm run build   # must be clean before any change is considered done
```

## Architecture

```
UI (features/*/*.tsx)        ← never touches Dexie directly
  └─ data hooks (use*.ts)    ← ONLY place Dexie is read/written
       └─ db (src/db/db.ts)  ← typed tables, versioned schema, export/import
```

Mutation bus (`lib/mutations.ts`) fires on every Dexie write → cloud auto-backup
debounces a push. Adding a new table auto-inherits this.

## Routes (10 total)

| Path | Page | Tab? |
|------|------|------|
| `/` | DashboardPage (Home) | yes |
| `/workout` | SessionLogger (Train) | yes |
| `/planner` | WorkoutPlanner | no |
| `/progress` | WorkoutProgressPage | no |
| `/nutrition` | NutritionPage | yes |
| `/study` | StudyPage (Learn) | yes |
| `/profile` | ProfilePage (Stats) | yes |
| `/water` | WaterPage | no |
| `/sleep` | SleepPage | no |
| `/fuel` | FuelPage | no |

BottomNav = 5 tabs. NavStrip = 4 secondary chips (Water, Sleep, Fuel, Progress).
Weekly Review is **inlined into ProfilePage**, not a separate route.

## Directory map

```
src/
  db/types.ts          DTOs (all tables)
  db/db.ts             Dexie schema v2, export/import, mutation hooks
  config/
    exerciseLibrary.ts   56-exercise seed data (plain .ts, NO JSX)
    seedProgram.ts       Seeds exercises + default PPL on first launch
  lib/
    date.utils.ts, workout.utils.ts, image.utils.ts
    mutations.ts         Write pub/sub → cloud auto-backup
    notifications.ts     Unified reminders (Capacitor native + web fallback)
    supabase.ts          Optional Supabase client
    haptics.ts           Capacitor haptics + navigator.vibrate fallback
    streak.utils.ts      Unified cross-module day streak
    todayScore.ts        Discipline score (water% + session + sleep + protein)
    routes.ts            Route registry + metaFor()
  hooks/
    useSettings.ts       Typed key/value settings + DEFAULTS
    useTokens.ts         Concrete hex palette per theme mode (for charts/SVG)
    useWorkout.ts        Compat read-only hooks for Progress page
    useReminders.ts      Nutrition-specific reminder pinger
  components/
    AppShell.tsx, AppBar.tsx, AnimatedRoutes.tsx, BottomNav.tsx
    SplashScreen.tsx     Gothic animated splash with particles
    QuickLogFab.tsx      Floating lightning-bolt action button
    NavStrip.tsx         Secondary scrollable chip row
    MuscleIcon.tsx       Vector muscle-group icon component (JSX, separate from data)
    CoachMark.tsx        Multi-step tooltip component
    PageTransition.tsx, SectionTitle.tsx, MetricCard.tsx, AnimatedNumber.tsx
  features/
    dashboard/           Home: discipline ring, streak, hero card, quick-add
    gym/                 SessionLogger (execution) + WorkoutPlanner (building) + useGym.ts
    workout/             WorkoutProgressPage (e1RM charts, PR log)
    water/               Pace-aware hydration tracking
    sleep/               Bed/wake, quality, debt
    study/               Learning paths, topic backlog, time logging
    fuel/                Bike mileage (full-to-full), monthly spend
    nutrition/           Meals, macros, supplement schedule
    profile/             All-module stats, weekly review (merged), appearance, reminders, sync, backup
    onboarding/          3-screen first-launch flow
    reminders/           App-wide reminder engine + settings card
    sync/                Supabase cloud backup card
    review/              useWeeklyReview.ts (hook only, rendered in ProfilePage)
```

## Theming

Two layers — both required when adding UI:

1. **CSS variables** (`index.css`): `:root` = light, `[data-theme="dark"]` = gothic.
   Use `var(--accent)`, `var(--border)`, etc. in style props.
2. **useTokens()** (`theme.ts` → `TOKENS`): concrete hexes for recharts `stroke`/`fill`
   and antd `<Progress strokeColor>`. CSS vars don't resolve in SVG attributes.

Rule: style prop → CSS var. SVG/Progress attribute → `useTokens()`.

## Critical conventions

- **exerciseLibrary.ts is plain .ts** (data only). MuscleIcon (JSX) lives in
  `components/MuscleIcon.tsx`. Mixing JSX into the .ts file broke Vite's dev
  server — don't merge them back.
- **seedIfEmpty()** runs before the router mounts (gated in App.tsx) so hooks
  never query empty tables on first load.
- All pickers: `inputReadOnly` (no keyboard on mobile).
- All borders: `var(--border)`, never a hardcoded hex.
- All icons: `react-icons/tb`, never `@ant-design/icons`.
- Settings live in Dexie (`db.settings`), never localStorage.

## Known architectural decisions

- `hooks/useReminders.ts` (nutrition-specific, used by NutritionPage) and
  `features/reminders/useReminderEngine.ts` (app-wide, mounted in AppShell)
  overlap on supplement reminders intentionally. Web fallback excludes supps to
  avoid double-fire; native includes them.
- The old `config/pplProgram.ts` is deleted. `seedProgram.ts` seeds from
  `exerciseLibrary.ts` into Dexie tables. The Planner edits those tables directly.
- `hooks/useWorkout.ts` is a thin compat shim for the Progress page's read-only
  queries. All write logic lives in `features/gym/useGym.ts`.

## Deployment

Full instructions in `DEPLOYMENT.md`. Short version:
- **Vercel**: import repo, auto-detects Vite, `vercel.json` handles SPA rewrites.
- **Supabase**: one `backups` table with RLS; email OTP needs `{{ .Token }}` in
  the Magic Link template.
- **Capacitor**: `web-dir=dist`, `@capacitor/local-notifications` for real push.

## Non-negotiables

- Fully local-first: zero configuration required, cloud sync is additive.
- Gothic dark is the default and primary identity.
- Brand: **Zenith**, **"Own the peak"**, **"by Apurva"** — keep all in sync.

## Phase 1.1 additions

- **Calendar** (`/calendar`, `features/calendar/`): month grid colored by daily
  discipline score (`lib/dayScore.ts` — batch-computed per month to avoid N+1
  queries). Tapping a past/today day opens a detail modal (`useDayDetail`)
  showing that date's water/sleep/training/protein/study/fuel, plus inline
  backfill: add water or log/edit sleep **for that specific date** via
  `addWater(ml, date)` and `upsertSleep({date, ...})` (both now accept an
  explicit date, defaulting to today). Future days are disabled. The month
  always resets to the current month on load — never persisted.
- **Home layout fix**: the dashboard's flex column previously used
  `justifyContent: "space-between"` across only 3 large blocks, which stretched
  empty gaps around the hero card. Changed to a `gap`-based flex column with
  every visual slot filled (mini week-strip, hero, 2x2 grid, fuel/calendar row).
- **Sleep TimePicker bug** ("stuck at 23"): antd's `TimePicker` scroll-panel has
  a known race condition on touch devices with a controlled `value` — mid-scroll
  onChange races the re-render and snaps back. Replaced everywhere with
  `components/TimeSelect.tsx`, two plain `<Select>` dropdowns (hour/minute), no
  scrolling, no race. Used in SleepPage and the Calendar day-detail sleep editor.
- **Known repo hygiene issue**: an old `features/workout/ExerciseCard.tsx` (from
  before the gym redesign) can resurface if merging old branches — it imports
  `useGhostSets`/`logSet`/`deleteSet` from `hooks/useWorkout.ts`, which no longer
  exports them (that logic moved to `features/gym/useGym.ts`). If a Vercel build
  fails with `TS2305 ... has no exported member 'useGhostSets'`, delete that
  stray file from the repo — it is not part of the current architecture.
