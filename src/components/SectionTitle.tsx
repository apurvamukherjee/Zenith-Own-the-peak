import type { ReactNode } from "react";

// The section header used across every feature page.
// The eyebrow ("TODAY'S TRAINING", "MEALS", etc.) is set in Cinzel via the
// `.gothic-eyebrow` global class — same font as the splash wordmark, so every
// page carries the gothic mood forward without any per-call styling.
export function SectionTitle({ eyebrow, title, right }: {
  eyebrow?: string; title: string; right?: ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14,
      position: "sticky", top: 0, zIndex: 5,
      background: "var(--nav-bg)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      paddingTop: 8, paddingBottom: 4,
    }}>
      <div>
        {eyebrow && <div className="gothic-eyebrow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}>{eyebrow}</div>}
        <h2 className="display" style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}
