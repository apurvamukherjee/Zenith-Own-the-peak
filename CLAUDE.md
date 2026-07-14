# CLAUDE.md

Context for Claude Code (or any future session) working on this repo.

## What this is

**Zenith — "Own the peak."** A local-first personal tracker built for one real
user (a 22-year-old lifter/student in West Bengal). It tracks gym training,
nutrition, sleep, water, study/productivity, and bike fuel mileage in one app,
with a weekly review + cross-module insights layer on top. Not a generic
template — the gym program, macro targets, and copy are tuned to this person.

Brand: **Zenith**, tagline **"Own the peak"**, signed **"by Apurva"**. Gothic
dark theme (black + aggressive red) is the default; a light theme exists too.

## Tech stack

React 19 + TypeScript (strict) + Vite 5 + Ant Design 5 + Dexie (IndexedDB) +
Framer Motion + Recharts + React Router 6 + dayjs + react-icons (Tabler set,
`react-icons/tb`) + optional `@supabase/supabase-js`.

No backend by default. Optional Supabase cloud sync (see `DEPLOYMENT.md`).
Deploys to Vercel as a static SPA (`vercel.json` has the SPA rewrite). Designed
to wrap in Capacitor later with zero rewrite for a real native app + real push
notifications.

## Run / build

```bash
npm install
npm run dev     # prints Local + Network URL — use Network URL to test on phone
npm run build   # tsc -b && vite build -> /dist
```

`npm run build` running clean (no `error TS`) is the bar before considering any
change done. Always run it after edits.

## Architecture — the one rule that matters

```
UI (features/*/*.tsx)        ← presentational only, never touches Dexie directly
  └─ data hooks (use*.ts)    ← the ONLY place Dexie is read (useLiveQuery) or written
       └─ db (src/db/db.ts)  ← typed Dexie tables, schema versions, export/import
```

- Reads: `useLiveQuery(() => db.table.where(...).toArray(), [deps])` inside a
  `use<Feature>.ts` hook. Components call the hook, never `db` directly.
- Writes: exported `async function` in the same hook file (e.g. `addWater`,
  `logSet`, `addMeal`). Components call these, await nothing themselves.
- This seam is what makes swapping in a real backend later (Supabase tables,
  or Node+Express) cheap — only the hook internals change, not the UI.
- Every Dexie table write fires a mutation hook (`src/db/db.ts` →
  `src/lib/mutations.ts`) that the cloud auto-backup listens to. If you add a
  new table, no extra wiring needed — the `for (const table of db.tables)`
  loop in `db.ts` covers it automatically.

## Directory map

```
src/
  db/
    types.ts        DTOs for every table (flat, Dexie-indexable)
    db.ts            Dexie schema (versioned), export/import backup, mutation hooks
  config/
    pplProgram.ts    The user's real 6-day Push/Pull/Legs split (exercises/sets/reps/rest)
  lib/
    date.utils.ts    todayKey, weekKey, sleepDurationMin, streak calc, etc.
    workout.utils.ts Epley e1RM, progression grouping, volume load
    image.utils.ts   Downscale/compress uploaded images to dataURL before storing
    mutations.ts     Tiny pub/sub bus: db writes -> cloud auto-backup debounce
    notifications.ts Unified reminder engine: native Capacitor OR web Notification fallback
    supabase.ts      Optional Supabase client (no-ops if env vars absent)
    routes.ts        ROUTE_META registry — single source of truth for page titles
                      and transition direction (rank + tab flag drive AnimatedRoutes)
  hooks/
    useSettings.ts   Typed key/value settings table wrapper + DEFAULTS
    useTokens.ts     Reactive concrete hex palette (light/dark) for chart/SVG colors
    useWorkout.ts    Legacy-named but still the main workout data hook (ghost sets, PR logic)
    useReminders.ts  OLDER nutrition-schedule-specific reminder pinger (still used by
                     NutritionPage) — distinct from features/reminders/useReminderEngine.ts,
                     which is the newer app-wide engine mounted once in AppShell. Don't
                     conflate the two; see "Known duplication" below.
  components/
    AppShell.tsx        Root layout: wallpaper layer, AppBar, AnimatedRoutes, BottomNav.
                        Mounts useReminderEngine() once here.
    AppBar.tsx          Top bar (title from routes.ts, back button on non-tab routes)
    AnimatedRoutes.tsx  Route table + Framer Motion slide transitions (direction from rank)
    BottomNav.tsx       5-tab nav, Tabler icons, animated active "pill" (layoutId)
    SplashScreen.tsx    Launch animation — gothic gradient, ring draw, "Zenith / Own the
                        peak / by Apurva"
    PageTransition.tsx  Wraps each page's content (fade/slide-in)
    SectionTitle.tsx, MetricCard.tsx, AnimatedNumber.tsx   Shared small primitives
  features/<module>/
    <Module>Page.tsx   UI only
    use<Module>.ts      All Dexie access + business logic for that module
  theme.ts             getTheme(mode) -> antd ThemeConfig; VIOLET/TEAL/GOLD CSS-var
                        aliases for style props; TOKENS = concrete hexes per mode for
                        recharts/antd Progress (CSS vars don't resolve inside SVG attrs)
  index.css            :root (light) and [data-theme="dark"] (gothic) CSS variables;
                        iOS/Safari fixes live here (16px inputs, dvh, no-flash, etc.)
```

