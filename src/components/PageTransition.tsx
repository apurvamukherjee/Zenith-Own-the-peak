import type { ReactNode } from "react";

// Padding wrapper; direct children rise in sequence (`.z-stagger`, ui.css).
// Route-level motion is handled globally by AnimatedRoutes.
// `tight`: fits exactly one screen without scrolling via `.tight-page`.
export function PageTransition({ children, tight }: { children: ReactNode; tight?: boolean }) {
  if (tight) {
    return (
      <div className="tight-page z-stagger" style={{ padding: "8px 14px 6px", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    );
  }
  return <div className="z-page z-stagger">{children}</div>;
}
