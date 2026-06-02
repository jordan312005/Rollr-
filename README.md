# 🛞 Rollr

Campus-focused, on-demand vehicle repair — *"AAA for bikes & scooters."*

Monorepo:

```
rollr/
├── backend/   Node.js + Express API (talks to Supabase Postgres)
└── mobile/    Expo (React Native) app
```

**Stack:** Expo (React Native) · Node.js + Express · PostgreSQL · Supabase (auth + Postgres + realtime)

---

## What's built

### Phase 1 — Foundation & Auth ✅
- Clean monorepo: screens / components / hooks / services / config separated.
- Postgres schema: `roles`, `users`, `vehicle_types`, `jobs`, `subscriptions`, `messages`, `ratings`.
- Vehicle types in a **config file** (`*/config/vehicleTypes.*`) — add a type with no schema migration.
- Three-role auth:
  - **Customer** — self-register + login (Supabase email/password).
  - **Mechanic** — login only; accounts issued by admin (no self-signup).
  - **Admin** — separate login with hardcoded credentials (MVP), backend-issued JWT.
- Each role routes to its own home screen (role name + logout).
- Secrets in `.env` (+ `.env.example`); seed script prints test credentials.

### Phase 2 — Customer Repair Request Flow ✅
- **Request Repair** screen: vehicle selector, problem description, optional photo
  (camera/library via expo-image-picker), one-tap current location (expo-location), submit → `pending`.
- **Job Status** screen: details + visual tracker `Pending → Accepted → In Progress → Completed`,
  cancel button visible only while `pending`.
- **Customer Home**: shows the active job (if any) or a *Request Repair* button.
- All job data persists in Supabase Postgres via the backend API.

> Not yet built (future phases): Stripe, chat, notifications, ratings, admin dashboard, mechanic job flow.
> Hook-in points are marked with `TODO(...)` comments.

---

## Prerequisites
- Node.js ≥ 20 (this repo was set up with Node 22).
- A free [Supabase](https://supabase.com) project — provides Postgres **and** auth.
- Expo Go app on your phone, or an iOS/Android simulator.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. Grab from **Project Settings → API**: Project URL, `anon` key, `service_role` key.
3. Grab from **Project Settings → Database**: the Postgres connection string (URI).
4. Create a **public** Storage bucket named `job-photos` (for repair photos).

### 2. Backend
```bash
cd backend
cp .env.example .env        # then paste your real Supabase values
npm install
npm run db:migrate          # create tables
npm run db:seed             # create admin/mechanic/customer + print credentials
npm run dev                 # http://localhost:3000
```

### 3. Mobile
```bash
cd mobile
cp .env.example .env        # paste EXPO_PUBLIC_SUPABASE_URL + ANON key
                            # set EXPO_PUBLIC_API_URL to your machine's LAN IP for a physical device
npm install
npx expo start
```

## Test accounts
`npm run db:seed` prints them. Defaults (override in `backend/.env`):

| Role     | Email                | Password            |
|----------|----------------------|---------------------|
| Admin    | admin@rollr.test     | ChangeMe_Admin123!  |
| Mechanic | mechanic@rollr.test  | ChangeMe_Mech123!   |
| Customer | customer@rollr.test  | ChangeMe_Cust123!   |

## API quick reference
| Method | Path                     | Auth        | Purpose                         |
|--------|--------------------------|-------------|---------------------------------|
| GET    | /api/health              | –           | Health check                    |
| GET    | /api/vehicle-types       | –           | Vehicle type config             |
| POST   | /api/auth/register       | –           | Customer self-registration      |
| POST   | /api/auth/admin/login    | –           | Admin login → JWT               |
| GET    | /api/auth/me             | any role    | Current profile + role          |
| POST   | /api/jobs                | customer    | Create repair request (pending) |
| GET    | /api/jobs/active         | customer    | Current active job (or null)    |
| GET    | /api/jobs/:id            | customer    | Job detail                      |
| POST   | /api/jobs/:id/cancel     | customer    | Cancel (pending only)           |

See `SETUP.md` for more detail.
