// Single source of truth for navigation. `rank` drives transition direction
// (drill-in slides forward, back slides backward); `tab` marks the 5 roots.
export interface RouteMeta { title: string; rank: number; tab: boolean; }

export const ROUTE_META: Record<string, RouteMeta> = {
  "/": { title: "Zenith", rank: 0, tab: true },
  "/workout": { title: "Train", rank: 0, tab: true },
  "/nutrition": { title: "Nutrition", rank: 0, tab: true },
  "/study": { title: "Learn", rank: 0, tab: true },
  "/profile": { title: "Stats", rank: 0, tab: true },
  "/water": { title: "Water", rank: 1, tab: false },
  "/sleep": { title: "Sleep", rank: 1, tab: false },
  "/fuel": { title: "Fuel", rank: 1, tab: false },
  "/progress": { title: "Progress", rank: 1, tab: false },
  "/review": { title: "Weekly review", rank: 1, tab: false },
};

export function metaFor(path: string): RouteMeta {
  return ROUTE_META[path] ?? { title: "", rank: 1, tab: false };
}
