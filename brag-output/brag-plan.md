# Brag Plan: Zenith — Own the peak

## What is this app?
Zenith is a local-first, offline personal discipline tracker (training, nutrition, sleep, water, study, bike fuel, full calendar) with a gothic black-and-red identity that guilt-trips you into consistency instead of politely nudging you — the funniest proof being its Focus Mode: try to quit a workout early and it doesn't just ask "are you sure," it shames you.

## The angle
Play it as a mountain-ascent trailer, not a feature tour. Zenith's own copy is already brutal ("Try to leave early — it won't go well," "PR. Now go find the next one.") — the joke is that a personal tracker app talks like a drill sergeant. Open on the app doing the thing it's famous for (punishing a quit attempt), resolve into the wordmark, then move through the real UI at trailer scale: the discipline ring, the lock-in, the PR flash, the numbers (149 exercises, 83 badges, 3 splits). Land on the tagline that's been staring at us the whole time: "Own the peak."

## Hook (first 2-3 seconds)
Black frame. A thin red ember-glow line rises like a heartbeat monitor. A cursor taps "Leave workout." Hard cut to the real Focus Mode quit-shame screen (`focus-quit-1.png`) — its actual line on screen. No narration needed; the app's own copy is the punchline.

## Key moments (the middle)
- The glass discipline ring on Home (`home.png`) assembling and counting up — water / training / sleep / protein folding into one score, with the parallax glow the app actually ships.
- Focus Mode's lock-in gate (`focus-lock-in.png`) — the literal "commit before you see set one" contract — cutting straight into the full-bleed PR celebration flash (`pr-celebration.png`) with its real one-liner.
- A fast count-up of the numbers that make the drill-sergeant bit credible: 3 built-in splits, 149 exercises, 83 badges — real stat, not marketing fluff, shown over quick glimpses of `plan-switcher.png` and `hall.png`.

## Outro / punchline
Wordmark ZENITH in Cinzel over the app's own hero gradient (`--hero`: #1a0509 → #6e0f1c → #ff2740), tagline "Own the peak." settles under it, small signature line "by Apurva" beneath. No CTA button — the tagline is the CTA.

## User flow worth showing
Entry → key action → result, pulled straight from the product: open Focus Mode for today's lift (lock-in gate) → try to bail early (quit-shame screen) → get pulled back in and finish → PR celebration flash. This is the spine of the middle of the video, not a landing-page recreation — every frame in scenes 1 and 4 is a real screen the app actually shows a user.

## Tone
- Preset: cinematic
- Creative direction: gothic peak-ascent trailer — black-and-blood-red, the app as a drill sergeant that won't let you quit
- Interpretation: wide, confident shots with big Cinzel display type; few scenes (5) with generous holds; drama comes from the real screenshots and the app's own brutal one-liners, not from invented copy; restrained but weighty motion (slow hero gradient drift, hard-edged reveals on payoff moments only).

## Format: landscape — 1920x1080
## Duration: 20s

## Visual identity (from the project)
- Background: `#0d0608` (dark, "cold blood" near-black)
- Accent: `#ff2740` (aggressive red, dark-mode primary)
- Text: `#f3eef2` (dark-mode heading ink)
- Secondary accents: gold `#f6b93b`, ember glow `rgba(255,39,64,0.40)`
- Display font: Cinzel (600-900 weight) — used for the wordmark/brand moments
- Body font: Plus Jakarta Sans (headings) / Inter (body/UI)
- Strongest visual element: the app's own `--hero` gradient (`linear-gradient(135deg, #1a0509 0%, #6e0f1c 55%, #d81f34 100%)`) plus the real screenshots in `assets/screenshots/` — the discipline ring, the PR celebration flash, and the Focus Mode quit-shame screen are all shipped, camera-ready product moments, not recreations.

## Share copy (draft)
Zenith doesn't ask if you're sure you want to quit — it just makes you regret it. A gothic, offline discipline tracker for lifting, food, sleep, and everything else you keep almost skipping. Own the peak. 🖤

## Audio direction
- Role: cinematic support — low swell under the hook, restrained motion-matched hits on the two hard payoffs (quit-shame cut, PR flash), fade to silence under the final wordmark hold.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM, "steady and clean" — closest bundled match to a restrained cinematic bed; nothing gothic is bundled, so lean on low volume + sparse SFX to carry the dark tone rather than the track itself).
- Music treatment: start at 0.0s under the hook at low volume (~0.22-0.28, quieter than the default 0.3-0.4 band since the visuals carry the drama), no big swell until the reveal at scene 2, hold steady through the middle, gentle fade-out under the last 1.5s of the outro.
- Music cue guidance: preset read from `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.md`. Strong cues in the 0-25s window worth nudging toward (±0.15s tolerance, never at the expense of readability): 3.27s (scene 1→2 hard cut into the wordmark), 8.74s / 9.29s (scene 3's ring count-up landing), 13.11s (scene 4's PR-flash hit). Treat these as bias, not lock — the two hard payoffs (quit-shame cut, PR flash) are scripted on story beats first.
- Audio-reactive treatment: subtle — let the hero gradient's glow / ember-inner intensity breathe slightly with music RMS during scenes 2 and 5 only. No waveform or equalizer visuals anywhere.
- SFX posture: 2-3 big ones, cinematic per tone guidance — no dense layering.
- Audio-coupled moments: the quit-shame hard cut (scene 1→ text-on-screen), the ring count-up (scene 3), the PR celebration flash (scene 4), the wordmark settle (scene 5).
- Restraint rule: no comedic/UI click spam, no glitch SFX (wrong genre for this brand), no more than one impact hit per scene, silence is allowed to do work in the outro hold.

