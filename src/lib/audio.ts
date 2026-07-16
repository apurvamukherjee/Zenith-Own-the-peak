// Tiny WebAudio helpers used by easter eggs. Zero external assets — everything
// synthesized on demand so the bundle stays lean and offline-first stays true.
// All calls are safe to invoke on any browser: if AudioContext isn't available
// (or the user hasn't granted a gesture), we just no-op silently.

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { return null; }
  return ctx;
}

/** Some browsers require a user gesture before audio plays. Call this from
 *  a "user has interacted" listener to warm the context up. */
export function unlockAudio(): void {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => { /* ignore */ });
  unlocked = true;
}

// Play a short sine "ping" with an ADSR-lite envelope. Used as a building block.
function ping(freq: number, when: number, dur = 0.35, gain = 0.18, type: OscillatorType = "sine"): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

/** Gym-bell "ding". Two overlaid pings for a bell-like harmonic. */
export function playBellDing(): void {
  const c = getCtx(); if (!c) return;
  unlockAudio();
  const t = c.currentTime + 0.02;
  ping(880, t, 0.9, 0.20, "sine");        // fundamental
  ping(1320, t, 0.6, 0.10, "sine");       // 5th harmonic-ish
  ping(1760, t + 0.01, 0.5, 0.06, "sine"); // 8ve
}

/** Short 4-note fanfare in the shape of Bill Conti's "Gonna Fly Now" intro.
 *  Sawtooth wave with a soft envelope — recognizable, brief (≈1.2 s). */
export function playRockyFanfare(): void {
  const c = getCtx(); if (!c) return;
  unlockAudio();
  const t0 = c.currentTime + 0.05;
  // Iconic 4-note motif transposed to G major: G4, C5, C5, E5 (approx).
  const notes: Array<[number, number, number]> = [
    // freq,  offset (s), duration (s)
    [392.00, 0.00, 0.28],   // G4
    [523.25, 0.30, 0.28],   // C5
    [523.25, 0.62, 0.20],   // C5 short
    [659.25, 0.85, 0.55],   // E5 sustained
  ];
  for (const [f, off, dur] of notes) {
    ping(f, t0 + off, dur, 0.18, "sawtooth");
    // Add a soft octave for body.
    ping(f * 2, t0 + off, dur * 0.9, 0.06, "triangle");
  }
}
