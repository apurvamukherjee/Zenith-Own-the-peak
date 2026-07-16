# Zenith · Phase 3 · Final Wrap

Everything from Groups 0 → 4 in one package, plus the last addition:
a shuffle-quote card on the Home screen.

`tsc -b` clean · `vite build` ✓ · `vite preview` serves every route
· all 34 unit tests pass · Vercel-ready via existing SPA rewrite.

---

## The final addition — HomeQuoteCard

A compact motivation card that lives at the bottom of the Home page.

**How to see it:** just open Home. The card sits below the Fuel / Calendar
row, above the FAB. Tap anywhere on the card, or the shuffle icon on the
right, to draw a new random quote (never the same one twice in a row while
you have others).

**What ships with it:**

- `src/config/quoteSeed.ts` — 17 seed quotes (7 gym, 5 study, 5 life) drawn
  from short, widely-known aphorisms so the card feels alive on day 1. Seeded
  idempotently on first launch via `seedIfEmpty()` — the user can edit or
  delete any of them from `/quotes`.
- `src/components/HomeQuoteCard.tsx` — the card itself. Motion cross-fade on
  shuffle, `WebkitLineClamp: 2` on the text so anything longer stays 2 lines,
  disabled shuffle button when only one quote exists, empty-state link to
  `/quotes` if the user cleared everything out.
- **Home layout:** removed the `maxHeight + overflow: hidden` viewport lock
  so the card fits naturally. Content still fits one screen on tall phones;
  on shorter viewports Home now scrolls a little instead of clipping.

---

## Everything Phase 3 shipped, at a glance

Feature | Where to see | One-liner
--- | --- | ---
**Group 0 — Schema v8** | `src/db/db.ts` | `usageHistory` table + optional `supersetGroupId` on `DayExerciseDto`
**Quick-log route** | `/quick` (also via FAB pill + PWA shortcut) | Four huge lock-screen-ready buttons for water / meal / set / sleep
**Voice log — extended** | FAB → Voice | Now parses water ("500 ml water"), gym sets ("bench 60kg 8 reps"), and meals ("200 g paneer"); fuzzy-matches food and exercise catalogs
**PR celebration** | Complete any set that beats your e1RM | Full-screen gold flash + 24 confetti flakes + haptic; also fires from voice-logged sets
**Global rest timer** | Any page while resting | Floating chip everywhere off `/workout`, in-card timer on it. Single drift-safe store — impossible to desync.
**Superset support** | Planner link icon → Session Logger | Chain two or three exercises; card renders them together; rest fires only after the last partner in a round
**PWA manifest** | Long-press home-screen icon (Android) | Jump list with Quick log / Train / Water shortcuts
**Undo hook** | `useUndo()` | One-tap delete with an Undo button in the toast
**Bulk-select on meals** | Long-press any meal on Nutrition | Checkbox mode + batch delete with a single undo for the whole batch
**Optimistic water writes** | Water page + Home water tile | Tap `+500 ml` — total jumps immediately; error toast is tap-to-retry if the write ever fails
**Pull-to-refresh** | Water page | Native gesture with haptic on prime + rotating chevron
**Sticky headers** | Nutrition meals list | "Meals · N" header stays at top while scrolling
**Empty states with clear next tap** | Study / Fuel / Water / Nutrition when empty | Icon + hint + primary CTA — never a dead-end wall
**Skeleton loaders** | `<Skeleton>` + `<SkeletonList>` | Shimmer primitives ready to drop into any list
**Smart weight autofill** | Session Logger set row | Priority: last-completed set → usageHistory → ghost → plan
**Predictive food portion** | Food picker | Remembers last grams per food id
**Bottom-sheet on mobile** | Food picker + Voice + Quick modals | Slides up from the bottom on narrow viewports; standard modal on desktop
**Command palette** | Cmd/Ctrl + K anywhere | Fuzzy-substring search; navigate routes, log quick water, jump to any exercise/food
**Faster route transitions** | Any nav change | 180 ms + easeOut (was 200 ms)
**Focus rings + high-contrast** | Tab through UI · Settings → Accessibility → High contrast | Red 2 px focus outline everywhere; toggle applies WCAG-AAA skin
**Reduce motion** | Settings → Accessibility → Reduce motion | Kills all animations app-wide; also honours OS `prefers-reduced-motion`
**Scroll restoration** | Deep-scroll → nav away → back | Restores exact scrollY per pathname
**Home shuffle card** | Home, bottom | Tap or shuffle icon to draw a new quote from your library

## Easter eggs — all 15, all hidden

