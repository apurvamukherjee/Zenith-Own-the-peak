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

## Routes (12 total)

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
| `/calendar` | CalendarPage | no |
| `/quotes` | QuotesPage (Motivation) | no |

BottomNav = 5 tabs. NavStrip = 5 secondary chips (Water, Sleep, Fuel, Progress, Calendar).
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

## Phase 1.2 — Calendar, full feature set

Schema bumped to **v3**: `goalDays`, `dayPhotos`, `streakFreezes` tables added
(plus `quotes`, which existed but was accidentally dropped from `db.ts` during a
rewrite and restored — if `db.quotes` ever throws "does not exist", check the
`ZenithDB` class has all tables from `db/types.ts` registered).

All 10 calendar features implemented in `features/calendar/CalendarPage.tsx`:

1. **Streak freeze** — `lib/streak.utils.ts` `useStreakFreeze()`/`isFreezeAvailable()`,
   one per ISO week, offered only on past days with zero logged activity.
2. **Month summary** — tap the month title, `useMonthSummary()` aggregates
   avg score/best week/volume/sets/study time for the visible month.
3. **Per-module filter** — `lib/dayScore.ts` `DayMetrics` + `filteredValue()`
   recolors the grid by water/sleep/session/protein instead of the blend.
4. **Workout backfill** — `features/gym/useGym.ts` `backfillSession(date, dayId)`
   logs every planned set at the program's target weight/mid-range reps for a
   missed day.
5. **On this day** — `dayScore.ts` `onThisDayComparisons()`, shows last-week/
   last-month same-date score inline in the detail modal.
6. **Range select** — long-press (500ms) a cell to start, tap another to end;
   floating stats bar shows avg score + active days for the range.
7. **Export** — `exportMonth()` uses `navigator.share` if available, else
   copies a text summary to clipboard (no image/PDF library added — kept light).
8. **Goal markers** — `features/calendar/useGoalDays.ts`, flag icon on marked
   cells, countdown strip above the calendar.
9. **Photo pins** — `features/calendar/useDayPhoto.ts`, camera icon on cells
   with a photo, stored as compressed dataURL via `lib/image.utils.ts`.
10. **Year heatmap** — `features/profile/YearHeatmap.tsx` on Stats, GitHub-style
    grid Jan→current month. Clicking a month navigates to `/calendar` via
    React Router **location state** (`navigate("/calendar", { state: {...} })`),
    which is NOT persisted — a fresh load/refresh of `/calendar` still always
    opens on the current month, satisfying the "always resets" requirement.

`DayCell` (useCalendar.ts) and `DayMetrics` (dayScore.ts) now share the same
shape (score, hasAny, waterPct, sessionDone, sleepLogged, proteinPct) so the
calendar grid can be recolored by any single metric without a second query.

## Repo hygiene note (read this before debugging a "phantom" build error)

If a build error references a component, prop, or table that doesn't exist in
the current source (e.g. `Card` in a file that has no Card import, or
`db.quotes` when quotes seems unrelated to the task), **the local/deployed repo
has drifted from the verified source** — do not hand-patch around it. The fix
is a full sync: delete the project's tracked files and replace wholesale with
the last verified zip, then `git add -A && git commit && git push --force`
(safe on a single-contributor repo). Patching symptoms one error at a time on a
drifted tree tends to surface a new mismatched file every build.

## Phase 1.3 — greeting + editable quotes

### Time-aware greeting (Home)
The dashboard's `greeting()` helper (in `features/dashboard/DashboardPage.tsx`)
now returns `{ text, icon, tagline, grad }` for 7 time slots (5–8 dawn, 8–12
morning, 12–15 midday, 15–18 afternoon, 18–21 evening, 21–24 wind-down, 0–5
late night). The icon renders in a small gradient chip, the greeting text uses
`WebkitBackgroundClip: "text"` for a gradient fill, and an italic tagline sits
under the name. The wrapper is a `motion.div` keyed on `g.text`, so crossing an
hour boundary animates the transition. Gradients shift the palette through the
day (amber → red → violet → indigo).

### Editable quotes (`/quotes`)
`features/quotes/useQuotes.ts` now exports `updateQuote(id, patch)` alongside
`addQuote`/`deleteQuote`/`toggleFavorite`. `QuotesPage.tsx` adds a pencil-icon
button between Favorite and Delete in the swipe deck; tapping it opens
`EditQuoteModal`, which pre-fills text/author/category from the current quote
via `useEffect(() => { ... }, [quote])`. `updateQuote` only writes the fields
present in the patch, so unrelated fields (isFavorite, createdAt) stay intact.

## Phase 1 close-out — final feature drop

Schema bumped to **v4** with 4 new tables:
- `bodyMeasurements` (waist/chest/arm/thigh/hip over time)
- `mealTemplates` (saved "usual breakfast" macros)
- `restDayLogs` (typed rest days — full/active/cardio; data model in place, UI can be added later)
- `habitChains` (trigger→action reminder chains; data model only for now)

### New pages
- `/glance` — screenshot-friendly share card (discipline ring + streak + brand
  gradient). Meant as the base layout for a native widget later.

### New components (all reusable)
- `components/RestTimer.tsx` — circular countdown, pause/skip, haptic on zero.
  Mounted inside SessionLogger's ExerciseBlock; auto-starts on set completion
  via a `doneCountRef` change detector.
- `components/PwaInstallPrompt.tsx` — listens for `beforeinstallprompt`,
  shows a subtle install nudge; dismissal remembered in localStorage.

### Existing pages, extended
- `/workout` — RestTimer in each exercise card
- `/` — streak-in-danger banner appears at 21:00+ when today's score is 0
- `/nutrition` — meal templates chip row + "save this meal as template" button
- `/sleep` — SleepDebtCard shows accumulated shortfall + recovery projection
- `/fuel` — EfficiencyCard shows km/L trend (early vs recent halves)
- `/calendar` — weekly heatmap strip above the month grid
- `/profile` — PhotoTimeline, EfficiencyCard (₹/session, ₹/km, min/topic),
  BodyComposition, encrypted export button

### New utilities
- `lib/encryptedExport.ts` — Web Crypto AES-GCM wrapper (PBKDF2 100k rounds).
  Currently wired to a "Encrypted export" button in Stats → Data backup.
- `lib/dayScore.ts` `detectDeloadWeek()` — 30%+ volume-drop → "deload" label
  (calendar UI can consume this to relabel low-scoring workout weeks).
