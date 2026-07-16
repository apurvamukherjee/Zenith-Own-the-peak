# Zenith · Phase 3 · Groups 0 + 1 + 2

Shipped as a single wrap. Baseline builds green (`tsc -b` clean, `vite build` clean),
`vite preview` serves the new `/quick` route and the manifest correctly.

---

## Group 0 · Schema

| Change | Where | Migration |
| --- | --- | --- |
| `DayExerciseDto.supersetGroupId?: number` (optional) | `src/db/types.ts` | None — pure optional field, no Dexie index needed; legacy rows stay valid |

That's the whole schema change. `usageHistory` and `pendingOps` intentionally deferred to Group 4 with the polish batch, so this migration is zero-risk.

---

## Group 1 · Shared infrastructure (7 new files)

| File | What it does | How to see it |
| --- | --- | --- |
| `src/hooks/useIsMobile.ts` | Reactive `matchMedia` binding, 640 px default breakpoint. Used by modals to switch to bottom-sheet on phones. | Resize Chrome dev-tools past 640 px with the Voice or Quick-water modal open — border-radius & mask update live. |
| `src/hooks/useUndo.tsx` | Hook that pairs a destructive action with a toast containing an Undo button. Only one pending undo at a time. | Not yet wired to a caller — infrastructure only for Group 4's undo sweep. Import path is stable. |
| `src/hooks/useScrollRestore.ts` | Caches `<main>` scrollTop per pathname. On `POP` (browser back/forward) restores it; on `PUSH` scrolls to top. | Scroll deep inside Study → open Nutrition → hit browser back. Study is where you left it. |
| `src/lib/restTimerStore.ts` | Singleton drift-safe rest-timer store (start / pause / resume / skip). One `setInterval` for the whole app. Fires haptic on zero, one time only. | See features 3 & 4 below — everywhere the timer appears is this store. |
| `src/hooks/useRestTimer.ts` | React binding to the store via `useSyncExternalStore`. | Under the hood of both `RestTimer` and `GlobalRestChip`. |
| `src/lib/celebrate.ts` | Fire-and-forget event bus for "moment of" celebrations (currently PRs). | See feature 3. |
| `src/components/PRCelebration.tsx` | Full-screen non-blocking gold-confetti overlay that listens to the emitter. Mounted once in AppShell. | Feature 3. |
| `src/components/GlobalRestChip.tsx` | Floating rest chip. Hidden on `/workout` (in-card timer already visible there); everywhere else, shows a mini circular countdown + label + pause/resume/skip. Tap the ring to jump back to `/workout`. | Feature 4. |

---

## Group 2 · The 5 productivity features

### 1. `/quick` route — two-tap logging surface

**File:** `src/features/quick/QuickLogPage.tsx`
**How to see it:**
- **In-app:** tap the ⚡ FAB → the "Open Quick log" pill at the top of the sheet.
- **On Android:** install as a PWA, long-press the home-screen icon → jump list has "Quick log". (`public/manifest.webmanifest` shortcuts.)
- **Direct URL:** `zenith.example/quick`

Four square buttons — Water, Meal, Set, Sleep — each aspect-ratio 1:1, ~140 px min, big gradient tiles. Water logs inline via a 250/500/750/1000 ml modal (2 taps). The other three navigate to their respective pages.

### 2. Voice log — extended

**Files:** `src/hooks/useVoiceLog.ts` (parser), `src/components/VoiceLogModal.tsx` (branching UI)

New parser `parseVoiceInput(text)` returns a discriminated union:

- `{ kind: "water", ml }` — matches `"500 ml water"`, `"water 750ml"`, `"half a litre of water"`, `"0.5 l water"`, `"add 250ml water"` (order-agnostic; ml/l/half-a-litre supported).
- `{ kind: "set", exercise, weightKg, reps }` — matches `"bench 60kg 8 reps"`, `"squat 100 for 5"`, `"deadlift 120 kg for eight"` (number-words normalised). Fuzzy-matched against `useExerciseLibrary()`.
- `{ kind: "meal", parsed }` — existing food behaviour, unchanged.

The modal shows a distinct match card per kind (droplet / meat / barbell), one confirm tap logs. Water → `addWater()`; meal → `logFood()`; set → `ensureSession()` + `logSet()` on today's session at the next available `setIndex`. PR sets from voice also fire the celebration overlay.

**How to see it:** FAB → Voice → tap mic → say *"bench 60 kilograms 8 reps"* → confirm.
**Note:** Web Speech API is Chrome/Android-only. iOS Safari hides the mic (no error toast). This is documented in the existing `useVoiceLog` comment block.

