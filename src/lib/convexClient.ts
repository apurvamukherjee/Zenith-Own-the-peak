import { ConvexReactClient } from "convex/react";

// Optional cloud layer. If the env var is absent the app runs 100% local —
// mirrors the old supabaseConfigured pattern.
const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexConfigured = Boolean(url);

export const convexClient: ConvexReactClient | null = convexConfigured
  ? new ConvexReactClient(url as string)
  : null;
