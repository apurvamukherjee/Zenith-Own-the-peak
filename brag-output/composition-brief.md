# Hyperframes Composition Brief: Zenith — Own the peak

## Objective
Create a short launch-style brag video for Zenith, a local-first, offline personal discipline tracker (gym, nutrition, sleep, water, study, bike fuel, calendar) with a gothic black-and-red identity.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/Users/apurvamukherjee/Desktop/code/Zenith-Own-the-peak`
- Primary files read: `README.md`, `index.html`, `src/theme.ts`, `src/index.css`, `package.json`, `assets/screenshots/*.png`, `assets/logo/screen.png`
- Product name: Zenith
- Tagline / strongest claim: "Own the peak." — also "Try to leave early — it won't go well" (Focus Mode quit-shame) and "PR. Now go find the next one." (PR celebration one-liner)
- Key UI or visual moment to recreate: use the **real product screenshots directly** (not recreated mockups) — `assets/screenshots/focus-quit-1.png`, `home.png`, `focus-lock-in.png`, `pr-celebration.png`, `plan-switcher.png`, `hall.png` — composited into the trailer frame (crop/frame/vignette as needed for cinematic presentation, but the screen content itself must be the real app).
- Copy that must appear verbatim (confirmed by reading the actual screenshot pixels):
  - "ZENITH"
  - "Own the peak."
  - Ring labels exactly as shown on `home.png`: "Water" / "Train" / "Sleep" / "Protein" (not "Training")
  - "3 splits." / "149 exercises." / "83 badges."
  - "by Apurva"
  - `focus-lock-in.png` reads: "FOCUS MODE · PULL B" / "You don't get to half-ass this. Lock in or get out." / button "LOCK IN"
  - `focus-quit-1.png` reads: "WAIT." / "Quit. Again. Shocking absolutely no one." / "16 sets left. Still leaving?" / button "Keep going" / link "Exit anyway"
  - `pr-celebration.png` reads: "PR. Now go find the next one." / "Close-Grip Lat Pulldown · 35kg × 10 · e1RM 47"

## Creative Direction
- Tone preset: cinematic
- Creative direction: gothic peak-ascent trailer — black-and-blood-red, the app plays as a drill sergeant that won't let you quit a workout
- Interpretation: wide, confident shots, big Cinzel display type, few scenes (5) with generous holds; drama comes from the real screenshots and the app's own brutal one-liners, not invented copy; restrained but weighty motion — slow hero-gradient drift, hard-edged reveals reserved for the two payoff moments (quit-shame cut, PR flash)
- Angle: Zenith's own copy is already brutal ("Try to leave early — it won't go well," "PR. Now go find the next one.") — the joke/hook is that a personal tracker talks like a drill sergeant. Open on the app doing the thing it's famous for (punishing a quit attempt), resolve into the wordmark, move through the real UI at trailer scale (discipline ring, lock-in, PR flash, the numbers), land on the tagline that's been implicit the whole time.
- Hook: black frame, thin red ember heartbeat line rises, a simulated tap on "Leave workout," hard cut to the real Focus Mode quit-shame screen held long enough to read.
- Outro / punchline: ZENITH wordmark over the app's own hero gradient, "Own the peak." settles beneath it, small "by Apurva" signature line, hold to black.
- Avoid:
  - Generic SaaS language ("streamline your workflow" etc.)
  - Abstract filler visuals — every scene must use a real screenshot or the app's real palette/type, not generic motion graphics
  - Unrelated visual redesign — do not reskin the app's colors/fonts, use them as shipped

## Visual Identity
- Background: `#0d0608` (dark-mode near-black, "cold blood")
- Text: `#f3eef2` (dark-mode heading ink)
- Accent: `#ff2740` (dark-mode aggressive red / colorPrimary)
- Secondary accents: gold `#f6b93b`, ember glow `rgba(255,39,64,0.40)` / ember inner `rgba(255,39,64,0.18)`
- Hero gradient (use verbatim for wordmark/outro scenes): `linear-gradient(135deg, #1a0509 0%, #6e0f1c 55%, #d81f34 100%)`
- Display font: Cinzel (weight 600-900) — brand/wordmark moments
- Body font: Plus Jakarta Sans (headings, weight 600-800) / Inter (body/UI text, weight 400-600)
- Visual references from the project: `assets/screenshots/{focus-quit-1,home,focus-lock-in,pr-celebration,plan-switcher,hall}.png`, `assets/logo/screen.png` (app icon/logo, usable in the outro if it strengthens the brand moment without cluttering it)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. The threat — 3s — ember heartbeat line, simulated tap, hard cut to real `focus-quit-1.png` held to read
2. The wordmark — 3s — hero gradient fills frame, "ZENITH" slams in (Cinzel), "Own the peak." fades up
3. The ring — 4s — real `home.png` framed wide, discipline ring entrance, 4 short labels tick in one by one (Water/Training/Sleep/Protein) landing on a merged line
4. The lock-in — 5s — real `focus-lock-in.png` holds briefly, hard flash-cut into real `pr-celebration.png` held to read its actual line — the emotional peak of the video
5. The numbers, then the peak — 5s — fast count-up (3 splits / 149 exercises / 83 badges) over glimpses of `plan-switcher.png` / `hall.png`, settles back to hero gradient with "ZENITH" + "Own the peak." reprised + "by Apurva," hold to black

## Audio
- Audio role: cinematic support — quiet tension under the hook, one weighty hit at the wordmark reveal, sparse motion-matched hits on the two hard payoffs (quit-shame cut, PR flash — the loudest hit in the video), a quick propulsive burst under the stat count-up, then fade to silence under the final wordmark hold.
- Audio arc: quiet build → release → steady ticking confidence → biggest hit (PR flash) → quick burst → silence under the closing hold.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM) — the closest bundled match to a restrained cinematic bed; nothing gothic is bundled, so the dark tone is carried by visuals/SFX/low volume rather than the track's own character.
- Music treatment: enter at ~0.22-0.28 volume under scene 1, hold steady through the middle, fade out over the last ~1.5s of scene 5. Never exceed ~0.4.
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (and matching `.md`). Strong-cue candidates in the 0-25s window worth nudging toward (±0.15s, story/readability wins if they conflict): 3.27s (scene 1→2 cut into the wordmark), 8.74s/9.29s (scene 3 ring/label landing), 13.11s (scene 4 PR-flash hit). Use 1-3 locks, not all of them.
- Audio-reactive treatment: subtle — hero gradient glow / ember-inner intensity may breathe slightly with music RMS during scenes 2 and 5 only. No waveform/equalizer visuals anywhere.
- Audio-coupled moments:
  - Scene 1 — simulated tap on "Leave workout" (soft click), hard cut to quit-shame screen (one bell/impact hit at the cut)
  - Scene 2 — wordmark slam (one soft-medium impact under the entrance)
  - Scene 3 — 4 sequential labels (soft select/click per label, slightly stronger drop on the merged line)
  - Scene 4 — PR flash (loudest single hit in the video, exactly at the flash)
  - Scene 5 — 3 stat beats (light stacking-chip accents), final settle gets no new hit, just the bed fading under the hold
- SFX selection guidance: cinematic energy per `audio.md` — 2-3 big hits total (bell/impact family for the two payoffs and the wordmark), light card/chip/click accents for the sequential label and stat moments. No glitch/error SFX (wrong genre for this brand). No dense layering.
- SFX analysis guidance: read `sfx-analysis.md`/`sfx-analysis.json` beside the SFX library; prefer low/medium high-frequency-risk files since several moments (labels, stats) repeat within the video.
- Exact SFX choice: Hyperframes chooses exact filenames/timestamps/volume once the animation is implemented.
- Audio files: music copied to `brag-output/composition/assets/music/`; Hyperframes copies any SFX it selects into the same `assets/` tree.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). `/brag` is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (this composition should show several — the screenshots are the centerpiece, not a mockup recreation).
- Keep all text readable in the final render — read the real screenshot pixels for scenes 1 and 4's exact on-screen copy before finalizing any overlay text near them.
- Keep the video within 15-25 seconds (target 20s per the storyboard).
- Include the planned music/SFX layer — audio was not disabled by the user.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints; ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within ~0.15s. Smaller entrances may align to nearby beat points within ~0.10s. Use only 1-3 strong cue locks.
- Use SFX to support motion/interaction: card/chip sounds for the sequential label and stat reveals, bell/impact cues for the wordmark and the two payoff moments (quit-shame cut, PR flash), restraint elsewhere.
- Honor the planned music fade-in-under-tension / fade-out-under-final-hold treatment.
- Use the Hyperframes audio-reactive workflow for the subtle glow-breathing described above (scenes 2 and 5 only); if extraction is unavailable, document it and skip — do not block the render.
- Use local assets for audio and any required runtime/media dependencies.
- Run `hyperframes check` before render — it is brag's single gate.
