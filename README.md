<div align="center">

# ⛰️ Zenith

### *Own the peak.*

A local-first personal tracker that puts your **training, nutrition, study, sleep, water & bike fuel** in one gothic, offline dashboard — no account, no server, your data never leaves your device.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie-IndexedDB-EE6E73)
![PWA](https://img.shields.io/badge/Offline-first-000000)
![License](https://img.shields.io/badge/license-MIT-informational)

</div>

---

> **Local-first by design.** Every metric lives in your browser via IndexedDB (Dexie). It runs fully offline, deploys as a static site to Vercel, and wraps into a native iOS/Android app with Capacitor — from a single codebase.

## ✨ Highlights

- 🏋️ **Real training engine** — your 6-day Push/Pull/Legs split with *ghost numbers to beat*, automatic PR detection, and a rest timer
- 📈 **Progress that means something** — estimated-1RM curves that rise when you add weight **or** reps
- 🖤 **Gothic dark mode** — black + aggressive red by default, with a one-tap Light toggle
- 🎨 **Make it yours** — custom profile picture and a wallpaper with your own blur & opacity
- 📴 **Works anywhere** — offline, installable, phone-ready, zero backend
- 💾 **You own the data** — one-tap JSON backup & restore

## 📦 Modules

| | Module | What it tracks |
|---|---|---|
| 🏠 | **Home** | A universal daily snapshot — training, water, sleep, streaks, study "up next" |
| ⚡ | **Train** | PPL logging, ghost numbers, PR flashes, rest timer, week-over-week overload |
| 📊 | **Progress** | Per-exercise e1RM trend, volume, % gain, PR log |
| 🍽️ | **Nutrition** | Meals & macros, calorie/protein targets, timed supplement & meal reminders |
| 📚 | **Study** | Learning paths (YouTube/course/book), topic backlog, auto "up next", notes, time logging |
| 💧 | **Water** | Pace-aware hydration — warns when you fall behind, celebrates when you hit goal, auto-bumps on gym days |
| 😴 | **Sleep** | Bed/wake logging, duration, quality, weekly sleep-debt, trend chart |
| 🏍️ | **Fuel** | Full-to-full mileage (km/L), ₹ monthly spend, cost per km, mileage trend |
| 📈 | **Stats** | Every metric across all modules + bodyweight trend, backup & appearance settings |

## 🎨 Experience

Built to feel fast and alive: an animated splash, directional page transitions, PR celebration flashes, and progress rings — all themed. The **entire palette flows through CSS variables** (`:root` = light, `[data-theme="dark"]` = gothic), so switching modes recolors accents, charts, rings, and gradients in one shot.

## 🛠 Tech stack

**React 19** · **TypeScript (strict)** · **Vite** · **Ant Design 5** · **Dexie (IndexedDB)** · **Framer Motion** · **Recharts** · **React Router** · **dayjs**

## 🚀 Quick start

```bash
npm install
npm run dev        # prints a Local URL and a Network URL
```

## 📱 Run on your phone

`npm run dev` exposes the app on your network. On your phone (same Wi-Fi), open the **Network** URL it prints — e.g. `http://192.168.x.x:5173`. `localhost` only works on the computer itself.

## ☁️ Deploy (Vercel)

```bash
npm run build      # → /dist   (vercel.json handles SPA routing)
```

Import the repo on Vercel → framework preset **Vite** → deploy. Opening the deployed URL is the most reliable way to test on mobile.

## 📲 Native app (Capacitor)

The build is a static SPA, so it wraps with no rewrite:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init Zenith com.apurva.zenith --web-dir=dist
npx cap add ios        # and/or android
npm run build && npx cap sync
```

In-app reminders become real OS notifications via `@capacitor/local-notifications`.

## 🧱 Architecture

```
UI (features/*/*.tsx)        ← presentational, never touches storage directly
  └─ data hooks (use*.ts)    ← the ONLY place Dexie is read/written
       └─ db (src/db/db.ts)  ← typed tables + export/import
```

Reads are `useLiveQuery`, writes are exported async functions — one clean seam that makes adding a backend (Supabase or Node + Express) cheap without touching the UI. Full write-up in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## 🔒 Data & privacy

100% on-device. No analytics, no account, no network calls for your data. Because it's local-only, **export a backup regularly** (Stats → Export) — clearing browser data wipes it.

## 🗺 Roadmap

- [ ] Capacitor local-notification reminders
- [ ] Optional cloud sync (Supabase) for multi-device
- [ ] Home-screen widgets

## 📄 License

MIT — see [`LICENSE`](./LICENSE).

<div align="center"><sub>Built with discipline · by Apurva</sub></div>
