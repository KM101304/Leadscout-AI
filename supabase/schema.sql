create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  location text not null,
  niche text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references searches(id) on delete cascade,
  business_name text not null,
  phone text,
  website text,
  address text,
  lead_score integer not null default 0,
  opportunity_type text,
  notes text,
  status text not null default 'new'
);

create table if not exists lead_issues (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  issue_type text not null
);
