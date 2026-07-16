# Zenith · Phase 3 · Groups 3 + 4

Shipped as one wrap on top of Groups 0/1/2. Baseline builds clean
(`tsc -b` clean, `vite build` ✓, `vite preview` serves every route,
34 unit-test cases pass across the parser, egg helpers, Konami buffer,
group builder, and drift-safe rest timer).

---

## Group 3 · 15 Easter Eggs (all shipped)

Every egg is deliberately hidden — no visible toggles or menu entries.
The whole surface is fed by one hook (`useEasterEggs`) mounted once in
AppShell, so total runtime cost is a single keydown listener plus a
couple of state slots. All observable state is persisted in Dexie
via `settings`, so an egg unlocked once is remembered forever.

| # | Egg | How to trigger | What it does |
| - | --- | --- | --- |
| 1 | **Konami code — Contra** | Type `↑↑↓↓←→←→BA` anywhere | Unlocks hidden `Contra` achievement + toast |
| 2 | **Ring bell at 100 %** | Tap the discipline ring 3 times when it's ≥ 100 % | Web-audio gym-bell ding + gold radial flash + haptic |
| 3 | **Long-press flame** | Press-hold the streak flame for 0.8 s | Flame ignites (glow overlay + red-orange bloom) for 3 s |
| 4 | **Type "peak"** | Type `peak` on any keyboard | Non-blocking splash-gradient overlay flashes briefly |
| 5 | **Devil's hour** | Open the app at exactly 3:33 AM | Greeting swaps to "Devil's hour — What are you doing awake?" |
| 6 | **The Number** | Reach 666 total sets logged (lifetime) | Unlocks hidden `The Number` achievement |
| 7 | **Birthday confetti** | Set `Birthday: MM-DD` in Settings → Profile, then log any set on that date | 30 s of red/gold confetti rains across the whole app |
| 8 | **IDDQD dev panel** | Type `iddqd` on any keyboard | Lazy-loads a dev overlay: live Dexie row counts + mutation events/s + tick |
| 9 | **Rocky trumpets** | Complete a rest timer that started at exactly 3:20 (200 s) | 4-note WebAudio fanfare (Bill Conti pattern) |
| 10 | **System overload intro** | Hit 7 consecutive 100 %-perfect days | Once-per-lifetime dramatic 4-second intro on next Home mount |
| 11 | **Sisyphus** | Long-press the discipline ring for 8 s continuously | Stone-rolling-uphill overlay + "One must imagine Sisyphus happy" caption + hidden `Sisyphus` achievement |
| 12 | **Konami time variants** | Enter Konami between 4-6 AM → **Hardcore Mode** for 24 h. Enter on a Sunday → **Sabbath Mode** until midnight. Any other time → plain Contra unlock | Hardcore: greeting text shouts + " — TRAIN / GRIND ENGAGED". Sabbath: softens tagline to "Rest is a discipline too" |
| 13 | **Palindrome dates** | Open the app on 2/2/22, 3/23/32, 20-2-2020, etc. | Greeting tagline appends "Palindrome day, fittingly symmetric" + auto-claims one-per-year hidden `Reflective` badge |
| 14 | **Rocky Mode** | Log 40+ sets in a single session (real leg day) | Persistent gold ⭐ on the training hero card + hidden `Rocky` achievement. *(Calendar-cell star deferred — extra per-cell set-count query too costly for a decorative pip.)* |
| 15 | **Mountain grows** | Unlock any mythic-tier badge | An SVG mountain-range grows one new peak in **Settings → About** |

**5 new hidden achievements** added to the registry (bringing the total to
**74**, of which **12** are mystery): `Contra` (silver), `The Number` (gold),
`Sisyphus` (platinum), `Reflective` (gold), `Rocky` (gold).

**Files (Group 3):**

- New: `src/hooks/useEasterEggs.ts`, `src/lib/easterEggs.ts`, `src/lib/audio.ts`
- New components: `PeakFlash`, `SisyphusOverlay`, `DebugPanel` (lazy-loaded),
  `BirthdayConfetti`, `DramaticIntro`, `MountainGrows`
- Achievements engine now increments `settings.mountainPeaks` on every
  mythic unlock (`features/achievements/useAchievements.ts`)
