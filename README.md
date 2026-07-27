# IronFit

Personal training, nutrition, and body composition tracker with AI photo analysis.

**Stack:** Next.js 14 · Supabase (auth + Postgres + storage) · Anthropic Claude · Vercel

---

## What's included

- 🔐 Email/password auth with multi-user support (each user's data is fully isolated)
- 🏋️ Push/Pull/Legs training log with per-set reps, weight, and RIR tracking
- 📊 Body composition tracking (9 scale metrics)
- 📷 AI meal photo analysis with plan matching
- 🍽️ Meal plan with recipes, ingredient exclusions, one-tap logging
- 💧 Daily hydration tracking
- 📋 Brief export for feeding data to Claude for personalised feedback
- 🎯 Configurable targets (calories, protein, water, step goal, phase)
- 📱 PWA — installable to phone home screen

---

## Deployment — takes ~60 minutes end to end

### Prerequisites (one-off, ~15 min)

You'll need free accounts for:

1. **GitHub** — [github.com/signup](https://github.com/signup)
2. **Supabase** — [supabase.com](https://supabase.com) (free tier is enough)
3. **Vercel** — [vercel.com/signup](https://vercel.com/signup) (log in with GitHub)
4. **Anthropic Console** — [console.anthropic.com](https://console.anthropic.com) — add £10 credit to start

### Step 1: Create Supabase project (~5 min)

1. Log into [supabase.com](https://supabase.com) → **New Project**
2. Name it `ironfit`, pick a strong database password (save it), choose closest region
3. Wait ~2 min for it to provision
4. Once ready, go to **Settings → API** and note:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long JWT string)

### Step 2: Run the database schema (~2 min)

1. In Supabase → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this repo
3. Copy the entire contents into the SQL editor
4. Click **Run**
5. You should see "Success. No rows returned."

### Step 3: Configure Supabase Auth (~3 min)

1. Go to **Authentication → Providers**
2. **Email** provider should be enabled by default — confirm it is
3. Optional: to skip email confirmation for faster testing, toggle **Confirm email** off (turn back on for production)
4. Go to **Authentication → URL Configuration** — we'll come back here after deploying to Vercel

### Step 4: Get Anthropic API key (~3 min)

1. Log into [console.anthropic.com](https://console.anthropic.com)
2. Add £10 in credits under **Plans & Billing** (usage-based; each meal analysis costs ~£0.01)
3. Go to **Settings → API Keys** → **Create Key**
4. Name it `ironfit-production`, copy the key (starts with `sk-ant-`) — you can only see it once, so save it

### Step 5: Push code to GitHub (~5 min)

1. Extract this project zip somewhere on your computer
2. In a terminal:
   ```
   cd path/to/ironfit
   git init
   git add .
   git commit -m "initial commit"
   ```
3. Create a new repo on GitHub (private is fine) — don't tick "add readme" since we have one
4. Follow GitHub's instructions to push:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/ironfit.git
   git branch -M main
   git push -u origin main
   ```

### Step 6: Deploy to Vercel (~5 min)

1. Log into [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repo
3. Vercel auto-detects Next.js — leave the build settings alone
4. Before deploying, click **Environment Variables** and add three:

   | Name                              | Value                                    |
   | --------------------------------- | ---------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`        | (Project URL from step 1)               |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | (anon key from step 1)                  |
   | `ANTHROPIC_API_KEY`               | (Anthropic key from step 4, starts sk-ant-) |

5. Click **Deploy**
6. Wait ~2 min. You'll get a URL like `ironfit-abc123.vercel.app`

### Step 7: Complete Supabase auth setup (~2 min)

1. Copy your Vercel URL from step 6
2. Back in Supabase → **Authentication → URL Configuration**
3. Set **Site URL** to your Vercel URL (e.g. `https://ironfit-abc123.vercel.app`)
4. Add the same URL to **Redirect URLs** if it's not already listed
5. Save

### Step 8: Try it out

1. Open your Vercel URL
2. Click **Create account** — sign up with your email + password (min 6 chars)
3. If email confirmation is on, check your inbox
4. Sign in → you land in the dashboard
5. Set up your profile, log a workout, snap a meal photo

### Step 9: Install to phone home screen

- **iOS Safari:** open your Vercel URL → tap Share → **Add to Home Screen**
- **Android Chrome:** open URL → menu → **Install app** or **Add to Home Screen**

Opens like a native app, dark theme, safe-area handled.

---

## Optional: custom domain (~5 min, needs a domain)

1. In Vercel → your project → **Settings → Domains**
2. Add your domain (e.g. `ironfit.yourname.com`)
3. Follow Vercel's DNS instructions — usually adding a CNAME record at your registrar
4. Once verified (5-30 min for DNS propagation), update Supabase → Authentication → URL Configuration to use the custom domain

---

## Costs at your scale

For a private beta with 1–20 users:

- Supabase free tier: **£0** (up to 500MB database, 1GB storage, 50k monthly active users)
- Vercel free tier: **£0** (personal projects, non-commercial)
- Anthropic API: **~£3–15/month** depending on how many meal photos you analyse
- Custom domain: **~£12/year** (optional)

**Realistic first-month total: £3–15**

---

## Local development

If you want to make changes:

```
cd ironfit
npm install
cp .env.example .env.local
# fill in .env.local with your Supabase + Anthropic keys
npm run dev
```

Open `http://localhost:3000`.

---

## Adding more users

There's no invite system built in — anyone with your URL can sign up. Three options for controlling this:

1. **Quick:** in Supabase → Authentication → Providers → Email, toggle **Enable sign-ups** off after your friends have registered
2. **Better:** add allowlist logic to the `handle_new_user` trigger in `schema.sql` — reject any signup whose email isn't in an approved list
3. **Best:** wait until you actually need it — private beta with a "please email me for access" model works fine for < 50 users

---

## Troubleshooting

**"Cannot find module '@/lib/...'"** — Run `npm install` first.

**Login works but nothing loads** — check the environment variables in Vercel match Supabase exactly. Redeploy after changing them.

**Meal photo analysis fails** — check the Anthropic key in Vercel env vars. Check your Anthropic account has credit.

**Photo doesn't upload** — check the SQL schema ran fully. The `meal-photos` bucket should exist in Supabase Storage.

**"Storage policy violation"** — the RLS policies in `schema.sql` require you to be logged in. Try signing out and back in.

---

## What's next

Things you can add later:

- Weekly automated AI review (rather than copy/paste brief)
- Charts and trends (Recharts library)
- Multi-week phase planning
- Recipe database beyond the built-in options
- Push notifications (needs a service worker + FCM/APNs)
- Payments (Stripe) if you go public
