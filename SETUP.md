# Rollr — Setup & Run Guide

This is the step-by-step guide to get Rollr running locally. The code is
complete for **Phase 1 (auth)** and **Phase 2 (customer repair flow)**; it only
needs your Supabase credentials to come alive.

---

## 0. Node.js

This environment had no Node, so it was installed (no admin needed) at
`~/.local/node` and added to your PATH via `~/.zshenv` / `~/.zshrc`.

```bash
node -v   # v22.x
npm -v
```

If a brand-new terminal can't find `node`, run: `source ~/.zshenv`.

---

## 1. Create a Supabase project (provides Postgres + Auth)

1. Sign up / log in at https://supabase.com and create a new project.
2. **Project Settings → API** — copy:
   - **Project URL** → `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(backend only — keep secret)*
3. **Project Settings → Database → Connection string → URI** — copy into
   `DATABASE_URL` (replace `[YOUR-PASSWORD]` with your DB password).
4. **Storage → Create bucket** named `job-photos`, marked **Public**
   (used for Phase 2 repair photos).

> Tell me these values and I can wire them in + run the seed for you. Otherwise
> paste them into the two `.env` files below.

---

## 2. Backend

```bash
cd ~/rollr/backend
# .env already exists with placeholders — edit it (or copy from example):
#   cp .env.example .env
npm install            # already done during setup
npm run db:migrate     # creates all tables
npm run db:seed        # creates admin + mechanic + customer, PRINTS credentials
npm run dev            # starts API on http://localhost:3000
```

Quick check (no DB needed): `curl http://localhost:3000/api/health`

---

## 3. Mobile (Expo)

Edit `~/rollr/mobile/.env`:
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — from step 1.
- `EXPO_PUBLIC_API_URL`:
  - iOS Simulator → `http://localhost:3000/api`
  - Android emulator → `http://10.0.2.2:3000/api`
  - **Physical phone (Expo Go)** → `http://<your-computer-LAN-IP>:3000/api`
    (find it with `ipconfig getifaddr en0`). Phone and computer must share Wi-Fi.

```bash
cd ~/rollr/mobile
npm install            # already done during setup
npx expo start         # press i (iOS sim), a (Android), or scan QR in Expo Go
```

---

## 4. Try the flows
1. **Customer:** Welcome → "I need a repair" → create account (or use seeded
   customer) → Request Repair (pick vehicle, describe, add photo + location) →
   Submit → watch the status tracker → Cancel while Pending.
2. **Mechanic:** Welcome → "I'm a Mechanic" → seeded mechanic creds → mechanic home.
3. **Admin:** Welcome → "Admin" → seeded admin creds → admin home.

---

## Notes & gotchas
- **Customer can have one active request at a time** (enforced server-side).
- Photo upload is **optional** and **non-fatal** — if the `job-photos` bucket
  isn't set up, you'll be offered to submit without the photo.
- Admin auth uses **hardcoded creds** (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) and a
  backend-signed JWT — fine for MVP. `TODO` markers note where real RBAC goes.
- Future phases (Stripe, chat, notifications, ratings, admin dashboard, mechanic
  job flow) are stubbed with `TODO(...)` comments and empty schema tables.