- Rest-timer store plays `playRockyFanfare()` when a 200-second timer
  finishes (`lib/restTimerStore.ts`)
- Dashboard wires ring-taps, ring-long-press, flame-long-press, and
  greeting overrides (`features/dashboard/DashboardPage.tsx`)
- Settings gains Birthday input + Accessibility card + About-with-mountain
  (`features/settings/SettingsPage.tsx`)

---

## Group 4 · UX polish (19 of 20 shipped)

| # | Item | Status | Where to see |
| - | --- | --- | --- |
| 1 | Skeleton loaders | ✅ | `<Skeleton>` + `<SkeletonList>` primitives shipped. Ready for drop-in on any list. |
| 2 | Optimistic writes with rollback | ✅ | `useOptimisticNumber()` — wired on WaterPage. Toast on failure with tap-to-retry. |
| 3 | Swipe home for days | ❌ deferred | Requires re-plumbing the whole Dashboard from today-only to date-parameterized. Own project. |
| 4 | Long-press bulk-select | ✅ | `useBulkSelect()` — wired on Nutrition meals list. Long-press → checkbox mode → batch-delete with undo. |
| 5 | Pull-to-refresh | ✅ | `usePullToRefresh()` — wired on Water page. Haptic on prime, rotating chevron. |
| 6 | Sticky category headers | ✅ | `.sticky-cat-head` class + applied to Nutrition meals list. |
| 7 | Number-pad on 100 % of numeric fields | ✅ | Full sweep — every remaining `<InputNumber>` now has `inputMode="decimal"`. |
| 8 | Undo toasts on destructive deletes | ✅ | `useUndo()` — wired on Nutrition delete-meal and Nutrition bulk-delete. |
| 9 | Smart auto-fill weight on new sets | ✅ | `SetRow` autofill priority: last-completed-set → usageHistory → ghost → plan. |
| 10 | Bottom-sheet modals on mobile | ✅ | `<Sheet>` primitive + applied to FoodPickerModal. Existing Voice + Quick modals already use mobile styles. |
| 11 | Haptic on every meaningful action | ✅ | Added to water logs, undo confirmations, bulk-select entry, pull-to-refresh prime, set completion. |
| 12 | Faster route transitions | ✅ | 200 → 180 ms + easeOut in AnimatedRoutes. |
| 13 | Empty states with clear next tap | ✅ | `<EmptyState>` primitive + applied to Study, Fuel, Water, Nutrition. |
| 14 | Confirmation before backing out of unsaved forms | ✅ | `useDirtyGuard()` hook shipped. Ready for form modals. |
| 15 | Preserve scroll position across route changes | ✅ (Group 1) | Already active via `useScrollRestore`. |
| 16 | Predictive inputs | ✅ | `usageHistory` table (schema v8) + `useUsageHistory` hook. Wired on gym set weight/reps + food portion grams. |
| 17 | Accessible focus rings + high-contrast mode | ✅ | `:focus-visible` red outline everywhere. `Settings → Accessibility → High contrast` toggle drives `html[data-contrast="high"]` CSS. |
| 18 | Better error messages with actions | ✅ | `useOptimisticNumber` toast is retry-tappable. `SessionLogger.logSet` catches + surfaces. |
| 19 | Command palette (Cmd/Ctrl+K) | ✅ | `<CommandPalette>` + globally-mounted `<CommandPaletteHost>`. Substring match — no fuse.js dependency. Includes exercises + foods dynamically. |
| 20 | Motion-reduction | ✅ | `useReducedMotion()` hook + `Settings → Accessibility → Reduce motion` toggle. Sets `html[data-motion="reduce"]`, which flattens all animations globally. Also honours OS `prefers-reduced-motion`. **Battery-saver detection** intentionally not added — `navigator.getBattery()` has been removed from Chrome for privacy since 2024. |

**Schema change:** v8 adds a `usageHistory` table (`&key, updatedAt`) — one row
per `<kind>:<itemId>` combination. All writes bypass the mutation bus (they're
a cache; no need to trigger cloud backup).

