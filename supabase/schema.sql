create extension if not exists pgcrypto;

create table if not exists scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  plan_tier text not null default 'free',
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
  leads_json jsonb not null default '[]'::jsonb,
  map_markers_json jsonb not null default '[]'::jsonb,
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
  lead_id text not null,
  primary key (scan_session_id, lead_id)
);

create table if not exists scan_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  mode text not null check (mode in ('indexed', 'live', 'demo')),
  tier text not null,
  query_key text not null,
  estimated_cost_usd numeric not null default 0,
  lead_count integer not null default 0,
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

create table if not exists saved_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id text not null references indexed_leads(id) on delete cascade,
  notes text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lead_id)
);

create index if not exists saved_leads_user_idx on saved_leads (user_id, updated_at desc);

create table if not exists export_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scan_session_id uuid references scan_sessions(id) on delete cascade,
  name text not null,
  export_type text not null default 'csv',
  lead_count integer not null default 0,
  lead_ids jsonb not null default '[]'::jsonb,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create index if not exists export_history_user_idx on export_history (user_id, created_at desc);

create table if not exists app_event_logs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  level text not null,
  message text not null,
  user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_event_logs_scope_idx on app_event_logs (scope, created_at desc);

alter table if exists scan_sessions add column if not exists plan_tier text not null default 'free';
alter table if exists scan_usage_logs add column if not exists lead_count integer not null default 0;
alter table if exists export_history add column if not exists lead_ids jsonb not null default '[]'::jsonb;

do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join pg_attribute a on a.attrelid = t.oid and a.attnum = any (c.conkey)
  where n.nspname = 'public'
    and t.relname = 'scan_sessions'
    and c.contype = 'f'
    and a.attname = 'user_id'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.scan_sessions drop constraint %I', constraint_name);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_sessions_user_id_fkey'
  ) then
    alter table public.scan_sessions
      add constraint scan_sessions_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;

do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join pg_attribute a on a.attrelid = t.oid and a.attnum = any (c.conkey)
  where n.nspname = 'public'
    and t.relname = 'scan_usage_logs'
    and c.contype = 'f'
    and a.attname = 'user_id'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.scan_usage_logs drop constraint %I', constraint_name);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_usage_logs_user_id_fkey'
  ) then
    alter table public.scan_usage_logs
      add constraint scan_usage_logs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'billing_subscriptions_user_id_fkey'
  ) then
    alter table public.billing_subscriptions
      add constraint billing_subscriptions_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_leads_user_id_fkey'
  ) then
    alter table public.saved_leads
      add constraint saved_leads_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'export_history_user_id_fkey'
  ) then
    alter table public.export_history
      add constraint export_history_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_event_logs_user_id_fkey'
  ) then
    alter table public.app_event_logs
      add constraint app_event_logs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;
