# Zenith — "Own the peak"

A local-first personal tracker (React 19 + TypeScript + Ant Design). All data
lives on-device in IndexedDB (Dexie) — no backend, no account. Ships as a static
SPA (Vercel) and wraps natively with Capacitor, no rewrite. See ARCHITECTURE.md
for the backend-swap path.

## Modules
Splash → Home (universal daily overview) → Train (PPL log, ghost numbers, PR
detection, rest timer) · Progress (e1RM curves) · Nutrition (meals, macros,
schedule reminders) · Study (paths, topics, up-next, notes, time) · Water
(pace-aware warnings) · Sleep (duration, quality, debt) · Fuel (full-to-full
mileage, ₹ spend) · Stats (all-module metrics, bodyweight, backup, appearance).

## What's new in this build
- **Gothic dark mode** (black + aggressive red) as the default, with a Light
  toggle in Stats → Appearance. Accents, rings, charts and gradients all reflow.
- **Profile picture + custom wallpaper**, with user-controlled blur and opacity.
- **Mobile/Safari hardening**: LAN dev host, broad build target, `dvh` fallback,
  no white-flash, 16px inputs (kills iOS focus-zoom), `-webkit` blur prefixes,
  safe-area padding, and a Vercel SPA rewrite.
- **Date/time pickers are selection-only** — no keyboard pops up on mobile.

## Run
```bash
npm install
npm run dev            # prints a Local URL and a Network URL
```
On your iPhone/Android (same Wi-Fi), open the **Network** URL it prints
(e.g. http://192.168.x.x:5173). localhost only works on the computer itself.

## Build & deploy (Vercel)
```bash
npm run build          # -> /dist  (vercel.json handles SPA routing)
```
Import the repo on Vercel → framework **Vite** → deploy. Opening the deployed URL
on your phone is the most reliable way to test.

## Native wrapper
```bash
npm i @capacitor/core @capacitor/cli
npx cap init Zenith com.apurva.zenith --web-dir=dist
npx cap add ios        # and/or android
npm run build && npx cap sync
```
Nutrition reminders (`hooks/useReminders.ts`) become real OS notifications via
`@capacitor/local-notifications`.

## Theming notes
Colors live as CSS variables in `index.css` (`:root` = light, `[data-theme="dark"]`
= gothic). Chart/ring colors use concrete hexes from `theme.ts` `TOKENS` via
`useTokens()`, since SVG attributes can't read CSS variables.
