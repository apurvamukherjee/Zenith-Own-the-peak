# Contributing to Zenith

Thanks for helping. Zenith is a single-maintainer project, so small, focused PRs get merged fastest.

## Run it locally

You need Node 24 or newer (the tests run `.ts` files directly with `node --test`).

```bash
git clone https://github.com/apurvamukherjee/Zenith-Own-the-peak
cd Zenith-Own-the-peak
npm install
npm run dev        # prints a Local and a Network URL; open the Network one on your phone
```

No environment variables are needed. Cloud sync and Google Calendar sync are optional; see `.env.example`, `DEPLOYMENT.md` and `docs/GOOGLE_CALENDAR_SYNC.md` if you want to work on them.

To test a date-dependent feature, add `?now=2026-11-10T08:00` to the URL in dev (`?now=off` clears it).

## Checks

Run all three before opening a PR. CI runs the same ones.

```bash
npm run typecheck
npm test
npm run build
```

Tests live next to the code they cover as `*.test.ts` and use `node:test` with no framework.

## Opening a PR

1. Open an issue first for anything bigger than a bug fix, so we can agree on the approach.
2. Branch from `main` (`fix/…`, `feat/…`, `docs/…`).
3. Keep each PR to one change. Use [Conventional Commit](https://www.conventionalcommits.org) prefixes: `feat:`, `fix:`, `docs:`, `chore:`.
4. For UI changes, add a phone-width screenshot in both dark and light themes.

## Code style

- TypeScript strict. No `any`; use `unknown` and narrow it.
- UI components never touch Dexie directly. Reads and writes go through the `use*.ts` hooks.
- Icons come from `react-icons/tb` (Tabler) only.
- Colors in style props use CSS variables (`var(--accent)`, `var(--border)`). SVG and chart attributes use `useTokens()`.
- Build date keys with `todayKey()` / `weekKey()` from `src/lib/date.utils.ts`, never `toISOString().slice(0, 10)`.
- Comments explain *why*, not *what*.

`CLAUDE.md` and `ARCHITECTURE.md` cover the architecture and conventions in more depth.

## Questions, bugs and response time

- Questions and ideas go to [Discussions](https://github.com/apurvamukherjee/Zenith-Own-the-peak/discussions).
- Bugs and concrete feature requests go to [Issues](https://github.com/apurvamukherjee/Zenith-Own-the-peak/issues), using the templates.
- Every new issue and PR gets a first reply within 24 hours, even if it's only "seen, looking at it this weekend."

New here? Look for issues labelled [`good first issue`](https://github.com/apurvamukherjee/Zenith-Own-the-peak/labels/good%20first%20issue).