### 3. PR celebration

**Files:** `src/lib/celebrate.ts`, `src/components/PRCelebration.tsx`, wired in `src/features/gym/SessionLogger.tsx` and `src/components/VoiceLogModal.tsx`.

Every path that calls `logSet()` and gets back `{ isPR: true }` now emits:

```ts
celebrate({ kind: "pr", title: "New PR", subtitle: "Bench Press · 62.5kg × 6 · e1RM 75" });
```

The overlay mounted in AppShell (`<PRCelebration />`) shows: radial gold flash + card + ~24 confetti flakes, 1.4 s total, `pointer-events: none` so it never eats a tap. Haptic-success fires on emit. Old inline "New PR! 🏆" toast is gone.

**How to see it:** on `/workout`, complete a set that beats your best e1RM for that exercise. Also fires from voice-logged PRs.

### 4. Rest timer across screens

**Files:** `src/lib/restTimerStore.ts`, `src/hooks/useRestTimer.ts`, `src/components/RestTimer.tsx` (refactored), `src/components/GlobalRestChip.tsx`, wired in `AppShell.tsx` and `SessionLogger.tsx`.

The old in-card `RestTimer` owned its own state and died on navigate. It's now a **view** of the global store. `SessionLogger` calls `startRest(seconds, color, label)` when a set completes — nothing else. The store:

- ticks at 250 ms via a single `setInterval`,
- computes remaining time from `endsAt - now` (drift-safe under a paused tab),
- banks paused time so resume is exact,
- fires haptic + goes inactive at zero, exactly once per session.

`GlobalRestChip`, mounted once in AppShell, subscribes and:

- renders **only** when the store is active AND `pathname !== "/workout"`,
- shows a mini circular countdown, exercise label, pause/resume/skip,
- tapping the ring jumps back to `/workout`.

The in-card `<RestTimer />` on Session Logger renders exactly the same store. No two tickers can ever exist. Consistency guaranteed by construction.

**How to see it:** log a set on `/workout`, then immediately navigate to Nutrition or Study — the chip appears bottom-right above the FAB. Tap it to jump back. Skip / pause work everywhere.

### 5. Superset support

**Files:** `src/db/types.ts` (field), `src/features/gym/useGym.ts` (`toggleSupersetLink`), `src/features/gym/WorkoutPlanner.tsx` (Link/Unlink button + visual grouping), `src/features/gym/SessionLogger.tsx` (grouped rendering + last-partner rest rule).

**Planner:** each exercise row (except the last) shows a link icon (`TbLink`). Tapping it links this row and the next into a superset — both rows gain a red left border and an "↳ Superset" caption between them. Tapping `TbLinkOff` (visible when already linked) unlinks. Chains of 2 or 3+ are fine (linking a linked row with the next extends the chain; unlinking splits the whole chain).

**Session Logger:** `buildItems()` folds consecutive same-`supersetGroupId` rows into one grouped card, with a "SUPERSET · round N/M" pill at the top. Each partner still has its own SetRow controls, but the rest timer only fires when the **last** partner completes a set (i.e. one round has closed). This matches the real gym flow: A → B → rest → A → B → rest.

**How to see it:**
1. Open `/planner`, on any workout day tap the 🔗 icon on an exercise row.
2. Both rows glow accent-red with a "↳ Superset" line between them.
3. Open `/workout`. The two exercises now share one card. Complete a set of A — no rest starts. Complete a set of B — rest starts.
4. Unlink from Planner and they revert to separate cards.

---

## Also shipped (small nice-to-haves that came free)

- **`public/manifest.webmanifest`** — proper PWA manifest with 3 shortcuts (Quick log / Train / Water). Long-press home-screen icon on Android → jump list.
- **Scroll restore** on browser back/forward (feature listed in Group 1 above; mounted in AppShell so it applies everywhere).
- **`<label>`/`aria-label`** added to every button in the rewritten SessionLogger for keyboard/AT.

---

## Everything the app now has, in one dock

Only new/changed items are marked `[new]` or `[updated]`. Everything else is Phase 1 / 2 baseline.

