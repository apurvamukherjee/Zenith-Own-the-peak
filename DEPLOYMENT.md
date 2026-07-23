# Deploying Zenith + enabling cloud backup

Zenith runs 100% locally with **no setup**. Cloud sync is optional — turn it on
when you want backups and multi-device restore.

---

## A. Cloud backup (Supabase — free tier)

### 1. Create the project
1. Go to https://supabase.com → **New project** (free tier is enough).
2. Once it's ready, open **Project Settings → API** and copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public** key → this is `VITE_SUPABASE_ANON_KEY`

### 2. Create the backup table
Open **SQL Editor** and run:

```sql
create table if not exists public.backups (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.backups enable row level security;

create policy "read own backup"   on public.backups for select using (auth.uid() = user_id);
create policy "insert own backup" on public.backups for insert with check (auth.uid() = user_id);
create policy "update own backup" on public.backups for update using (auth.uid() = user_id);
```

Row-level security means each account can only ever touch its **own** backup row.

### 3. Add the leaderboard tables (Phase 5)
Sign-in also powers levels/achievements sync and the friends leaderboard.
Open **SQL Editor** and run:

```sql
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous',
  share_code   text unique not null,
  level        integer not null default 1,
  total_xp     integer not null default 0,
  top_badges   jsonb not null default '[]',
  badge_count  integer not null default 0,
  public       boolean not null default false,
  updated_at   timestamptz not null default now()
);

create table if not exists public.weekly_scores (
  user_id        uuid not null references auth.users(id) on delete cascade,
  week_key       text not null,
  discipline_avg integer not null default 0,
  streak_end     integer not null default 0,
  volume_kg      integer not null default 0,
  xp_earned      integer not null default 0,
  primary key (user_id, week_key)
);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id)
);

alter table public.profiles enable row level security;
alter table public.weekly_scores enable row level security;
alter table public.follows enable row level security;

-- profiles: readable by anyone signed in (share-code lookup needs to find a
-- stranger's profile before a follow relationship exists) — this only
-- exposes name/level/badges/share code, which is meant to be shareable.
create policy "read any profile" on public.profiles for select using (true);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "update own profile" on public.profiles for update using (auth.uid() = user_id);

-- weekly_scores: only your own row, or someone you already follow.
create policy "read own or followed scores" on public.weekly_scores for select using (
  auth.uid() = user_id
  or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followed_id = weekly_scores.user_id)
);
create policy "insert own scores" on public.weekly_scores for insert with check (auth.uid() = user_id);
create policy "update own scores" on public.weekly_scores for update using (auth.uid() = user_id);

-- follows: see who you follow / who follows you; only manage your own follows.
create policy "read own follows" on public.follows for select using (
  auth.uid() = follower_id or auth.uid() = followed_id
);
create policy "insert own follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "delete own follows" on public.follows for delete using (auth.uid() = follower_id);
```

### 4. Make the login send a 6-digit code
Zenith signs you in with an email code (no passwords).
Go to **Authentication → Email Templates → Magic Link** and make sure the body
includes the token, e.g.:

```
Your Zenith code: {{ .Token }}
```

(Default templates send a link; adding `{{ .Token }}` gives you the code the app
asks for. Email provider is enabled by default.)

### 5. Allow the sign-in link to return to the app
Go to **Authentication → URL Configuration → Redirect URLs** and add every
origin you'll actually sign in from, e.g.:

```
http://localhost:5173
https://your-app.vercel.app
```

Without this, tapping the emailed link redirects to whatever **Site URL** is
configured (often a stale default) instead of back to Zenith, and the app
never picks up the session — the 6-digit code still works either way, but the
link won't until its origin is allow-listed here.

### 6. Add the keys locally
Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart `npm run dev`. Open **Settings → Cloud sync**, enter your email, type the
code, and toggle **Auto-backup**. Done — every change now pushes to the cloud a
few seconds later, and **Restore** pulls it onto any device.

> Cloud sync moved from Stats to **Settings** in Phase 2. Everything local is
> included in the snapshot automatically — including your unlocked achievements
> and daily targets — so there's nothing extra to configure. The `backups` table
> and its RLS policies above are unchanged.

> Nothing to configure? The card will say "not configured" and the app keeps
> working locally with the manual Export/Import backup.

---

## B. Deploy to Vercel

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Zenith"
git branch -M main
git remote add origin https://github.com/YOU/zenith.git
git push -u origin main
```

### 2. Import on Vercel
1. https://vercel.com → **Add New → Project** → import the repo.
2. Framework preset is auto-detected as **Vite** (build `npm run build`, output `dist`).
3. **Environment Variables** → add the same two:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy.**

`vercel.json` already rewrites all routes to `index.html`, so deep links and
refreshes work. Opening the deployed URL on your phone is the most reliable test.

### CLI alternative
```bash
npm i -g vercel
vercel            # first run links the project
vercel --prod
```

---

## C. Native app + real reminders (later)

```bash
npm i @capacitor/core @capacitor/cli @capacitor/local-notifications
npx cap init Zenith com.apurva.zenith --web-dir=dist
npx cap add ios      # and/or android
npm run build && npx cap sync
```

Zenith detects the native runtime automatically and schedules your reminders as
real OS notifications (they fire even when the app is closed). On the web the
same reminders fire while the app is open.
