# Deploying Zenith + enabling cloud backup

Zenith runs 100% locally with **no setup**. Cloud sync is optional — turn it on
when you want backups and multi-device restore.

---

## A. Cloud backup (Convex — free tier)

Schema, backend functions, and auth config all live in the repo under
`convex/` as versioned TypeScript — there's no dashboard SQL editor or RLS
policies to hand-write; `npx convex dev`/`deploy` pushes `convex/schema.ts`
and the `convex/*.ts` functions directly.

### 1. Local development (zero setup)
```bash
npx convex dev
```
The first run spins up a free **anonymous local deployment** (no Convex
account needed) and writes `VITE_CONVEX_URL` + `CONVEX_DEPLOYMENT` to
`.env.local` automatically. Leave this running alongside `npm run dev` —
it watches `convex/` and pushes schema/function changes live. Cloud sync
works fully on your machine at this point; only email delivery needs the
Resend step below.

### 2. Email OTP delivery (Resend)
Zenith signs you in with a 6-digit email code (`convex/ResendOTP.ts` — no
passwords, no magic-link redirect to misconfigure).
1. Create a free account at https://resend.com and copy an **API key**.
2. Set it as a Convex environment variable (server-side, not a Vite var):
   ```bash
   npx convex env set AUTH_RESEND_KEY re_your_key_here
   ```
3. `convex/ResendOTP.ts` sends from `onboarding@resend.dev`, Resend's
   built-in test sender — this works immediately for signing yourself in, but
   Resend restricts it to your own account email. To let **friends** sign in
   too (needed before they can appear on your leaderboard), verify a domain
   in the Resend dashboard and change the `from` address in
   `convex/ResendOTP.ts` to `you@yourdomain.com`.

### 3. Go live
Open **Settings → Cloud sync**, enter your email, type the code, and toggle
**Auto-backup**. Done — every change now pushes to the cloud a few seconds
later, and **Restore** pulls it onto any device. Signing in also powers
levels/achievements sync and the friends leaderboard (Phase 5) automatically
— there's nothing extra to configure per feature.

> Nothing to configure? The card will say "not configured" and the app keeps
> working locally with the manual Export/Import backup.

### 4. Production (Convex account required)
The anonymous local deployment above only runs while `npx convex dev` is
running on your machine — it's not reachable by a deployed Vercel app. For
production:
```bash
npx convex login          # one-time browser login
npx convex deploy         # pushes convex/ to a real cloud deployment
npx convex env set AUTH_RESEND_KEY re_your_key_here --prod
```
Copy the deployment URL `npx convex deploy` prints (or from the Convex
dashboard) into Vercel's `VITE_CONVEX_URL` env var — see part B below for the
build-command wiring.

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
2. Framework preset is auto-detected as **Vite** (output `dist`), but change
   the **Build Command** so it also pushes your Convex functions on every
   deploy:
   ```
   npx convex deploy --cmd 'npm run build'
   ```
3. **Environment Variables** → add:
   - `VITE_CONVEX_URL` — your production deployment URL from `npx convex deploy`
   - `CONVEX_DEPLOY_KEY` — generate one in the Convex dashboard under
     **Settings → Deploy Keys**; this is what lets the Vercel build push
     `convex/` without an interactive login
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