## Storyboard

### Scene 1 — The threat — 3s
Black frame, thin red ember-glow heartbeat line rises (0.0-0.6s). A minimal cursor taps a "Leave workout" control (0.6-1.0s). Hard cut to the real Focus Mode quit-shame screen (`focus-quit-1.png`), full-bleed, held long enough to read its actual on-screen line (1.0-2.8s settled).
Sequential/interaction: yes — simulated tap on "Leave workout," then the screen answers back. One beat, not a list.
Audio intent: tense, quiet build, then a single hard stab on the cut to the shame screen — the "oh no" moment.
Audio-coupled idea: simulated tap gets a soft `interface/click_00x`; the hard cut to the quit-shame screen gets one `impact/impactBell_heavy_000` (or `_004`) at the cut, not before.
Music: cinematic bed enters quiet under the heartbeat line, ~0.22 volume.
Transition mood: dramatic wipe → Scene 2

### Scene 2 — The wordmark — 3s
Cut to the app's own `--hero` gradient (`#1a0509 → #6e0f1c → #d81f34`) filling the frame. "ZENITH" slams in in Cinzel, full scale, centered (0.0-0.5s in, then holds). Tagline "Own the peak." fades up beneath it at 1.2s and holds to the end of the scene.
Sequential/interaction: none — one clean reveal.
Audio intent: release after scene 1's tension — the payoff beat, weighty not triumphant.
Audio-coupled idea: one `impact/impactSoft_medium_00x` under the wordmark slam at 0.0-0.1s in.
Transition mood: hard cut → Scene 3

### Scene 3 — The ring — 4s
Real Home dashboard screenshot (`home.png`) framed wide, glass discipline ring visible. The ring's fill/parallax glow is subtly animated in (simulating the app's own entrance cascade) while the app's own four ring-chip labels tick in one at a time beside it, exactly as shown on screen: "Water." "Train." "Sleep." "Protein." (each ~0.6-0.7s apart, settling into a single line "→ one score." at the end).
Sequential/interaction: yes — 4 short labels arrive one by one, each ~0.8s settled read time, landing on the merged line.
Audio intent: mechanical, building confidence — each label lands like a system check clearing.
Audio-coupled idea: each label gets a soft `interface/select_008` or `ui/click1`; the final merged line gets a slightly stronger `interface/drop_001`.
Transition mood: clean wipe → Scene 4

### Scene 4 — The lock-in — 5s
Real Focus Mode lock-in screen (`focus-lock-in.png`) holds briefly (0.0-1.2s) — establishing "you commit before you see set one." Hard cut/flash straight into the full-bleed PR celebration screen (`pr-celebration.png`) with its real one-liner on screen, held to read (1.2-4.5s settled).
Sequential/interaction: none — two beats, not a list; the cut itself is the interaction (commit → payoff).
Audio intent: the biggest hit in the video — this is the emotional peak.
Audio-coupled idea: one `impact/impactBell_heavy_004` exactly at the flash to the PR screen.
Transition mood: chaotic flash → Scene 5

### Scene 5 — The numbers, then the peak — 5s
Quick count-up over glimpses of `plan-switcher.png` and `hall.png`: "3 splits." "149 exercises." "83 badges." each landing fast (~0.5-0.6s apart — accent only, not a full read-hold, since these are punch numbers not sentences) before the frame settles back to the hero gradient with "ZENITH" and "Own the peak." reprised, small "by Apurva" signature line beneath, holding to black.
Sequential/interaction: yes — 3 stat beats arrive fast then the frame settles; treat the 3 numbers as accents (short, punchy, sub-floor is acceptable here because each is 1-2 words, not a sentence) landing on strong cues if available.
Audio intent: quick propulsive burst, then the whole mix falls away under the final hold — silence doing the closing work.
Audio-coupled idea: each stat gets a light `casino/chip-lay-00x` (stacking feel); final settle gets no new hit, just the existing bed fading out under the hold.
Music: fades out over the last 1.5s of the scene.
Transition mood: soft → (end)

**Music mood for this video:** cinematic
**Audio summary:** A restrained cinematic bed enters quiet under the hook's tension, releases into one weighty hit at the wordmark reveal, ticks through the ring and lock-in/PR beats with sparse motion-matched accents (loudest hit on the PR flash — the emotional peak), bursts briefly for the stat count-up, then fades to silence under the final wordmark hold so the tagline lands in quiet.
