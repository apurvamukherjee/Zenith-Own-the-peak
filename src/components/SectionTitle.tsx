import type { ReactNode } from "react";

// The large page title used across every feature page. The eyebrow is set in
// Cinzel via `.gothic-eyebrow` — the splash wordmark's font — so each page
// carries the gothic mood forward. Sticky + glass so it stays as context
// while the page scrolls under it; AppBar fades in a small copy once it's gone.
export function SectionTitle({ eyebrow, title, right }: {
  eyebrow?: string; title: string; right?: ReactNode;
}) {
  return (
    <div className="z-section-title">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="gothic-eyebrow z-section-title__eyebrow">{eyebrow}</div>}
        <h2 className="display">{title}</h2>
      </div>
      {right && <div className="z-section-title__right">{right}</div>}
    </div>
  );
}
