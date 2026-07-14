export interface RouteMeta { title: string; rank: number; tab: boolean }

export const ROUTE_META: Record<string, RouteMeta> = {
  "/":          { title: "Home",        rank: 0, tab: true },
  "/workout":   { title: "Train",       rank: 0, tab: true },
  "/planner":   { title: "Planner",     rank: 1, tab: false },
  "/nutrition":  { title: "Nutrition",   rank: 0, tab: true },
  "/study":     { title: "Learn",       rank: 0, tab: true },
  "/profile":   { title: "Stats",       rank: 0, tab: true },
  "/progress":  { title: "Progress",    rank: 1, tab: false },
  "/review":    { title: "Weekly review", rank: 1, tab: false },
  "/water":     { title: "Water",       rank: 1, tab: false },
  "/sleep":     { title: "Sleep",       rank: 1, tab: false },
  "/fuel":      { title: "Fuel",        rank: 1, tab: false },
};

export function metaFor(pathname: string): RouteMeta {
  return ROUTE_META[pathname] ?? { title: "", rank: 0, tab: false };
}
