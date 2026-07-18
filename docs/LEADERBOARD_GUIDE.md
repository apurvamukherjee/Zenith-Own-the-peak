# Zenith Leaderboard — Setup & Usage Guide

## One-time Supabase setup

You already ran the 4 tables. Just need 2 more columns. Run in **Supabase SQL Editor**:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS top_badges jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_count int DEFAULT 0;
```

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