## Feature modules (what each does)

- **dashboard** — Home. Universal daily snapshot: hero training card, weekly-review
  entry, nutrition ring, water ring + quick-add, sleep/streak row, study "up next",
  bike mileage teaser.
- **workout** — Real PPL program (`config/pplProgram.ts`) auto-selected by weekday.
  Ghost numbers (last week's sets as placeholders), PR detection via estimated 1RM
  (Epley: `weight * (1 + reps/30)`), rest timer, undo. `WorkoutProgressPage` = e1RM
  trend chart, volume, PR log.
- **water** — Pace-aware: computes expected-intake-by-now from wake hour + waking
  window, flags on-track/behind/way-behind, auto-bumps goal on gym days, 7-day chart.
- **sleep** — Bed/wake time picker (readonly input, no keyboard), duration, quality
  stars, weekly sleep-debt callout, 14-night trend.
- **study** — Learning paths (YouTube/course/book + link) → ordered topic backlog →
  status cycles todo→doing→done on tap → auto "up next" → per-topic notes → time
  logging feeding a weekly bar chart.
- **fuel** — Bike mileage via **full-to-full method**: `distance / litres of this
  fill = km/L`. First fill has no mileage (no prior odometer) — surfaced as an
  in-app note, not a bug.
- **nutrition** — Meal logging (protein/calories) + a schedule (meds/supplements/meals
  with times), status tags (due/overdue/done), reminder toggle via `useReminders`
  (the older, nutrition-specific one).
- **profile** — The dense cross-module dashboard: bodyweight trend, gym/study/sleep/
  water/fuel stats, **Appearance** (theme toggle, profile picture, wallpaper with
  user-controlled blur/opacity sliders), **RemindersCard**, **SyncCard**, and local
  JSON export/import backup.
- **reminders** (`features/reminders/`) — The newer, app-wide engine. `useReminderEngine`
  is mounted once in `AppShell`; builds a `ReminderConfig` from settings + the
  nutrition schedule, and calls into `lib/notifications.ts` to either schedule real
  native notifications (Capacitor, detected via `window.Capacitor.isNativePlatform()`)
  or run a web `setInterval` fallback. `RemindersCard` is the settings UI for it.
- **sync** (`features/sync/`) — Optional Supabase cloud backup. Email OTP sign-in (no
  passwords), snapshot-based backup (whole DB as one JSON row per user in a
  `backups` table with RLS), auto-backup debounced 4s after any mutation, manual
  Restore. Degrades to "not configured" UI if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
  are absent — app stays fully local either way.
- **review** (`features/review/`) — Weekly Review + Insights. `useWeeklyReview`
  compares this-week vs last-week (14-day window split at day 7) across volume,
  sessions, PRs, protein hit-rate, sleep, study minutes, water adherence, fuel
  spend, and derives guarded cross-module insights (e.g. sleep-vs-e1RM correlation,
  protein consistency, sleep debt, study cadence, volume trend). Insights only fire
  when there's enough data (explicit sample-size guards) — don't remove those
  guards when editing, they prevent nonsense claims on thin data.

## Known duplication (intentional, don't "clean up" blindly)

- `src/hooks/useReminders.ts` (nutrition-schedule pinger, used only by
  `NutritionPage`) vs `src/features/reminders/useReminderEngine.ts` (app-wide
  engine mounted in `AppShell`, covers water/session/bedtime/supplements). They
  overlap on supplement reminders by design — `lib/notifications.ts`'s
  `planReminders(config, includeSupps=false)` deliberately excludes supplements
  in the *web* fallback loop so the two don't double-fire; native scheduling
  still includes them since it's a single OS-level schedule. If you touch one,
  check the other.
- There is also an `ARCHITECTURE.md` in the repo root with a longer version of
  the read/write-seam explanation above — keep both in sync if the pattern changes.

## Theming — how dark mode actually works

Two layers, don't skip either when adding UI:

1. **CSS variables** (`index.css`): `:root` = light, `[data-theme="dark"]` =
   gothic (black `#08080a` bg, red `#ff2740` accent). `App.tsx` sets
   `document.documentElement.setAttribute("data-theme", mode)` and flips the
   `<meta name="theme-color">`. Use `var(--accent)`, `var(--ink-soft)`,
   `var(--border)`, etc. in inline `style` props — these flip automatically.
2. **Concrete hex tokens** (`theme.ts` → `TOKENS`, accessed via `useTokens()`):
   required anywhere a CSS variable won't resolve — recharts `stroke`/`fill`
   SVG attributes, antd `<Progress strokeColor={...}>`. Call `const t =
   useTokens()` at the top of any component with a chart or ring, use
   `t.accent` / `t.teal` / `t.gold` / `t.grid`.

Rule of thumb: style prop (`color`, `background`) → CSS var. SVG/Progress
`strokeColor`/`fill`/`stroke` attribute → `useTokens()`. Mixing these up is
the most common way dark mode silently breaks on a new chart.

## Known past bugs (fixed — don't regress)

- Bottom-nav tab for Nutrition was once mislabeled "Fuel", colliding with the
  actual bike-fuel section. Nav labels: Home / Train / **Nutrition** / Learn / Stats.
- Nutrition's protein ring text could overflow the circle — fixed with tight
  `lineHeight`, smaller unit text, `whiteSpace: nowrap`. Keep that pattern for
  any new `Progress type="circle"` with multi-line `format()`.
- Ant Design `DatePicker`/`TimePicker` must have `inputReadOnly` — otherwise
  mobile Safari/Chrome pop the keyboard for a field that should be tap-to-pick.
- Hardcoded light-mode hex borders (`#f2f1f7`, `#d9d9d9`) look wrong in dark
  mode — always use `var(--border)` for dividers/borders, never a literal hex.
- iOS Safari zooms the page if a focused input's font-size is under 16px —
  `index.css` forces `font-size: 16px !important` on inputs; don't override
  it smaller.

## Data model gotchas

- `WorkoutSetDto.e1rm` is precomputed at write time (Epley), not derived at
  read time — `logSet()` in `useWorkout.ts` is the only place that should
  compute it.
- Full-to-full fuel mileage requires sorting by `odometer`, not `date` (a
  backfilled historical entry could have an earlier date but you must diff
  against the numerically previous odometer reading). See `computeRows` in
  `useFuel.ts`.
- `bodyweight` table is keyed `&date` (one entry per day) — logging again same
  day should `put`, not `add`.
- Settings are a single `key -> value` Dexie table (`useSettings.ts`
  `DEFAULTS`), not scattered flags — add new user-configurable values there,
  not as ad hoc localStorage.
- **Never use localStorage/sessionStorage** anywhere in this app — everything
  goes through Dexie (`db.settings` for small values, dedicated tables for
  records) so cloud sync/export-import stays comprehensive.

## Conventions to follow when adding a module

1. New Dexie table → add DTO to `db/types.ts`, add to `ZenithDB` class + a new
   `this.version(N).stores({...})` bump in `db.ts` (never mutate an existing
   version's schema — Dexie versions are additive migrations).
2. New `src/features/<name>/use<Name>.ts` for all reads/writes; new
   `<Name>Page.tsx` for UI only.
3. Register the route in `src/lib/routes.ts` (`ROUTE_META`) and add the lazy
   import + `<Route>` in `src/components/AnimatedRoutes.tsx`. Non-tab pages
   get `rank: 1` (slide in from the right over a tab page).
4. If it needs a home-screen teaser, add a card to `DashboardPage.tsx`
   following the existing `Link to="/x"` + icon + one-line status pattern.
5. Any chart/ring → pull `useTokens()`, never hardcode a hex.
6. Any date/time input → `inputReadOnly` on the antd picker.

## Testing a change

There's no test suite. Verification is:
```bash
npm run build   # must be clean (tsc -b && vite build)
```
Then eyeball in `npm run dev` — check both themes (Stats → Appearance toggle)
since most regressions are dark-mode-only.

## Deployment quick reference

Full instructions in `DEPLOYMENT.md`. Short version:
- **Vercel**: import repo, framework auto-detects Vite, `vercel.json` handles
  SPA rewrites. Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as env vars
  if cloud sync is wanted.
- **Supabase**: one `backups` table (`user_id, data jsonb, updated_at`) with
  RLS policies scoping each user to their own row; email OTP auth needs
  `{{ .Token }}` added to the Magic Link template so it sends a code, not a link.
- **Capacitor** (native + real background reminders): `web-dir=dist`, then
  `@capacitor/local-notifications` — `lib/notifications.ts` already detects
  the native runtime and switches scheduling strategy automatically.

## Non-negotiables from the product owner

- Fully local-first: the app must always work with zero configuration —
  cloud sync is additive, never required.
- Gothic dark theme is the default and the primary identity; light mode is
  secondary.
- The workout program in `pplProgram.ts` is the user's real routine — don't
  genericize it without being asked.
- Brand name **Zenith**, tagline **"Own the peak"**, signature **"by Apurva"**
  appear in: splash screen, `index.html` title, Profile page subtitle. Keep
  all three in sync if any is changed.

## Phase 2 additions

### Gym page redesign (two-screen split)
- **Session Logger** (`features/gym/SessionLogger.tsx`): the gym screen. Pure
  execution — progress bar, muscle emoji tags, per-exercise blocks with
  weight ±2.5kg / reps ±1 buttons and a ✓ Complete, sticky session stats footer
  (sets done/total, volume, % complete). No edit controls.
- **Workout Planner** (`features/gym/WorkoutPlanner.tsx`): the building screen.
  Create custom days ("Back Day", "Sunday Pump"), pick from a 56-exercise library
  with muscle-group filter, set weight/sets/reps/rest per exercise, assign days
  to weekdays, clone days, edit/delete.
- Exercise library seeded on first launch from `config/exerciseLibrary.ts` (56
  exercises across 12 muscle groups with equipment tags and coaching cues).
- Default PPL program seeded from `config/seedProgram.ts` — fully editable from
  the planner. The old hardcoded `pplProgram.ts` is no longer the source of
  truth; the Dexie tables are.
- Data hooks live in `features/gym/useGym.ts`; the old `hooks/useWorkout.ts` is
  now a thin compat shim for the Progress page's read-only queries.

### 10 UX improvements
1. **Onboarding** (`features/onboarding/OnboardingFlow.tsx`): 3 skippable screens
   (name, wake time, targets). Shown once; writes to settings, gates on
   `settings.onboarded`.
2. **Quick-Log FAB** (`components/QuickLogFab.tsx`): floating action button on every
   screen, opens a bottom sheet (Water/Meal/Set/Sleep/Fuel). Water logs inline;
   others deep-link to the module.
3. **Nav strip** (`components/NavStrip.tsx`): scrollable chip row below the AppBar
   linking to Water, Sleep, Fuel, Progress, Review. Hidden on those pages
   themselves. Makes every module reachable in 2 taps from anywhere.
4. **Unified streak** (`lib/streak.utils.ts`): one "day streak" on Home counting
   consecutive days with ANY trackable action. Per-module streaks stay on their
   own pages.
5. **Micro-feedback**: haptic tap on set-logged and success burst on PRs via
   `lib/haptics.ts`; contextual toasts on water log, quick-add, etc.
6. **Today ring** on Home: discipline score (avg of water%, session done, sleep
   logged, protein hit), displayed as a large dashboard ring with 4 status pills.
7. **Coaching empty states**: Study, Fuel, Nutrition, and Progress empty screens
   now show an icon, a one-line explanation, and a primary action button instead
   of a bare "no data" message.
8. **Haptics** (`lib/haptics.ts`): Capacitor-native vibration on PR and set-log,
   `navigator.vibrate` fallback on web.
9. **Adaptive reminder copy** (`lib/notifications.ts`): water reminders now
   receive live state and generate messages like "You're 700ml behind" or "Goal
   hit — nice!" instead of a static string.
10. **Coach marks** (`components/CoachMark.tsx`): generic multi-step tooltip
    component, ready to mount on first workout visit.
