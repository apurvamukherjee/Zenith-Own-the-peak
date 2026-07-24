"""One-off generator: turns assets/logo/screen.png (black bg + red mark) into
the web/app icon set. Run with `python3 scripts/gen-icons.py`. Not part of the
build pipeline — regenerate manually if the source logo changes."""
from PIL import Image
import os

SRC = "assets/logo/screen.png"
FG = (177, 14, 47)  # sampled solid interior red

im = Image.open(SRC).convert("RGBA")
w, h = im.size
px = im.load()

# Un-multiply against the (near-black) background to get a clean alpha mask,
# so the mark can be composited onto any background (transparent PNG).
mark = Image.new("RGBA", (w, h), (0, 0, 0, 0))
mpx = mark.load()
for y in range(h):
    for x in range(w):
        r, g, b, _ = px[x, y]
        ar = r / FG[0] if FG[0] else 0
        ag = g / FG[1] if FG[1] else 0
        ab = b / FG[2] if FG[2] else 0
        a = max(0.0, min(1.0, (ar + ag + ab) / 3))
        # Kill low-level compression noise from the near-black source bg
        # (otherwise it survives un-multiply as a faint speckled halo).
        a = 0.0 if a < 0.10 else min(1.0, (a - 0.10) / 0.90)
        mpx[x, y] = (FG[0], FG[1], FG[2], round(a * 255))

# Trim to content bounding box + small padding.
bbox = mark.getbbox()
pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.04)
l, t, r, b = bbox
l = max(0, l - pad); t = max(0, t - pad); r = min(w, r + pad); b = min(h, b + pad)
trimmed = mark.crop((l, t, r, b))

os.makedirs("public/icons", exist_ok=True)

# In-app transparent mark (any theme background).
trimmed.save("public/logo-mark.png")

BG = (13, 6, 8, 255)  # matches splash / theme-color

def square_icon(fill_ratio: int, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BG)
    tw, th = trimmed.size
    scale = (size * fill_ratio) / max(tw, th)
    rw, rh = round(tw * scale), round(th * scale)
    resized = trimmed.resize((rw, rh), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - rw) // 2, (size - rh) // 2))
    return canvas

# Standard "any" purpose icons — generous fill.
for size in (192, 512):
    square_icon(0.82, size).save(f"public/icons/icon-{size}.png")

# Maskable icons — keep content inside the ~80% safe-zone circle.
for size in (192, 512):
    square_icon(0.62, size).save(f"public/icons/icon-maskable-{size}.png")

# Apple touch icon — opaque bg required, iOS applies its own corner mask.
square_icon(0.78, 180).convert("RGB").save("public/apple-touch-icon.png")

# Favicons.
fav64 = square_icon(0.78, 64)
fav64.save("public/favicon.png")
fav_sizes = [16, 32, 48]
fav64.resize((16, 16), Image.LANCZOS).save("public/icons/favicon-16.png")
fav64.resize((32, 32), Image.LANCZOS).save("public/icons/favicon-32.png")
fav64.save("public/favicon.ico", format="ICO", sizes=[(s, s) for s in fav_sizes])

print("done", trimmed.size)
