<div align="center">

# ⛰️ Zenith

### *Own the peak.*

A local-first personal tracker — **training, nutrition, study, sleep, water, bike fuel, calendar & motivation** — in one gothic, offline dashboard. No account, no server, your data never leaves your device.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie-IndexedDB-EE6E73)
![Tabler Icons](https://img.shields.io/badge/Tabler-Icons-000000)
![PWA](https://img.shields.io/badge/Offline-first-000000)
![License](https://img.shields.io/badge/license-MIT-informational)

**Phase 1 — Live**

</div>

---

## ✨ Highlights

- 🏋️ **Two-screen gym engine** — a minimal Session Logger for the gym (progress bar, +/− weight/reps, tap to complete) and a full Workout Planner for the couch (56-exercise library, custom days, weekly schedule)
- 📊 **Discipline score** — one ring on Home that tells you if today is on track (water + training + sleep + protein, averaged)
- 📅 **Discipline calendar** — month grid colored by daily score with per-metric filters, streak freeze, workout backfill, on-this-day comparisons, goal countdowns, photo pins, range stats, and a GitHub-style year heatmap
- 🌅 **Time-aware greeting** — 7 time-of-day slots with matching icons, taglines, and evolving gradients from dawn to late night
- 💬 **Motivation deck** — swipeable quote cards you can add/edit/favorite by category (gym / study / life)
- 🖤 **Gothic dark mode** — black + aggressive red by default, with a one-tap Light toggle
- ⚡ **Quick-Log FAB** — floating action button on every screen, one tap to log water, meals, or jump to any tracker
- 🎨 **Make it yours** — custom profile picture, wallpaper with blur & opacity controls
- ☁️ **Optional cloud sync** — Supabase backup with email-code login, auto-push on change
- 🔔 **Smart reminders** — adaptive copy ("you're 700ml behind"), native push via Capacitor
- 📴 **Works anywhere** — offline, installable, phone-ready, zero backend required
- 💾 **You own the data** — one-tap JSON backup & restore

## 📦 Modules

| | Module | What it tracks |
|---|---|---|
| 🏠 | **Home** | Discipline ring, unified streak, training card, water quick-add, sleep, study up-next |
| ⚡ | **Train** | Session Logger — execute today's workout with minimal taps |
| 📋 | **Planner** | Workout Planner — create days, pick exercises, set weights, assign schedule |
| 📊 | **Progress** | Per-exercise e1RM trend, volume, % gain, PR log |
| 🍽️ | **Nutrition** | Meals & macros, calorie/protein targets, supplement schedule |
| 📚 | **Study** | Learning paths, topic backlog, auto "up next", notes, time logging |
| 💧 | **Water** | Pace-aware hydration with warnings, quick-add, 7-day chart |
| 😴 | **Sleep** | Bed/wake logging, duration, quality, weekly sleep-debt |
| ⛽ | **Fuel** | Full-to-full bike mileage (km/L), monthly spend, cost per km |
| 📅 | **Calendar** | Month grid colored by discipline score, filters, goal countdowns, photo pins, range stats, streak freeze, backfill, year heatmap |
| 💬 | **Motivation** | Swipeable quote deck by category (gym / study / life) — add, edit, favorite, delete |
| 📈 | **Stats** | All-module metrics, weekly review + insights, bodyweight, appearance, reminders, cloud sync, backup |

## 🛠 Tech stack

**React 19** · **TypeScript (strict)** · **Vite 5** · **Ant Design 5** · **Dexie (IndexedDB)** · **Framer Motion** · **Recharts** · **react-icons (Tabler)** · **React Router 6** · **dayjs** · optional **Supabase**

## 🚀 Quick start

```bash
npm install
npm run dev        # prints Local + Network URL
```

On your phone (same Wi-Fi), open the **Network** URL.

## ☁️ Deploy

```bash
npm run build      # → /dist
```

Import on **Vercel** → framework **Vite** → deploy. Full Supabase + Vercel setup in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## 📲 Native app (Capacitor)

```bash
npm i @capacitor/core @capacitor/cli
npx cap init Zenith com.apurva.zenith --web-dir=dist
npx cap add ios && npm run build && npx cap sync
```

## 🧱 Architecture

```
UI (features/*/*.tsx)        ← presentational only
  └─ data hooks (use*.ts)    ← the ONLY place Dexie is read/written
       └─ db (src/db/db.ts)  ← typed tables + export/import
```

Full context for contributors: [`CLAUDE.md`](./CLAUDE.md)

## 🔒 Privacy

100% on-device. No analytics, no account required. Cloud sync is optional and encrypted per-user via Supabase RLS.

## 📄 License

MIT

<div align="center"><sub>Built with discipline · by Apurva</sub></div>
