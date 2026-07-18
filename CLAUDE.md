# CLAUDE.md — Zenith (through Phase 5)

## What this is

**Zenith — "Own the peak."** A local-first personal tracker for a 22-year-old
lifter/student in West Bengal. Tracks gym training, nutrition, sleep, water,
study, and bike fuel in one app. Gothic dark theme (black + red) is the default.
Phase 5 adds XP leveling + social leaderboard via Supabase.

Brand: **Zenith** · tagline **"Own the peak"** · signature **"by Apurva"**

## Stack

React 19 + TypeScript (strict) + Vite 5 + Ant Design 5 + Dexie (IndexedDB v9) +
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
       └─ db (src/db/db.ts)  ← typed tables, versioned schema v9, export/import
```

Mutation bus (`lib/mutations.ts`) fires on every Dexie write → cloud auto-backup
debounces a push → XP engine grants XP → achievement engine checks badges.

## Routes (18 total + 404)

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
| `/glance` | GlancePage | no |
| `/quotes` | QuotesPage (Motivation) | no |
| `/hall` | HallOfFrame (achievements) | no |
| `/settings` | SettingsPage | no |
| `/quick` | QuickLogPage | no |
| `/leaderboard` | LeaderboardPage | no |

Plus a `*` catch-all → 404 page (in `AnimatedRoutes.tsx`).

BottomNav = 5 tabs (Home, Train, Nutrition, Learn, Stats). NavStrip = 5 secondary
chips (Water, Sleep, Fuel, Progress, Calendar).

**Stats vs Settings (Phase 2 split):** `/profile` (Stats) is now **read-only
insights only** — weekly review, year heatmap, photo timeline, efficiency, body
composition, bodyweight, the all-module stats grid, and the Hall of Frame entry.
Everything configurable lives on `/settings` — profile name + daily targets,
appearance, reminders, cloud sync, and backup. The Home gear (`TbSettings`) opens
`/settings`; the Home share icon (`TbShare2`) opens `/glance`. Weekly Review is
still **inlined into ProfilePage**, not a separate route.

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
    dayScore.ts          Per-date + batch-per-month scores, deload detect
    achievements.ts      69-badge registry + context builder + unlock engine
    routes.ts            Route registry + metaFor()
  hooks/
    useSettings.ts       Typed key/value settings + DEFAULTS
    useTokens.ts         Concrete hex palette per theme mode (for charts/SVG)
    useWorkout.ts        Compat read-only hooks for Progress page
    useReminders.ts      Nutrition-specific reminder pinger
    useBackClose.ts      Back button dismisses an overlay instead of navigating
  components/
    AppShell.tsx, AppBar.tsx, AnimatedRoutes.tsx, BottomNav.tsx
    SplashScreen.tsx     Gothic animated splash with particles
    QuickLogFab.tsx      Floating lightning-bolt action button
    NavStrip.tsx         Secondary scrollable chip row (scroll pos persisted)
    MuscleIcon.tsx       Vector muscle-group icon component (JSX, separate from data)
    ColdIcon.tsx         Cold angular achievement glyph set (currentColor SVG)
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
    profile/             Stats (read-only insights) + weekly review (merged)
    settings/            SettingsPage: profile+targets, appearance, reminders, sync, backup
    achievements/        Hall of Frame page + useAchievements (list + engine + unseen)
    glance/              Screenshot-friendly share card
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
- Settings live in Dexie (`db.settings`), never localStorage. **One exception:**
  the resolved theme is mirrored to `localStorage["zenith-theme"]` purely as a
  first-paint cache (read by an inline script in `index.html` to kill the
  dark→light flash on reload). Dexie remains the source of truth.

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
  Wired to an "Encrypted export" button in **Settings → Data backup** (moved there
  from Stats in Phase 2).
- `lib/dayScore.ts` `detectDeloadWeek()` — 30%+ volume-drop → "deload" label
  (calendar UI can consume this to relabel low-scoring workout weeks).

## Phase 2 — Achievements, Stats/Settings split, QA hardening

### Schema v5 + v6
- **v5** adds the `achievements` table (`&id, unlockedAt, seen`). Definitions live
  in code (`lib/achievements.ts`); the table only persists *which* badges are
  unlocked, keyed by the string definition id — so adding badges needs no migration.
- **v6** adds a `[date+dayId]` compound index on `workoutSessions` (removes the
  Dexie "would benefit from a compound index" hint on the frequent
  `useTodaySession` / `ensureSession` / `backfillSession` lookups).
- `exportAll()` version marker bumped to 5; the `achievements` table and the
  `backupCount` setting ride the normal export/import + mutation-bus paths.

### Achievements + Hall of Frame (`/hall`)
- **69 badges total, 7 of them mystery.** `lib/achievements.ts` holds the registry,
  a batched `buildContext()` (one snapshot of streaks/sets/volume/PRs/perfect days/
  water/sleep/study/fuel/nutrition/body/backups), and `syncAchievements(ctx)` which
  inserts newly-earned rows (`seen:0`) and resolves the meta "Completionist" badge last.
- **Groups:** The Streak (9), Iron (13), Discipline (6), Water (6), Sleep (6),
  The Mind (6), The Road (5), The Table (6), The Body (5), Mystery (7).
- **Tiers:** bronze → silver → gold → platinum → mythic (`TIER_META`, tier pips I–V).
- **Icons:** `components/ColdIcon.tsx` — ~35 cold angular stroke glyphs drawn in
  `currentColor` (a curated glyph *language*, families shared per group, unique marks
  for milestones/mythics). This is a deliberate exception to "Tabler-only" for the
  medallion art; everything else still uses `react-icons/tb`.
- **Rendering:** all 69 always shown. Locked non-mystery = greyscaled/dimmed glyph
  + one-line hint + progress bar (`340 / 1,000`). Locked mystery = `void` glyph,
  `???` title, italic teaser line (no how-to). Unlocked = tier gradient + glow + date.
- **Engine:** `useAchievementEngine()` is mounted once in `AppShell` (beside
  `useReminderEngine`). It recomputes on the mutation bus (debounced), toasts +
  success-haptics each new unlock, and guards against double-fire. `useUnseenAchievements()`
  drives the red dot on the Stats → Hall entry; opening `/hall` calls `markAllSeen()`.
- **Backup counter:** `settings.backupCount` increments on each successful cloud
  backup (`useSync.backupNow`) and powers the hidden "The Vault" badge (25 backups).
- Two mystery badges ("Twice Yourself", "Featherweight No More") need bodyweight
  logged to ever trigger — by design.

### Stats / Settings split
- New `features/settings/SettingsPage.tsx` at `/settings`. Holds: **Profile & daily
  targets** (name + wakeHour/waterGoalMl/proteinTargetG/calorieTargetKcal/sleepTargetMin
  — the first real in-app targets editor), **Appearance**, `RemindersCard`, `SyncCard`,
  and **Data backup**. These were all cut out of ProfilePage.
- `ProfilePage` (Stats) is now purely read-only insights + the Hall of Frame entry.
- Home gear → `/settings` (was `/profile`); Home share icon → `/glance`.

### Route + QA hardening
- **404** catch-all route (`*`) → a proper NotFound instead of a blank page.
- **`/glance`** is no longer orphaned — reachable from the Home share icon.
- **`useBackClose(open, onClose)`** (`hooks/useBackClose.ts`): pushes a throwaway
  history entry so the device/browser Back button dismisses an overlay instead of
  navigating. Applied to the Calendar `DayDetailModal` and `AddGoalModal`.
- **NavStrip** persists its horizontal scroll across route changes (module-level cache).
- **Theme flash** killed via the `localStorage["zenith-theme"]` first-paint cache
  (see conventions note above).
- **Numeric keyboards:** every `<InputNumber>` carries `inputMode="decimal"`.
- **Destructive deletes** in Nutrition (`deleteMeal`, `deleteSchedule`) are behind
  a `Popconfirm` (explicit Yes/No) instead of one-tap.

### Housekeeping / deprecations cleared
- `index.html` includes `mobile-web-app-capable` (kept the Apple-prefixed one for
  older iOS).
- `BrowserRouter` opts into `future={{ v7_startTransition, v7_relativeSplatPath }}`.
- antd line `<Progress>` migrated from deprecated `strokeWidth` to `size={[-1, 8]}`
  (circle/dashboard `strokeWidth` is *not* deprecated — left as-is).

### Known limitation
- iOS Safari Back at the root route (`/`) can still exit the app. `useBackClose`
  handles overlays, but reliably trapping the root-level Back isn't possible in a
  browser SPA without a hash-router hack — the real fix arrives with the Capacitor
  native wrapper (OS back-button handling).

---

## Phase 3 — Macros tracker + Batch 4 (2026-07)

### Macros tracker
- **Schema v7:** `foods` (catalog with per-100g or per-piece macros + JSON `presets`) and
  `mealTemplateItems` (combo lines). `meals` gained nullable `fatG`, `carbsG`,
  `foodId`, `grams` — older rows stay valid.
- **Two log modes** live in `FoodPickerModal`: **From food** (search catalog,
  favorites, recent, presets, live macro preview) and **Custom** (name + macros).
- **Food catalog** in `src/config/foodCatalog.ts`: ~30 Indian-first foods —
  chicken, egg, egg white, paneer, tofu, greek yogurt, curd, soya, whey,
  rohu/salmon, white/brown rice, oats, roti, bread, potato, sweet potato,
  banana, apple, oil, ghee, butter, almonds, walnuts, PB, avocado, chia, dal,
  chana, rajma, milk. Seed values documented per user's spec; seeded on first
  launch via `seedFoodsIfEmpty()` (independent from exercise seed).
- **Discipline ring on Home stays protein-only** — carbs/fat are additive info,
  not part of the "did I do today" contract.

### Add-ons shipped (8 of 10)
1. **Portion presets** — save any dialed-in amount as a preset via `TbBookmarkPlus`.
2. **Meal combos** — `MealComboBuilderModal` builds a multi-food template that
   later logs each food as its own meal row.
3. **Daily macro bar** — stacked P/C/F/kcal vs target at the top of Nutrition.
4. **Recent food chips** — top 5 most-recently logged foods appear above the search.
5. **Time-of-day bar** — thin B/L/D/S calorie split under the macro bar.
7. **Water chips with meals** — quick 200/500/1000ml log inline.
8. **Copy yesterday** — one-tap replay of yesterday's meals via `copyYesterdayMeals()`.
9. **Optional carb/fat targets** — `carbTargetG` (default 320) and `fatTargetG` (default 75)
   in Settings, consumed by `MacroBar`.

**Deferred to Phase 4:** #6 cost-per-meal, #10 photo-per-meal.

### Batch 4 features
- **Adaptive theme** — `useAdaptiveTheme` picks a 7-slot gradient (dawn/morning/
  midday/afternoon/evening/wind-down/late-night) and publishes it as `--hero`
  in dark mode only. Light mode keeps the calm violet. Hourly re-tick aligned
  to the top of each hour.
- **Voice log** — `useVoiceLog` wraps Web Speech API; `VoiceLogModal` mounts on
  the FAB grid (now 6 cols). Parses "200g paneer" / "3 eggs" and fuzzy-matches
  the catalog. Gracefully hides on unsupported browsers (iOS Safari).
- **Before / after slider** — `BeforeAfterSlider` in Profile reuses `dayPhotos`;
  auto-picks oldest+newest, allows manual date-pair selection, draggable divider.

### Conventions preserved
- No `@ant-design/icons` — Tabler-only via `react-icons/tb`.
- All new modals use `useBackClose` for Android back-button dismissal.
- All destructive actions use `Popconfirm`.
- Every table access still routed through Dexie's mutation hooks so `bumpMutation`
  still triggers auto-backup and achievements. All new tables (`foods`,
  `mealTemplateItems`) are included in `exportAll()` via `db.tables` iteration.

## Phase 5 — XP + Social Leaderboard

### Schema v9
- `xpEvents` table: `++id, action, weekKey, createdAt` — every XP grant is one row

### Supabase tables (4 new, run via SQL Editor)
- `profiles` — user_id, display_name, share_code, level, total_xp, top_badges (jsonb), badge_count, public
- `weekly_scores` — user_id + week_key composite PK, discipline_avg, streak_end, volume_kg, xp_earned
- `follows` — follower_id + followed_id composite PK (asymmetric)
- `activities` — event log for future feed (user_id, kind, payload jsonb, created_at)

### New files
- `src/lib/xp.ts` — XP rates, 21-level curve, `grantXP()`, `isoWeek()`, `xpToLevel()`
- `src/lib/social.ts` — `ensureProfile()`, `pushWeeklySnapshot()`, `followByCode()`, `getLeaderboard()`
- `src/hooks/useXP.ts` — live Dexie query for XP totals/level
- `src/hooks/useXPEngine.ts` — mutation-bus listener, deduped XP grants per day
- `src/components/LevelUpOverlay.tsx` — 2.8s cinematic level-up screen
- `src/features/leaderboard/LeaderboardPage.tsx` — ranked list, follow-by-code, badge display

### How leaderboard works
1. User signs in via Cloud Sync (existing OTP flow)
2. First backup auto-creates `profiles` row with `ZN-XXXX` share code
3. Every backup also upserts `weekly_scores` + updates profile level/XP/badges
4. User shares code → friend pastes it → `follows` row created → leaderboard shows both
5. Top 6 badges (by tier: mythic→iron→gold→silver→bronze) visible to followers
6. Scores sort by discipline_avg desc, then volume_kg as tiebreaker

### Settings additions
- `shareCode` — cached locally, mirrors Supabase `profiles.share_code`

### Privacy
Friends see: name, level, weekly stats, top 6 badges, badge count.
Friends never see: raw logs, specific weights, meal data, mystery badge names before unlock.
