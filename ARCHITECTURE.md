# Zenith — Architecture & backend path

Zenith is **front-end only** today: all data lives in the browser (IndexedDB via
Dexie). It's structured so a backend can be added later **without rewriting the UI.**

## The layers

```
UI (features/*/*.tsx)          ← presentational, never touches Dexie directly
  └─ data hooks (features/*/use*.ts, hooks/*.ts)   ← the ONLY place storage is called
       └─ db (src/db/db.ts)    ← Dexie instance + typed tables + export/import
```

Every read is a `useLiveQuery(...)` and every write is an exported async function
(`addWater`, `logSet`, `markDone`, …). Components never import `db` for writes.
That single seam is what makes the backend swap cheap.

Two Phase-2 additions ride these same seams with no new plumbing:
- **Achievements** are derived, not a new write path. `lib/achievements.ts`
  `buildContext()` reads existing tables and the unlock engine
  (`useAchievementEngine`, mounted in `AppShell`) recomputes off the mutation bus —
  the same debounce the cloud backup uses. The only stored state is the small
  `achievements` unlock table (definitions live in code).
- **Overlay history:** `hooks/useBackClose.ts` pushes a throwaway history entry
  while a modal is open so the device Back button closes it instead of navigating.
  It's a UI concern only — no data layer involvement.

## Adding a backend later (no UI changes)

1. Keep the DTOs in `src/db/types.ts` as the shared contract (reuse them in the API).
2. Give each hook file a remote implementation with the **same function signatures**
   (e.g. `addWater` → `POST /water`). Swap Dexie calls for `fetch`, or run both and
   treat Dexie as an offline cache.
3. For offline-first sync, add `updatedAt` + `deletedAt` columns and a `syncQueue`
   table; push the queue when online, pull deltas by `updatedAt`. Dexie stays the
   local source of truth; the server becomes the durable backup + multi-device sync.
4. Auth slots in at the app root (a provider around `<AppShell />`); hooks read the
   token from context.

Recommended when you're ready: **Convex** (what Phase 5's cloud sync/leaderboard
already uses — see `convex/` and `CLAUDE.md`) or a small **Node + Express +
Mongoose + Zod** service (matches the DTO-first pattern), fronted by TanStack
Query for caching.

## Native wrapper (Capacitor)

The build is a static SPA, so Capacitor wraps `/dist` directly. The in-app
reminder checks in `hooks/useReminders.ts` become true background notifications via
`@capacitor/local-notifications` — same schedule data, real OS reminders.