| Feature | Where | One-line |
| --- | --- | --- |
| Dashboard (Home) | `/` | Discipline ring, unified streak, hero card, quick-add tiles, mini week strip. |
| Session logger | `/workout` | Log today's workout: day picker, muscle chips, exercise cards, ghost-set defaults, PR detection, sticky footer stats. `[updated]` supersets, global rest, PR celebration |
| Workout planner | `/planner` | Build/edit workout days, weekly schedule, clone days, per-exercise sets/reps/weight/rest. `[updated]` link/unlink supersets per row |
| Workout progress | `/progress` | e1RM chart per exercise, PR log. |
| Nutrition | `/nutrition` | Meals, macro bar, meal templates, water chips, copy-yesterday, food catalog with presets. |
| Water | `/water` | Pace-aware hydration with expected-vs-actual delta. |
| Sleep | `/sleep` | Bed/wake, duration, quality, debt & recovery projection. |
| Study | `/study` | Learning paths, topic backlog, time-logging, weekly totals. |
| Fuel | `/fuel` | Bike mileage (full-to-full), monthly spend, km/L trend. |
| Calendar | `/calendar` | Month grid by discipline score, freeze/backfill/photo pins/goal markers, range select, month summary. |
| Glance | `/glance` | Screenshot-friendly share card. |
| Quotes | `/quotes` | Editable motivation deck. |
| Hall of Frame | `/hall` | 69-badge trophy hall with tiers, unseen dot on Stats. |
| Stats | `/profile` | Read-only insights + Weekly Review inline + year heatmap + photo timeline. |
| Settings | `/settings` | Profile+targets, appearance, reminders, cloud sync, backup, encrypted export. |
| **Quick log** `[new]` | `/quick` | Two-tap surface with 4 huge buttons — water/meal/set/sleep. Also reachable from FAB → "Open Quick log" pill, or from a homescreen shortcut. |
| Voice log | FAB → Voice | `[updated]` Water ("500 ml water"), gym sets ("bench 60kg 8 reps"), meals ("200g paneer"). Fuzzy-matches food + exercise catalogs. |
| PR celebration `[new]` | Any PR set (in-app or via voice) | Full-screen gold flash + confetti + haptic. |
| Global rest chip `[new]` | Bottom-right, off `/workout` | Floating rest ticker that persists across route changes. Tap ring → back to `/workout`. |
| Superset support `[new]` | Planner + Session Logger | Link consecutive exercises to alternate; rest only fires after the last partner in a round. |
| PWA manifest `[new]` | `/manifest.webmanifest` | Standalone-display + 3 shortcuts (Quick / Train / Water). |

---

## Files touched — full list

**New (10):**
- `public/manifest.webmanifest`
- `src/hooks/useIsMobile.ts`
- `src/hooks/useUndo.tsx`
- `src/hooks/useScrollRestore.ts`
- `src/hooks/useRestTimer.ts`
- `src/lib/restTimerStore.ts`
- `src/lib/celebrate.ts`
- `src/components/GlobalRestChip.tsx`
- `src/components/PRCelebration.tsx`
- `src/features/quick/QuickLogPage.tsx`

**Modified (9):**
- `index.html` — link the manifest
- `src/db/types.ts` — `supersetGroupId?`
- `src/components/RestTimer.tsx` — rewritten to consume the store
- `src/components/VoiceLogModal.tsx` — rewritten to handle water/set/meal branches
- `src/components/QuickLogFab.tsx` — added "Open Quick log" pill above the tile grid
- `src/components/AppShell.tsx` — mounts `GlobalRestChip`, `PRCelebration`, `useScrollRestore`
- `src/components/AnimatedRoutes.tsx` — `/quick` route
- `src/hooks/useVoiceLog.ts` — new `parseVoiceInput()` + number-word normalisation
- `src/features/gym/useGym.ts` — `toggleSupersetLink()`
- `src/features/gym/WorkoutPlanner.tsx` — link/unlink button + grouped visuals
- `src/features/gym/SessionLogger.tsx` — grouped rendering, global-store rest, PR emit
- `src/lib/routes.ts` — `/quick` meta

No deletions. No touch to the achievements/streak/dayscore engines. No new deps.

---

## QA results

- **TypeScript strict:** 0 errors (`tsc -b`).
- **Vite build:** ✓ clean, 23.7 s. Only pre-existing "chunk > 500 kB" warning (antd bundle, unchanged).
- **Voice parser:** 16/16 test cases pass (water in ml + l + half-litre + word-numbers; sets in all documented shapes; meal fallback; empty input → null).
- **Superset group builder:** correct for standalone, pairs, triples, and orphaned-single-member groups.
- **Rest timer store:** drift-safe under pause; second-timer reset works; fires-zero exactly once.
- **`vite preview` smoke test:**
  - `GET /` → 200, correct title.
  - `GET /quick` → 200 (SPA rewrite), correct HTML shell.
  - `GET /manifest.webmanifest` → 200, `application/manifest+json`.
- **Vercel:** `vercel.json` already SPA-rewrites `/(.*) → /index.html`, so `/quick` deep-links work in production without config change.

Ready to deploy.
