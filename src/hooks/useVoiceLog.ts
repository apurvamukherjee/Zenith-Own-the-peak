import { useEffect, useRef, useState } from "react";

// Voice log (Batch 4) — Web Speech API wrapper.
// Chrome/Android: fully supported. Safari desktop: partial. iOS Safari: no.
// The hook exposes `supported` so callers can hide the UI where it won't work
// instead of showing a broken button.
type SRConstructor = new () => SpeechRecognition;
interface SRWindow extends Window {
  SpeechRecognition?: SRConstructor;
  webkitSpeechRecognition?: SRConstructor;
}
interface SpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(i: number): SpeechRecognitionResult;
  [i: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(i: number): SpeechRecognitionAlternative;
  [i: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative { transcript: string; confidence: number; }

function getSR(): SRConstructor | null {
  const w = window as SRWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceLog() {
  const [supported] = useState<boolean>(() => getSR() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => { recRef.current?.abort?.(); };
  }, []);

  function start() {
    setError(null);
    setTranscript("");
    const Ctor = getSR();
    if (!Ctor) { setError("Voice input isn't supported on this browser."); return; }
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        final += ev.results[i][0].transcript;
      }
      setTranscript(final);
    };
    rec.onerror = () => { setError("Voice input failed. Try again."); setListening(false); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); }
    catch { setError("Couldn't start voice input."); }
  }
  function stop() { recRef.current?.stop(); }
  function reset() { setTranscript(""); setError(null); }

  return { supported, listening, transcript, error, start, stop, reset };
}

// Parse a voice utterance into a meal draft.
// "log 3 eggs and 200 ml milk" → best-effort quantity + noun.
// Falls back to name-only if no quantity is detected.
export interface VoiceParsed { name: string; grams?: number; count?: number; }
export function parseVoiceMeal(text: string): VoiceParsed | null {
  if (!text.trim()) return null;
  const cleaned = text.trim().replace(/^(log|add|ate|had)\s+/i, "");
  // "200g paneer" / "200 gram paneer" / "3 eggs" / "1 roti"
  const m = cleaned.match(/^(\d+(?:\.\d+)?)\s*(g|gram|grams|gm|ml|piece|pieces|pc|pcs)?\s+(.+)$/i);
  if (m) {
    const qty = parseFloat(m[1]);
    const unit = (m[2] ?? "").toLowerCase();
    const name = m[3].trim();
    if (unit.startsWith("g") || unit === "ml") return { name, grams: qty };
    return { name, count: qty };
  }
  return { name: cleaned };
}

// -----------------------------------------------------------------------------
// Phase-3 unified voice parser.
// Accepts three shapes:
//   1. Water:  "500 ml water" | "log water 750" | "add 250ml water"
//   2. Set:    "bench 60kg 8 reps" | "squat 100 kg for 5" | "log bench press 62.5 x 6"
//   3. Meal:   falls back to parseVoiceMeal above (existing behavior)
// The consumer (VoiceLogModal) branches on `.kind` and fuzzy-matches names
// against the appropriate catalog (foods or exerciseLibrary).
// -----------------------------------------------------------------------------
export type VoiceIntent =
  | { kind: "water"; ml: number }
  | { kind: "set"; exercise: string; weightKg: number; reps: number }
  | { kind: "meal"; parsed: VoiceParsed }
  | null;

const NUM = String.raw`\d+(?:\.\d+)?`;

/**
 * Parse a fully-transcribed utterance. Returns null if empty.
 * Number words (one..ten) are converted first so casual speech works too.
 */
export function parseVoiceInput(text: string): VoiceIntent {
  const raw = text.trim();
  if (!raw) return null;
  const cleaned = normalizeNumberWords(
    raw.toLowerCase().replace(/^(log|add|ate|had|drank|drink|do|record)\s+/i, "").trim(),
  );

  // 1. WATER — needs the token "water" (or "h2o") + a millilitre count.
  //    Order-agnostic. "water 500ml" / "500ml water" / "water 500" all match.
  if (/\b(water|h2o|hydrate)\b/.test(cleaned)) {
    // e.g. "500ml", "500 ml", "500", "0.5 l", "1 litre", "half a litre"
    const lit = cleaned.match(new RegExp(`(${NUM})\\s*(l|litre|litres|liter|liters)\\b`));
    if (lit) return { kind: "water", ml: Math.round(parseFloat(lit[1]) * 1000) };
    const half = /\bhalf\s+(a\s+)?(litre|liter|l)\b/.test(cleaned);
    if (half) return { kind: "water", ml: 500 };
    const ml = cleaned.match(new RegExp(`(${NUM})\\s*(ml|milliliter|milliliters|millilitre|millilitres)?\\b`));
    if (ml) {
      const n = parseFloat(ml[1]);
      // Heuristic: bare "water 1" is ambiguous. Only accept a bare number ≥ 50 (ml).
      if ((ml[2] && ml[2].length > 0) || n >= 50) return { kind: "water", ml: Math.round(n) };
    }
  }

  // 2. GYM SET — "bench 60kg 8 reps" / "squat 100 x 5"
  //    Pattern: <exercise words> <weight> [kg] <sep> <reps>
  //    Sep can be "x", "for", "reps", or whitespace.
  const set = matchSet(cleaned);
  if (set) return { kind: "set", ...set };

  // 3. MEAL — fallback to existing parser (uses ORIGINAL casing so brand names
  //    survive; we just did case-lowering for our regex work).
  const parsed = parseVoiceMeal(raw);
  return parsed ? { kind: "meal", parsed } : null;
}

// Convert "three" → "3", "seven" → "7", up to twenty for common rep counts.
const NUM_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13",
  fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18",
  nineteen: "19", twenty: "20",
};
function normalizeNumberWords(s: string): string {
  return s.replace(/\b([a-z]+)\b/g, (w) => NUM_WORDS[w] ?? w);
}

interface SetMatch { exercise: string; weightKg: number; reps: number; }
function matchSet(s: string): SetMatch | null {
  // "<exercise> <weight> [kg] <sep> <reps> [reps]"
  //   sep = "x", "for", "@", or whitespace with optional "reps"
  //   e.g. "bench press 62.5 kg x 6", "squat 100 for 5", "curl 15 kg 12 reps",
  //        "bench 60 8". Trailing " reps"/" rep" is optional.
  const rx = new RegExp(
    `^([a-z][a-z\\s\\-]{1,40}?)\\s+(${NUM})\\s*(kg|kgs|kilogram|kilograms)?` +
    `\\s*(?:x|for|@|by|-|\\s)\\s*(${NUM})\\s*(reps|rep)?\\s*$`,
    "i",
  );
  const m = s.match(rx);
  if (!m) return null;
  const exercise = m[1].trim().replace(/\s+/g, " ");
  const weightKg = parseFloat(m[2]);
  const reps = Math.round(parseFloat(m[4]));
  if (exercise.length < 2 || !isFinite(weightKg) || !isFinite(reps) || reps <= 0) return null;
  return { exercise, weightKg, reps };
}
