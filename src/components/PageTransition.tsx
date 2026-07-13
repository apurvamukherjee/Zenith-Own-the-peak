import type { ReactNode } from "react";

// Padding wrapper. Page-level motion is handled globally by AnimatedRoutes.
export function PageTransition({ children }: { children: ReactNode }) {
  return <div style={{ padding: "8px 16px 24px" }}>{children}</div>;
}
