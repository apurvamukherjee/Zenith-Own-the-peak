import type { ReactNode } from "react";

// Padding wrapper. Page-level motion is handled globally by AnimatedRoutes.
// `tight`: fits exactly one screen without scrolling (e.g. Home) via the
// .tight-page utility class (deterministic safe-area-aware height calc).
export function PageTransition({ children, tight }: { children: ReactNode; tight?: boolean }) {
  if (tight) {
    return (
      <div className="tight-page" style={{ padding: "8px 14px 6px", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    );
  }
  return <div style={{ padding: "8px 16px 24px" }}>{children}</div>;
}
