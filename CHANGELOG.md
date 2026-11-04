# Changelog

All notable changes to Zenith are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). APKs and IPAs are
attached to each [GitHub Release](https://github.com/apurvamukherjee/Zenith-Own-the-peak/releases).

## [Unreleased]

## [1.5.0] - 2026-11-04

### Added
- MIT `LICENSE`, `CONTRIBUTING.md`, issue forms and a CI workflow (typecheck, tests, build).
- `npm test` script.
- A 52 s 1080p cinematic walkthrough (`docs/cinematic.mp4`) with an original synthesized soundtrack, plus `scripts/cinematic/` to re-record it from the live app.
- PR flags are re-derived when a set is deleted, edited or restored.

### Changed
- README rewritten for the current app: cinematic preview and download link, 15 new screenshots, and the Winter Arc, Spending, Habits, Tasks, Reward Vault and Leaderboard modules. Counts corrected (100 badges, 148 exercises, 21 screens).
- Startup bundle 777 kB → 499 kB: the Convex cloud layer only loads when it's configured.
- Coach-mark tips sit next to what they explain and stay dismissed; the quick-log button tucks into an edge tab while scrolling.
- README opens with a one-line description, install command and live link, and its privacy section mentions Vercel Web Analytics on the hosted web version.

### Fixed
- Dismissed coach-mark tips no longer come back on every visit.
- Two fast first-set taps can't create duplicate workout sessions.
- Water pace no longer says "Way behind" when you're a couple hundred ml short right after waking.
- Focus timer keeps real time when the phone is locked.

## [1.4.0] - 2026-10-26

### Added
- Winter Arc (Nov 1 → Dec 31): a daily 61-day drill with debt, reserves, Exam Mode, weekly bosses, a festival Gauntlet and a Wrapped recap.
- Drill formats: EMOM, 20s/10s intervals and ladders, with a built-in timer.
- Arc page with a frost map of all 61 days, chapters, winter badges and a "How it works" explainer.
- Body map: muscles light up as you log sets; weekly volume per muscle in the Planner; muscle heat in Progress; custom exercises with their muscles.

### Fixed
- "Complete full day" no longer freezes the app.
- The arc card loads on rest days, and the vow, boss and Wrapped sheets stay open.

## [1.3.4] - 2026-10-22

### Added
- Set table with an edit sheet and swipe-to-delete; rest dock above the bottom nav.
- Reorder, skip or add exercises for today, and pair any two into a superset mid-workout.
- Session summary card at the end of a workout.
- First iOS build of this version (unsigned IPA).

### Changed
- Backup screen shows the last backup date and previews a restore before replacing anything.
- Zenith asks Android to keep its storage persistent on every launch.

## [1.3.3] - 2026-10-18

### Changed
- Redesigned Today's Summit card on Home and a cleaner 7-day week strip.
- Summit dial and sleep clock scale with screen size.

### Fixed
- Sleep clock labels no longer overlap; Tasks grid fits small phones; tier names readable in light mode.

## [1.3.2] - 2026-10-18

### Fixed
- Pages scroll when the swipe starts on a card, not only in the gaps.
- XP is granted once per day instead of on every launch.
- The leaderboard shows the weekly discipline average.
- Dates between midnight and 5:30 AM no longer slip back to yesterday.
- All-day event export end dates; restoring a non-backup file now errors instead of wiping data.

## [1.3.1] - 2026-10-14

### Fixed
- Screens no longer draw under the status bar on Android 15+.

## [1.3.0] - 2026-10-14

### Changed
- Redesign across every screen.

### Fixed
- Export buttons open the native share sheet on Android (they did nothing before).
- Cloud auto-backup runs whenever you're signed in and no longer re-uploads in a loop.

## [1.0.1] - 2026-10-14

### Fixed
- Notifications and haptics now work in the Android app.

## [1.0.0] - 2026-10-13

### Added
- First Android build with native reminders and a rest-timer notification.

[Unreleased]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.3.4...v1.4.0
[1.3.4]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.0.1...v1.3.0
[1.0.1]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/apurvamukherjee/Zenith-Own-the-peak/releases/tag/v1.0.0
