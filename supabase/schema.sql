create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  plan_tier text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  mode text not null check (mode in ('indexed', 'live', 'demo')),
  access_tier text not null check (access_tier in ('free', 'premium')),
  niche text not null,
  location text not null,
  radius integer not null default 25,
  filters jsonb not null default '{}'::jsonb,
  query_string text not null,
  source_summary jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  issue_counts jsonb not null default '{}'::jsonb,
  pitch_context jsonb not null default '{}'::jsonb,
  usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists indexed_leads (
  id text primary key,
  business_name text not null,
  niche text not null,
  city text,
  region text,
  location text not null,
  country text,
  address text,
  phone text,
  website text,
  rating numeric not null default 0,
  review_count integer not null default 0,
  lat numeric,
  lng numeric,
  place_source text not null default 'indexed',
  website_status text not null default 'unknown',
  issue_tags text[] not null default '{}',
  opportunity_score integer not null default 0,
  opportunity_type text,
  recommended_pitch_angle text,
  analysis_summary text,
  source_mode text not null check (source_mode in ('indexed', 'live', 'demo')),
  confidence numeric not null default 0,
  signals jsonb not null default '{}'::jsonb,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists indexed_leads_market_idx on indexed_leads (niche, location);
create index if not exists indexed_leads_score_idx on indexed_leads (opportunity_score desc);
create index if not exists indexed_leads_freshness_idx on indexed_leads (last_scanned_at desc);

create table if not exists scan_session_leads (
  scan_session_id uuid not null references scan_sessions(id) on delete cascade,
  lead_id text not null references indexed_leads(id) on delete cascade,
  primary key (scan_session_id, lead_id)
);

create table if not exists scan_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  mode text not null check (mode in ('indexed', 'live', 'demo')),
  tier text not null,
  query_key text not null,
  estimated_cost_usd numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists scan_usage_logs_user_month_idx on scan_usage_logs (user_id, created_at desc);

create table if not exists billing_subscriptions (
  user_id uuid primary key,
  email text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  plan_tier text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_subscriptions_customer_idx on billing_subscriptions (stripe_customer_id);
create index if not exists billing_subscriptions_plan_idx on billing_subscriptions (plan_tier, status);
