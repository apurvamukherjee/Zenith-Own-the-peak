# Cinematic generator

Re-records [`docs/cinematic.mp4`](../../docs/cinematic.mp4) (1920×1080, about 52 s) and
[`docs/cinematic-preview.gif`](../../docs/cinematic-preview.gif) from the live app.
Run it again after UI changes.

| File | What it does |
|---|---|
| `seed.js` | Runs inside the page and seeds about 6 weeks of believable history (water, sleep, meals, progressive sets, bodyweight, XP) into a fresh browser profile. It never touches your own data. |
| `capture.cjs` | Uses Playwright to drive a scripted walkthrough (splash → Home → Train → log two sets → Nutrition → Calendar → Winter Arc → Stats → Hall of Frame). It records frames through the Chrome screencast and writes `timeline.json` with each scene's start time. |
| `music.py` | Synthesizes the original soundtrack with numpy (no samples) and times its sections to the timeline. |
| `compose.py` | Composites a phone mockup on an ember backdrop, adds animated captions and the end card, then muxes with the soundtrack through ffmpeg. |

## Run

Needs Node with Playwright and Chromium, Python 3 with numpy and Pillow, and ffmpeg.

```bash
npm run dev
```

In a second terminal:

```bash
mkdir -p cinematic-out && python3 -m venv cinematic-out/venv && cinematic-out/venv/bin/pip install -q fonttools brotli
```

```bash
cinematic-out/venv/bin/python -c "from fontTools.ttLib import TTFont
for n in ['cinzel-latin', 'plus-jakarta-sans-latin']:
    f = TTFont(f'public/fonts/{n}.woff2'); f.flavor = None; f.save(f'cinematic-out/{n}.ttf')"
```

```bash
node scripts/cinematic/capture.cjs
```

`capture.cjs` prints the run folder (`cinematic-out/run-<timestamp>`). Pass that folder to the next two steps:

```bash
python3 scripts/cinematic/music.py cinematic-out/run-<timestamp>/timeline.json cinematic-out/soundtrack.wav
```

```bash
CINE_FONTS=cinematic-out python3 scripts/cinematic/compose.py cinematic-out/run-<timestamp> cinematic-out/soundtrack.wav docs/cinematic.mp4
```

```bash
ffmpeg -ss 5.6 -t 16.4 -i docs/cinematic.mp4 -vf "fps=12,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 -y docs/cinematic-preview.gif
```

`CINE_URL` overrides the dev-server URL (default `http://localhost:6969`). `CINE_OUT` overrides the output folder.

## Using a different track (for example NCS)

The shipped soundtrack is original and generated in code, so it's covered by this repo's license.
NoCopyrightSounds tracks may be used in videos only with the credit line NCS asks for, and they
shouldn't be committed as standalone audio files. To make a version with an NCS track for YouTube
or socials, replace the audio when you export and paste NCS's credit into the video description:

```bash
ffmpeg -i docs/cinematic.mp4 -i your-ncs-track.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest zenith-ncs.mp4
```
