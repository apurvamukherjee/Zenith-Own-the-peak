# Zenith Leaderboard — Setup & Usage Guide

## One-time setup

Cloud sync now runs on **Convex** (migrated from Supabase — see CLAUDE.md
"Phase 5.1"). The `profiles` table already has `topBadges`/`badgeCount`
fields baked into `convex/schema.ts` — there's no manual SQL step anymore.
Just run `npx convex dev` once (see `DEPLOYMENT.md` part A) and it pushes the
schema for you.

## For you and your friends — step by step

### 1. Sign in to Cloud Sync
Settings → Cloud Sync → email → Send code → verify from email → Auto-backup ON.

### 2. Get your share code
Trophy icon (Home header) → `/leaderboard`. Your code shows at top: `ZN-XXXX`. Copy + send to friends.

### 3. Follow a friend
Leaderboard → "Add friend" → paste their code → Follow. Their stats + top 6 badges appear.

### 4. Tell friends to set up
Each friend: open Zenith → complete onboarding → Cloud Sync sign-in → share THEIR code with you → paste YOUR code on their end. Following is one-way — both must paste each other's codes.

## What friends see about you

| Data | Visible to followers? |
|---|---|
| Name, level, XP | Yes |
| Weekly discipline %, streak, volume | Yes |
| Top 6 badges (name + tier color) | Yes |
| Total badge count | Yes |
| Raw workout/meal/water/sleep data | Never |
| Mystery badge names (before unlock) | Never |

## Troubleshooting

- **"Code not found"** → friend needs at least 1 backup done first
- **0% discipline** → friend hasn't synced this week yet
- **No share code** → do one manual backup (Settings → Cloud Sync → Backup now)
- **Badges missing** → badges push on next backup (~4s after any action)
