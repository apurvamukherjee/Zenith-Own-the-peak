// Optional cloud layer. If the env var is absent the app runs 100% local —
// mirrors the old supabaseConfigured pattern.
//
// Only the flag lives here: the Convex client itself is built in
// ./convexRoot.tsx, which main.tsx imports dynamically when configured, so a
// local-only install never downloads the Convex/auth libraries at all.
export const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
export const convexConfigured = Boolean(convexUrl);