| # | Egg | Trigger | Payoff |
| - | --- | --- | --- |
| 1 | **Konami — Contra** | `↑↑↓↓←→←→BA` on any keyboard | Hidden `Contra` badge |
| 2 | **Bell at 100%** | Tap the ring 3 times when ≥ 100 % | WebAudio bell ding + gold flash |
| 3 | **Long-press flame** | Press-hold the streak flame 0.8 s | Flame ignites with radial glow for 3 s |
| 4 | **Type "peak"** | Type `peak` anywhere | Splash-gradient flash |
| 5 | **Devil's hour** | Open at 3:33 AM | Greeting → "Devil's hour — What are you doing awake?" |
| 6 | **The Number** | Reach 666 total sets | Hidden `The Number` badge |
| 7 | **Birthday confetti** | Log any set on your configured MM-DD | 30 s of red/gold confetti |
| 8 | **IDDQD** | Type `iddqd` anywhere | Lazy-loads a dev overlay with live Dexie counts + mutation events/s |
| 9 | **Rocky trumpets** | Complete a 3:20 (200 s) rest | WebAudio 4-note fanfare |
| 10 | **System overload** | Hit 7 straight 100 % perfect days | One-time 4-second dramatic intro on next Home mount |
| 11 | **Sisyphus** | Long-press the ring for 8 s straight | Stone-rolls-uphill overlay + hidden `Sisyphus` badge |
| 12 | **Konami variants** | Konami at 4-6 AM → Hardcore Mode 24 h. On Sunday → Sabbath Mode | Hardcore SHOUTS the greeting; Sabbath softens it |
| 13 | **Palindrome dates** | Log a day on 2/2/22, 3/23/32, 20-2-2020 etc. | Greeting adds "Palindrome day, fittingly symmetric" + hidden `Reflective` badge (once per year) |
| 14 | **Rocky Mode** | 40+ sets in one session | Persistent gold ⭐ on the training hero card + hidden `Rocky` badge |
| 15 | **Mountain grows** | Unlock any mythic-tier badge | An SVG mountain range grows one new peak in Settings → About |

Total badges: **74** (12 mystery). Original registry was 69; Phase 3 added 5 (Contra, The Number, Sisyphus, Reflective, Rocky).

---

## Scoped-out or deferred

- **Swipe home for days** — needs re-plumbing the entire Dashboard from
  "today"-only to a date-parameterized view. Deferred as its own project.
- **Rocky ⭐ on the calendar cell** — the hero-card star + hidden badge
  cover the payoff; adding it to every rendered calendar cell would
  need a per-day set-count query. Not worth the perf cost for a decorative pip.
- **Battery-saver detection** — `navigator.getBattery()` was removed from
  Chrome for privacy reasons in 2024. The manual "Reduce motion" toggle
  and OS `prefers-reduced-motion` cover the same real user need.

---

## File manifest — Phase 3 total

**New files (30):**

Infrastructure:
- `public/manifest.webmanifest`
- `src/hooks/useIsMobile.ts`, `useUndo.tsx`, `useScrollRestore.ts`,
  `useRestTimer.ts`, `useEasterEggs.ts`, `useOptimistic.ts`,
  `useBulkSelect.ts`, `usePullToRefresh.ts`, `useDirtyGuard.ts`,
  `useUsageHistory.ts`, `useReducedMotion.ts`
- `src/lib/restTimerStore.ts`, `celebrate.ts`, `easterEggs.ts`, `audio.ts`
- `src/config/quoteSeed.ts`

Components:
- `GlobalRestChip.tsx`, `PRCelebration.tsx`, `PeakFlash.tsx`,
  `SisyphusOverlay.tsx`, `DebugPanel.tsx`, `BirthdayConfetti.tsx`,
  `DramaticIntro.tsx`, `MountainGrows.tsx`, `CommandPalette.tsx`,
  `Skeleton.tsx`, `EmptyState.tsx`, `Sheet.tsx`, `HomeQuoteCard.tsx`

Feature pages:
- `src/features/quick/QuickLogPage.tsx`

**Modified files (23):**

- `index.html` — link manifest
- `src/db/db.ts` / `types.ts` — v8 schema, `supersetGroupId`, `UsageHistoryDto`
- `src/App.tsx` — mirrors `data-contrast` and `data-motion` on `<html>`
- `src/index.css` — shimmer keyframes, focus rings, bottom-sheet class,
  high-contrast skin, sticky-header class, motion-reduce escalation
- `src/hooks/useSettings.ts` — 12 new defaults
- `src/hooks/useVoiceLog.ts` — full-parser rewrite
- `src/lib/achievements.ts` — extended context + 5 new hidden badges
- `src/features/achievements/useAchievements.ts` — mountain bump on mythic
- `src/components/AppShell.tsx` — mounts every new overlay + scroll restore + eggs
- `src/components/AnimatedRoutes.tsx` — 180 ms + `/quick` route
- `src/lib/routes.ts` — `/quick` meta
- `src/components/RestTimer.tsx` — store-driven view
- `src/components/VoiceLogModal.tsx` — three-branch commit
- `src/components/QuickLogFab.tsx` — Quick-log pill above the tile grid
- `src/features/dashboard/DashboardPage.tsx` — ring/flame/palindrome/hardcore/Rocky/quote-card wiring
- `src/features/settings/SettingsPage.tsx` — birthday + Accessibility card + About mountain
- `src/features/water/WaterPage.tsx` — optimistic + pull-to-refresh + empty state + undo
- `src/features/nutrition/NutritionPage.tsx` — bulk-select + undo + sticky header + empty state
- `src/features/nutrition/FoodPickerModal.tsx` — predictive grams + Sheet on mobile
- `src/features/study/StudyPage.tsx` — reusable EmptyState
- `src/features/fuel/FuelPage.tsx` — reusable EmptyState
- `src/features/gym/SessionLogger.tsx` — global-store rest + PR emit + supersets + predictive autofill
- `src/features/gym/WorkoutPlanner.tsx` — superset link/unlink
- `src/features/gym/useGym.ts` — `toggleSupersetLink()`
- `src/config/seedProgram.ts` — call `seedQuotesIfEmpty()` on first launch

---

## Deploy

The zip drops straight into your repo. `vercel.json` is unchanged and
already SPA-rewrites `/(.*) → /index.html`, so every new route
(`/quick`) and every deep-link works on Vercel with zero config changes.

```
npm install
npm run build
```

Then push to Vercel or run `vercel --prod`.

Phase 3 wrapped.