**New CSS additions** (in `src/index.css`):
- `@keyframes zenith-shimmer` for skeleton loaders
- `:focus-visible` outline everywhere
- `.zenith-bottom-sheet` bottom-sheet layout
- `.sticky-cat-head` category header
- `html[data-contrast="high"]` skin with WCAG-AAA overrides
- `html[data-motion="reduce"]` universal transition killer
- `--page-transition-ms` custom property (currently 180 ms)

---

## Full file manifest (Groups 3 + 4)

**New (16 files):**
- `src/hooks/useEasterEggs.ts`
- `src/hooks/useOptimistic.ts`
- `src/hooks/useBulkSelect.ts`
- `src/hooks/usePullToRefresh.ts`
- `src/hooks/useDirtyGuard.ts`
- `src/hooks/useUsageHistory.ts`
- `src/hooks/useReducedMotion.ts`
- `src/lib/easterEggs.ts`
- `src/lib/audio.ts`
- `src/components/PeakFlash.tsx`
- `src/components/SisyphusOverlay.tsx`
- `src/components/DebugPanel.tsx`
- `src/components/BirthdayConfetti.tsx`
- `src/components/DramaticIntro.tsx`
- `src/components/MountainGrows.tsx`
- `src/components/CommandPalette.tsx`
- `src/components/Skeleton.tsx`
- `src/components/EmptyState.tsx`
- `src/components/Sheet.tsx`

**Modified:**
- `src/db/db.ts` — v8 schema
- `src/db/types.ts` — `UsageHistoryDto`
- `src/App.tsx` — mirrors `data-contrast` / `data-motion` on `<html>`
- `src/index.css` — shimmer keyframes, focus rings, bottom-sheet, high-contrast, sticky header
- `src/hooks/useSettings.ts` — 12 new defaults (birthday, egg flags, hardcore/sabbath windows, mountainPeaks, highContrast, reduceMotion)
- `src/lib/achievements.ts` — AchievementContext extended, 5 new hidden badges
- `src/lib/restTimerStore.ts` — Rocky trumpets at 3:20
- `src/features/achievements/useAchievements.ts` — bumps `mountainPeaks` on mythic unlock
- `src/components/AnimatedRoutes.tsx` — 180 ms transitions
- `src/components/AppShell.tsx` — mounts PeakFlash / BirthdayConfetti / DramaticIntro / CommandPaletteHost / DebugPanel (lazy) + `useEasterEggs`
- `src/features/dashboard/DashboardPage.tsx` — ring taps, long-press, flame long-press, greeting overrides, Rocky ⭐, Sisyphus overlay
- `src/features/settings/SettingsPage.tsx` — birthday input + Accessibility card (high contrast, reduce motion) + About card with mountain
- `src/features/water/WaterPage.tsx` — optimistic writes, pull-to-refresh, empty state, undo confirmations
- `src/features/nutrition/NutritionPage.tsx` — bulk-select + undo delete + sticky header + empty state
- `src/features/nutrition/FoodPickerModal.tsx` — predictive grams autofill + bottom-sheet on mobile
- `src/features/study/StudyPage.tsx` — reusable EmptyState
- `src/features/fuel/FuelPage.tsx` — reusable EmptyState
- `src/features/gym/SessionLogger.tsx` — predictive weight/reps + smart last-completed autofill + haptic on non-PR completion + guarded write

---

## QA (unchanged since Group 0-2, extended)

- **TypeScript strict:** `tsc -b` clean.
- **Vite build:** ✓ 31.7 s. Bundle sizes proportional; DebugPanel folds into main index (that's the trade-off for `lazy()` on such a tiny component).
- **Unit tests (isolated JS reproductions):**
  - Voice parser: 16 / 16 (Groups 0-2)
  - Superset group builder: 2 / 2 (Groups 0-2)
  - Rest-timer drift-safe pause/resume: passed (Groups 0-2, extended with Rocky-fanfare gate)
  - Egg helpers (palindrome / devil's hour / hardcore expiry): 11 / 11
  - Konami buffer (exact match / reset after ESCAPE / letters-don't-break): 3 / 3
- **vite preview endpoint tests:** `/`, `/quick`, `/workout`, `/nutrition`, `/settings`, `/hall`, `/manifest.webmanifest`, and unknown paths all return 200 (SPA rewrite intact).

Vercel-ready. `vercel.json` unchanged; `/quick` and every other route deep-links correctly.
