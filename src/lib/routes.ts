export interface RouteMeta { title: string; rank: number; tab: boolean }

export const ROUTE_META: Record<string, RouteMeta> = {
  "/":          { title: "Home",        rank: 0, tab: true },
  "/workout":   { title: "Train",       rank: 0, tab: true },
  "/planner":   { title: "Planner",     rank: 1, tab: false },
  "/nutrition":  { title: "Nutrition",   rank: 0, tab: true },
  "/study":     { title: "Learn",       rank: 0, tab: true },
  "/profile":   { title: "Stats",       rank: 0, tab: true },
  "/progress":  { title: "Progress",    rank: 1, tab: false },
  "/water":     { title: "Water",       rank: 1, tab: false },
  "/sleep":     { title: "Sleep",       rank: 1, tab: false },
  "/fuel":      { title: "Fuel",        rank: 1, tab: false },
  "/calendar":  { title: "Calendar",    rank: 1, tab: false },
  "/glance":    { title: "At a glance", rank: 1, tab: false },
  "/quotes":    { title: "Motivation",  rank: 1, tab: false },
  "/hall":      { title: "Hall of Frame", rank: 1, tab: false },
  "/vault":     { title: "Reward Vault", rank: 1, tab: false },
  "/settings":  { title: "Settings",    rank: 1, tab: false },
  "/quick":     { title: "Quick log",   rank: 1, tab: false },
  "/leaderboard": { title: "Leaderboard", rank: 1, tab: false },
  // Hidden from BottomNav (see components/BottomNav.tsx) but route/feature
  // stays live — tab:false so it now gets a normal back-arrow AppBar instead
  // of rendering as an orphaned tab page with no way back.
  "/tasks":       { title: "Tasks",       rank: 1, tab: false },
};

export function metaFor(pathname: string): RouteMeta {
  return ROUTE_META[pathname] ?? { title: "", rank: 0, tab: false };
}
