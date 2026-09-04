-- ──────────────────────────────────────────────────────────────────────────
-- Rollr database schema (Phase 1 + Phase 2)
-- Idempotent: safe to run multiple times.
-- ──────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ROLES ---------------------------------------------------------------------
create table if not exists roles (
  id   serial primary key,
  name text unique not null check (name in ('customer', 'mechanic', 'admin'))
);

-- USERS ---------------------------------------------------------------------
-- For customers & mechanics, `id` mirrors the Supabase auth.users id.
-- The admin (hardcoded creds for MVP) also gets a row here for completeness.
create table if not exists users (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  full_name  text,
  role_id    integer not null references roles(id),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_role on users(role_id);

-- VEHICLE TYPES -------------------------------------------------------------
-- Mirror of the config file (backend/src/config/vehicleTypes.js).
-- Jobs reference the key as TEXT, so new types need NO schema migration.
create table if not exists vehicle_types (
  key        text primary key,
  label      text not null,
  is_active  boolean not null default true,
  sort_order integer not null default 0
);

-- JOBS ----------------------------------------------------------------------
do $$ begin
  create type job_status as enum ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists jobs (
  id               uuid primary key default uuid_generate_v4(),
  customer_id      uuid not null references users(id) on delete cascade,
  mechanic_id      uuid references users(id) on delete set null,   -- assigned in Phase 3
  vehicle_type_key text not null,            -- by convention references vehicle_types.key
  description      text not null,
  photo_url        text,                     -- Supabase Storage public URL (optional)
  location_lat     double precision,
  location_lng     double precision,
  status           job_status not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_jobs_customer on jobs(customer_id);
create index if not exists idx_jobs_mechanic on jobs(mechanic_id);
create index if not exists idx_jobs_status   on jobs(status);

-- SUBSCRIPTIONS (future phase — schema only) --------------------------------
create table if not exists subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references users(id) on delete cascade,
  plan       text not null default 'free',
  status     text not null default 'inactive',
  -- TODO(Phase: Stripe/Subscriptions): stripe_customer_id, stripe_subscription_id, current_period_end
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on subscriptions(user_id);

-- MESSAGES (future chat phase — schema only) --------------------------------
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid not null references jobs(id) on delete cascade,
  sender_id  uuid not null references users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_job on messages(job_id);

-- RATINGS (future ratings phase — schema only) ------------------------------
create table if not exists ratings (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references jobs(id) on delete cascade,
  customer_id uuid not null references users(id) on delete cascade,
  mechanic_id uuid not null references users(id) on delete cascade,
  score       integer not null check (score between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (job_id)
);

-- updated_at auto-touch -----------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_users_updated before update on users
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_jobs_updated before update on jobs
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_subscriptions_updated before update on subscriptions
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Phase 3 — Realtime + Row Level Security on jobs
--
-- The backend writes to `jobs` via the pooler using a role that BYPASSES RLS,
-- so these policies do NOT affect the API. They exist purely so Supabase
-- Realtime (postgres_changes) can deliver row events to the right *clients*:
--   • customers receive changes to their own jobs (live status updates)
--   • mechanics receive open (pending) jobs + jobs assigned to them
-- The app uses these events as a trigger to refetch from the backend (the
-- source of truth), so realtime is a live-refresh signal, not a data path.
-- ──────────────────────────────────────────────────────────────────────────

alter table jobs enable row level security;

-- A customer can see their own jobs.
do $$ begin
  create policy jobs_select_own_customer on jobs
    for select to authenticated
    using (customer_id = auth.uid());
exception when duplicate_object then null; end $$;

-- A mechanic can see open (unassigned, pending) jobs and any job assigned to them.
do $$ begin
  create policy jobs_select_for_mechanic on jobs
    for select to authenticated
    using (
      (status = 'pending' and mechanic_id is null and exists (
        select 1 from users u join roles r on r.id = u.role_id
        where u.id = auth.uid() and r.name = 'mechanic'
      ))
      or mechanic_id = auth.uid()
    );
exception when duplicate_object then null; end $$;

-- Add `jobs` to the Supabase Realtime publication (idempotent).
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jobs'
  ) then
    alter publication supabase_realtime add table jobs;
  end if;
exception when undefined_object then
  -- publication doesn't exist (non-Supabase Postgres) — realtime simply won't
  -- be available; the app falls back to polling.
  null;
end $$;

-- SEED ROLES (idempotent) ---------------------------------------------------
insert into roles (name) values ('customer'), ('mechanic'), ('admin')
on conflict (name) do nothing;
