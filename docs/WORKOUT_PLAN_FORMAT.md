# Zenith Workout Plan File — Format Reference

An advanced feature for bulk-loading a whole training program in one shot,
instead of building it by hand in the Planner. Settings → **Plan file
(advanced)** → Download to get a starting point from your current plan, or
write/generate a `.json` file matching the shape below and Upload it.

## Top-level shape

```json
{
  "type": "zenith-workout-plan",
  "version": 1,
  "days": [ /* WorkoutPlanDayDef[], see below — required, 1–50 entries */ ],
  "schedule": { /* optional weekday → day-name map, see below */ }
}
```

`type` and `version` must be exactly `"zenith-workout-plan"` and `1` — both
are checked before anything else in the file is read.

## A day

```json
{
  "name": "Push A",
  "muscles": ["chest", "shoulders", "triceps"],
  "exercises": [ /* WorkoutPlanExerciseDef[], required, 1–40 entries */ ]
}
```

- `name` — required, unique (case-insensitive) within the file. This is also
  what `schedule` entries reference, so keep it exact.
- `muscles` — array of muscle group ids (see table below). Optional, but used
  as the fallback `primaryMuscle` for any exercise in this day that needs to
  be newly created (see below) and doesn't specify its own.

## An exercise

```json
{
  "name": "Incline Dumbbell Press",
  "sets": 3, "repLow": 6, "repHigh": 10, "weightKg": 14, "restSec": 150,
  "primaryMuscle": "chest",
  "secondaryMuscles": ["shoulders", "triceps"],
  "equipment": "dumbbell",
  "cues": "Elbows tucked ~45°",
  "superset": "A"
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Matched case-insensitively against your existing exercise library first. |
| `sets` | yes | Whole number, 1–20. |
| `repLow` | yes | Whole number ≥ 1. |
| `repHigh` | yes | Whole number ≥ `repLow`. |
| `weightKg` | yes | Number ≥ 0. |
| `restSec` | yes | Whole number ≥ 0. |
| `primaryMuscle` | no | See muscle table. Only used if `name` doesn't match an existing exercise. |
| `secondaryMuscles` | no | Same. |
| `equipment` | no | Same — defaults to `"other"` if omitted. |
| `cues` | no | Same. |
| `superset` | no | Short tag (≤20 chars). See below. |

**Exercise matching, and why the metadata fields are usually ignored:** if
`name` matches an exercise already in your library (case-insensitive), that
exercise is reused as-is — `primaryMuscle`/`secondaryMuscles`/`equipment`/
`cues` in the file are silently ignored for it, so re-importing your own
export (or someone else's plan that happens to reuse "Barbell Squat") can
never quietly rewrite your shared exercise library's metadata. Those fields
only matter for genuinely new exercise names, which get added to your
library as custom exercises. If a new exercise has no `primaryMuscle` and its
day has no `muscles`, the file fails validation — nothing is imported until
you fix it.

**Muscle groups:** `chest`, `back`, `shoulders`, `biceps`, `triceps`, `quads`,
`hamstrings`, `glutes`, `calves`, `abs`, `forearms`, `traps`.

**Supersets:** give two or more *consecutive* exercises in the array the same
`superset` tag (any short string, e.g. `"A"`) to link them as a superset
chain (A1 → B1 → rest → A2 → B2 → rest …). The app only ever renders
adjacent-order superset links, so a tag reused non-adjacently, or on an
exercise with no matching neighbor, is ignored with a warning rather than
silently doing something unexpected.

## Schedule (optional)

```json
{ "mon": "Push A", "tue": "Pull A", "wed": "Rest" }
```

Keys: `mon` `tue` `wed` `thu` `fri` `sat` `sun`. Values are either `"Rest"` or
a `name` from `days` in this same file. Omit a key entirely to leave that
weekday's current assignment untouched (this is what makes **Add** mode
additive rather than overwriting your whole week). An unresolvable day name
is skipped with a warning, not a hard failure.

## Upload modes

- **Add as new days** — always creates new day rows, never matches against
  same-named existing days. Re-uploading the same file twice makes two copies
  of each day; re-upload an *edited* version of a plan you already imported
  using **Replace** instead.
- **Replace all days** — deletes all current workout days, their exercise
  assignments, and the weekly schedule first, then imports fresh. Your
  logged workout history and exercise library are never touched by either
  mode.

## Full example

```json
{
  "type": "zenith-workout-plan",
  "version": 1,
  "days": [
    {
      "name": "Push A",
      "muscles": ["chest", "shoulders", "triceps"],
      "exercises": [
        { "name": "Incline Dumbbell Press", "sets": 3, "repLow": 6, "repHigh": 10, "weightKg": 14, "restSec": 150 },
        { "name": "Overhead Press", "sets": 3, "repLow": 8, "repHigh": 12, "weightKg": 20, "restSec": 120 },
        { "name": "Lateral Raise", "sets": 3, "repLow": 12, "repHigh": 20, "weightKg": 6, "restSec": 75, "superset": "A" },
        { "name": "Triceps Pushdown", "sets": 3, "repLow": 10, "repHigh": 15, "weightKg": 15, "restSec": 75, "superset": "A" }
      ]
    },
    {
      "name": "Pull A",
      "muscles": ["back", "biceps"],
      "exercises": [
        { "name": "Pull-Up", "sets": 3, "repLow": 6, "repHigh": 12, "weightKg": 0, "restSec": 150 },
        { "name": "Chest-Supported Row", "sets": 3, "repLow": 8, "repHigh": 12, "weightKg": 14, "restSec": 120 },
        { "name": "Barbell Curl", "sets": 3, "repLow": 8, "repHigh": 12, "weightKg": 15, "restSec": 90,
          "primaryMuscle": "biceps", "equipment": "barbell" }
      ]
    }
  ],
  "schedule": { "mon": "Push A", "tue": "Pull A", "wed": "Rest" }
}
```
