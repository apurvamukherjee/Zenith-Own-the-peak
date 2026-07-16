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
