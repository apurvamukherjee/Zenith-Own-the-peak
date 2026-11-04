# Original soundtrack for the Zenith cinematic — synthesized from scratch
# with numpy (no samples, no third-party audio), so it ships under the
# repo's own license. A minor, 120 BPM; its sections follow the capture's
# scene timeline: drone + impact on the splash, drop at Home, arpeggio from
# the first logged set, breakdown on Winter Arc, final hit on the end card.
# usage: python3 music.py <run dir>/timeline.json soundtrack.wav
import sys, json, wave, numpy as np
SR = 44100
tl = json.load(open(sys.argv[1]))
T0 = tl['scenes'][0]['t']
S = {s['key']: s['t'] - T0 for s in tl['scenes']}
DUR = S['end'] + 4.6
N = int(DUR * SR); t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)
def put(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))
def env(n, a, d):  # attack, exp decay (seconds)
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
def note(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, k):  # one-pole lowpass, k in (0,1]
    y = np.empty_like(x); a = 0.0
    kk = np.broadcast_to(np.asarray(k, dtype=float), x.shape)
    for i, v in enumerate(x): a += kk[i] * (v - a); y[i] = a
    return y
BEAT = 60 / 120; BAR = BEAT * 4
DROP = S['home']; ARP = S['log']; BREAK = S['arc']; BACK = S['stats']; END = S['end']
# chord roots per bar (A minor: Am F C G), as MIDI
PROG = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]

# --- Drone + swell under the splash -----------------------------------------
n = int((DROP + 0.2) * SR); x = np.arange(n) / SR
drone = (np.sin(2*np.pi*note(33)*x) + 0.5*np.sin(2*np.pi*note(45)*x*1.002)) * np.minimum(1, x/1.2) * 0.35
noise = lp(rng.standard_normal(n), 0.02) * np.clip((x - 2.5) / (DROP - 2.6), 0, 1) ** 2 * 1.4
put(drone + noise, 0)
# impact on the sword hit (splash: ~1.9s into the full-length intro)
def impact(at, g=1.0):
    n = int(3.2 * SR); x = np.arange(n) / SR
    f = 30 + 90 * np.exp(-x * 9)
    boom = np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-x * 1.4)
    crack = lp(rng.standard_normal(n), 0.35) * np.exp(-x * 7) * 0.6
    put((boom + crack) * g, at)
impact(1.9, 0.9)

# --- Beat ------------------------------------------------------------------
def kick():
    n = int(0.42 * SR); x = np.arange(n) / SR
    f = 48 + 130 * np.exp(-x * 30)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-x * 7) * 1.0
def hat():
    n = int(0.06 * SR); h = rng.standard_normal(n); h = h - lp(h, 0.5)
    return h * env(n, 0.001, 0.015) * 0.22
def clap():
    n = int(0.25 * SR); c = lp(rng.standard_normal(n), 0.45)
    e = sum(env(n, 0.001, 0.012) * (np.arange(n) >= int(k*0.011*SR)) for k in range(3)) + env(n, 0.001, 0.08)*0.5
    return c * e * 0.32
K, H, C = kick(), hat(), clap()
def saw(f, n):
    x = np.arange(n) / SR
    return sum(np.sin(2*np.pi*f*k*x) / k for k in range(1, 9)) * 0.55
bt = DROP; b = 0
while bt < END:
    bar = int(b // 4); root, chord = PROG[bar % 4]
    in_break = BREAK <= bt < BACK
    if not in_break or (b % 4 == 0):
        put(K, bt, 0.9 if not in_break else 0.5)
    put(H, bt + BEAT/2, 0.8, pan=0.25)
    if b % 4 in (1, 3) and bt >= ARP and not in_break: put(C, bt, 1.0, pan=-0.1)
    # sub bass: eighth-note pulse, sidechained feel via short decay
    for e in range(2):
        n = int(BEAT/2 * SR); x = np.arange(n) / SR
        s = np.sin(2*np.pi*note(root-12)*x) + 0.35*np.sin(2*np.pi*note(root)*x)
        put(s * env(n, 0.004, 0.16) * (0.55 if not in_break else 0.3), bt + e*BEAT/2)
    # pad on each bar
    if b % 4 == 0:
        n = int(BAR * SR); x = np.arange(n) / SR
        pad = sum(saw(note(m) * (1 + d), n) for m in chord for d in (-0.003, 0.003))
        pad = lp(pad, 0.035 if not in_break else 0.018) * np.minimum(1, x/0.35) * np.minimum(1, (BAR - x)/0.2) * 0.11
        put(pad, bt, pan=0.0)
    # arpeggio: 16ths over the chord, from the first logged set
    if bt >= ARP and not in_break:
        for s16 in range(4):
            m = (chord + [chord[0] + 12])[(b*4 + s16) % 4] + 12
            n = int(BEAT/4 * SR); x = np.arange(n) / SR
            tone = np.sign(np.sin(2*np.pi*note(m)*x)) * 0.5 + np.sin(2*np.pi*note(m)*2*x) * 0.3
            put(lp(tone, 0.25) * env(n, 0.002, 0.07) * 0.16, bt + s16*BEAT/4, pan=0.35 if s16 % 2 else -0.35)
    bt += BEAT; b += 1
# riser into the return from the breakdown
n = int((BACK - BREAK) * SR); x = np.arange(n) / SR
put(lp(rng.standard_normal(n), 0.01 + 0.25 * (x / x[-1]) ** 2) * (x / x[-1]) ** 2 * 0.35, BREAK)
# --- End card: final hit + held chord tail --------------------------------------
impact(END, 1.0)
n = int((DUR - END) * SR); x = np.arange(n) / SR
tail = sum(saw(note(m), n) for m in [45, 57, 60, 64]) 
put(lp(tail, 0.03) * np.exp(-x * 0.7) * 0.12, END)
# --- Master: soft clip, fade, normalise --------------------------------------
mix = np.stack([L, R], 1)
fade = np.ones(N); fade[-int(1.2*SR):] = np.linspace(1, 0, int(1.2*SR)); fade[:int(0.05*SR)] = np.linspace(0, 1, int(0.05*SR))
mix = np.tanh(mix * 1.1) * fade[:, None]
mix /= np.abs(mix).max() / 0.89
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', sys.argv[2], f'{DUR:.1f}s')
