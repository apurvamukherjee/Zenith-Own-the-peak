import type { ReactNode } from "react";

// Padding wrapper; direct children rise in sequence (`.z-stagger`, ui.css).
// Route-level motion is handled globally by AnimatedRoutes.
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="z-page z-stagger">{children}</div>;
}
