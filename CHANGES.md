# Zenith — Splash upgrade + palette warm-tone

## Drop-in instructions
Extract this zip at the root of your repo. It overwrites 4 files:

- `index.html`                     — added Cinzel font, matched pre-paint bg
- `src/App.tsx`                    — matched theme-color meta to new warm dark
- `src/index.css`                  — warmed dark palette + gothic classes + glitch/scanline keyframes
- `src/components/SplashScreen.tsx` — complete gothic rewrite

Also delete these 3 dead files (they've been dead since the gym redesign, flagged in CLAUDE.md as landmines):

    rm src/features/workout/ExerciseCard.tsx
    rm src/features/workout/WorkoutLogPage.tsx
    rm src/features/workout/RestTimer.tsx

## What changed

### Splash — gothic overhaul
- New wordmark font: **Cinzel** (Roman-monumental gothic serif) at 900 weight, 0.14em letter-spacing
- **Glitch effect** on ZENITH: two beats @ 0.9s and 2.2s, RGB-split (red + blue channels) with jitter and clip-path scanlines
- Background: cold blood-black radial (#1a0509 → #0d0608 → #050203), less rainbow than before
- **Grey ash particles** drifting down instead of red sparkles — moodier, less "sparkler"
- **Red scan-line sweep** under the wordmark (single pass, cubic-easing)
- **"BY APURVA"** in Cinzel small-caps with a breathing red text-shadow (2.4s pulse)
- Subtle CRT scanline overlay at 4% opacity for texture
- Radial vignette dims the edges
- Timing extended from 3.2s → 3.8s so the glitch beats have room to land

### Palette — subtle blood-red wash on dark mode
- `--bg`: `#08080a` → `#0d0608` (barely-perceptible warm tint on the black)
- `--surface`: `#16131a` → `#1a1013`
- `--border`: `#2a2330` → `#2f1a20`
- `--nav-bg`: matched
- Every visible surface now reads "cold blood" instead of "flat coal"
- Barely noticeable in isolation, unmissable side-by-side with the old palette
- Light mode: untouched (already had plenty of pink)

### Repo hygiene
- Deleted 3 dead workout files that were flagged as landmines in `CLAUDE.md`

## Full-app QAT
- `npm run build`: ✓ clean
- Zero TypeScript errors
- All 40 phase-3 features audited and confirmed present
