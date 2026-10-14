import { useState } from "react";

// Local edit buffer for a persisted value. Steppers, sliders and text fields
// show the draft instantly but persist once (on release/blur) — every Dexie
// write fans out through the mutation bus to the XP, achievement and backup
// engines, so per-tick writes would thrash them.
//
// The draft remembers which stored value it was based on. The moment the
// store moves (our own commit landing, or an import from elsewhere) the draft
// is dropped and the stored value shows — no one-frame flash back to the old
// value, which a "clear the draft after the save resolves" approach has.
export function useDraft<T>(stored: T): readonly [T, (v: T) => void] {
  const [draft, setDraft] = useState<{ base: T; v: T } | null>(null);
  // Render-time adjustment (React's sanctioned alternative to an effect).
  if (draft !== null && !Object.is(draft.base, stored)) setDraft(null);
  const active = draft !== null && Object.is(draft.base, stored);
  return [active ? draft.v : stored, (v: T) => setDraft({ base: stored, v })] as const;
}
