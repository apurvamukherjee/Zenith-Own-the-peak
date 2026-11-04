# Composites captured frames into a 1920x1080 cinematic: phone mockup on a
# dark ember backdrop, animated captions, end card. Pipes RGB to ffmpeg.
import sys, json, math, subprocess, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
# usage: python3 compose.py <run dir> <soundtrack.wav> <out.mp4>
# Fonts: the app's Cinzel + Plus Jakarta Sans, converted from public/fonts
# woff2 to .ttf in $CINE_FONTS (see ./README.md).
import os
run, wav, out = sys.argv[1:4]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FPS = 30; W, H = 1920, 1080
tl = json.load(open(f'{run}/timeline.json'))
T0 = tl['scenes'][0]['t']
frames = [(f['t'] - T0, f['file']) for f in tl['frames']]
scenes = [(s['key'], s['t'] - T0) for s in tl['scenes']]
END = dict(scenes)['end']; DUR = END + 4.6
FD = os.environ.get('CINE_FONTS', 'cinematic-out') + '/'
def font(name, size, wght):
    f = ImageFont.truetype(FD + name, size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f
CINZEL = lambda s, w=700: font('cinzel-latin.ttf', s, w)
JAK = lambda s, w=800: font('plus-jakarta-sans-latin.ttf', s, w)
RED = (255, 39, 64); INK = (244, 240, 241); SOFT = (170, 160, 164)
CAP = {
  'home':      ('01 · HOME',        'One discipline score.',        'Water, protein, training and sleep —\nclose all four, every day.'),
  'train':     ('02 · TRAIN',       'Your plan, pre-filled.',       'Last session’s weights, today’s targets,\nand the muscles you’re hitting.'),
  'log':       ('03 · LOG',         'One tap per set.',             'Rest starts itself. PRs are\nflagged the moment you beat one.'),
  'nutrition': ('04 · FUEL',        'Macros, measured.',            'An Indian-first food catalog —\nlog by weight, see P · C · F live.'),
  'calendar':  ('05 · CALENDAR',    'Discipline, day by day.',      'Every habit, workout and task\non one month you can read at a glance.'),
  'arc':       ('06 · WINTER ARC',  'The final 61.',                'One random drill a day, Nov 1 – Dec 31.\nMiss one and you owe it.'),
  'stats':     ('07 · STATS',       'Everything, measured.',        'Volume, PRs, sleep and protein —\nthe trends that actually matter.'),
  'hall':      ('08 · HALL OF FRAME', '100 badges to earn.',        'Levels, XP and mystery badges\nyou only learn about by earning.'),
}
# ---------- static layers ----------
def backdrop():
    bg = Image.new('RGB', (W, H), (6, 4, 5))
    glow = Image.new('L', (W, H), 0); d = ImageDraw.Draw(glow)
    d.ellipse((900, -200, 2100, 1300), fill=120); d.ellipse((-500, 500, 700, 1500), fill=45)
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    bg = Image.composite(Image.new('RGB', (W, H), (120, 8, 22)), bg, glow)
    vig = Image.new('L', (W, H), 0); ImageDraw.Draw(vig).ellipse((-300, -250, W + 300, H + 250), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(180))
    return Image.composite(bg, Image.new('RGB', (W, H), (0, 0, 0)), vig)
BG = backdrop()
SCR_W, SCR_H = 418, 904                      # 390x844 screen at ~1.07x
BEZ = 14; PH_W, PH_H = SCR_W + 2 * BEZ, SCR_H + 2 * BEZ
def rr_mask(w, h, r):
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255); return m
SCR_MASK = rr_mask(SCR_W, SCR_H, 44)
PHONE = Image.new('RGBA', (PH_W, PH_H), (0, 0, 0, 0)); pd = ImageDraw.Draw(PHONE)
pd.rounded_rectangle((0, 0, PH_W - 1, PH_H - 1), 58, fill=(18, 16, 17, 255), outline=(70, 60, 63, 255), width=2)
pd.rounded_rectangle((5, 5, PH_W - 6, PH_H - 6), 54, outline=(40, 34, 36, 255), width=2)
SHADOW = Image.new('L', (PH_W + 200, PH_H + 200), 0)
ImageDraw.Draw(SHADOW).rounded_rectangle((100, 120, PH_W + 100, PH_H + 110), 60, fill=200)
SHADOW = SHADOW.filter(ImageFilter.GaussianBlur(40))
LOGO = Image.open(os.path.join(ROOT, 'public', 'logo-mark.png')).convert('RGBA')
# embers
random.seed(4)
EMB = [(random.uniform(0, W), random.uniform(0, H), random.uniform(1, 3.2), random.uniform(10, 40), random.uniform(0, 6.28)) for _ in range(70)]
def ease(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def ease_out(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
fi = 0
def frame_at(t):
    global fi
    while fi + 1 < len(frames) and frames[fi + 1][0] <= t: fi += 1
    return frames[fi][1]
_cache = {}
def screen(path):
    if path not in _cache:
        _cache.clear()
        im = Image.open(path).convert('RGB').resize((SCR_W, SCR_H), Image.LANCZOS)
        _cache[path] = im
    return _cache[path]
def text(d, xy, s, f, fill, alpha, spacing=10, tracking=0):
    if alpha <= 0: return
    c = (*fill, int(255 * alpha))
    if tracking:
        x, y = xy
        for ch in s: d.text((x, y), ch, font=f, fill=c); x += d.textlength(ch, font=f) + tracking
    else:
        d.multiline_text(xy, s, font=f, fill=c, spacing=spacing)
def tracked_w(d, s, f, tr): return sum(d.textlength(ch, font=f) + tr for ch in s) - tr
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
    '-i', wav, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', out], stdin=subprocess.PIPE)
HOME = dict(scenes)['home']
for n in range(int(DUR * FPS)):
    t = n / FPS
    im = BG.copy()
    # embers drift up
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for (x, y, r, sp, ph) in EMB:
        yy = (y - t * sp) % H; xx = x + math.sin(t * 0.6 + ph) * 18
        a = int(90 + 80 * math.sin(t * 1.3 + ph))
        od.ellipse((xx - r, yy - r, xx + r, yy + r), fill=(255, 90, 60, max(0, a)))
    im.paste(ov, (0, 0), ov)
    # phone position: centered during splash, slides right as Home starts
    k = ease((t - (HOME - 0.6)) / 1.0)
    end_k = ease((t - END) / 0.9)
    cx = 960 + (1290 - 960) * k
    cy = 540 + 40 * (1 - ease_out(t / 1.4)) + end_k * 80
    alpha_phone = 1 - end_k
    scale = 0.96 + 0.04 * ease_out(t / 2.0)
    if alpha_phone > 0:
        ph = Image.new('RGBA', (PH_W, PH_H)); ph.paste(PHONE, (0, 0))
        scr = screen(frame_at(min(t, END - 0.05)))
        ph.paste(scr, (BEZ, BEZ), SCR_MASK)
        sw, sh = int(PH_W * scale), int(PH_H * scale)
        ph = ph.resize((sw, sh), Image.BICUBIC)
        sh_img = SHADOW.resize((int(SHADOW.width * scale), int(SHADOW.height * scale)))
        px, py = int(cx - sw / 2), int(cy - sh / 2)
        im.paste((0, 0, 0), (px - int(100 * scale), py - int(100 * scale)), sh_img.point(lambda v: int(v * 0.8 * alpha_phone)))
        if alpha_phone < 1: ph.putalpha(ImageChops.multiply(ph.getchannel('A'), Image.new('L', ph.size, int(255 * alpha_phone))))
        im.paste(ph, (px, py), ph)
    # captions
    txt = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(txt)
    for i, (key, st) in enumerate(scenes):
        if key not in CAP: continue
        en = scenes[i + 1][1]
        a_in = ease_out((t - st - 0.15) / 0.55); a_out = 1 - ease((t - (en - 0.4)) / 0.35)
        a = min(a_in, a_out)
        if a <= 0: continue
        eyebrow, title, sub = CAP[key]; dy = (1 - a_in) * 26
        x0 = 150
        d.rectangle((x0, 388 + dy, x0 + 38, 391 + dy), fill=(*RED, int(255 * a)))
        text(d, (x0 + 54, 374 + dy), eyebrow, CINZEL(26), RED, a, tracking=5)
        text(d, (x0, 420 + dy), title, JAK(72), INK, a)
        text(d, (x0, 528 + dy * 1.4), sub, JAK(30, 500), SOFT, a, spacing=12)
    # splash tagline under the phone? (splash itself carries the brand)
    # end card
    if t >= END:
        a = ease_out((t - END - 0.35) / 0.8); dy = (1 - a) * 30
        lg = LOGO.resize((150, int(150 * LOGO.height / LOGO.width)))
        if a > 0:
            lg2 = lg.copy(); lg2.putalpha(ImageChops.multiply(lg.getchannel('A'), Image.new('L', lg.size, int(255 * a))))
            txt.paste(lg2, (W // 2 - lg.width // 2, int(250 + dy)), lg2)
        f = CINZEL(120, 700); s = 'ZENITH'; tw = tracked_w(d, s, f, 22)
        text(d, (W / 2 - tw / 2, 430 + dy), s, f, INK, a, tracking=22)
        a2 = ease_out((t - END - 0.9) / 0.8)
        f2 = CINZEL(34, 500); s2 = 'OWN THE PEAK'; tw2 = tracked_w(d, s2, f2, 14)
        text(d, (W / 2 - tw2 / 2, 600), s2, f2, RED, a2, tracking=14)
        a3 = ease_out((t - END - 1.5) / 0.8)
        f3 = JAK(28, 500); s3 = 'Offline-first  ·  No account  ·  Free & open source'
        text(d, (W / 2 - d.textlength(s3, font=f3) / 2, 690), s3, f3, SOFT, a3)
        f4 = JAK(26, 700); s4 = 'zenith-own-the-peak.vercel.app'
        text(d, (W / 2 - d.textlength(s4, font=f4) / 2, 760), s4, f4, INK, a3)
        f5 = CINZEL(22, 500); s5 = 'BY APURVA'; tw5 = tracked_w(d, s5, f5, 8)
        text(d, (W / 2 - tw5 / 2, 900), s5, f5, SOFT, a3, tracking=8)
    im.paste(txt, (0, 0), txt)
    # fade in / out from black
    fade = min(ease(t / 0.5), 1 - ease((t - (DUR - 0.9)) / 0.9))
    if fade < 1: im = Image.blend(Image.new('RGB', (W, H)), im, max(0, fade))
    ff.stdin.write(im.tobytes())
ff.stdin.close(); ff.wait()
print('wrote', out, f'{DUR:.1f}s')
