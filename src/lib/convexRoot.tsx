import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convexUrl } from "./convexClient";

// Loaded via dynamic import from main.tsx only when VITE_CONVEX_URL is set.
const client = new ConvexReactClient(convexUrl as string);

export function ConvexRoot({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
