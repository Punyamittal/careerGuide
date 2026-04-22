-- CareerGuide: Supabase schema (run in Supabase SQL Editor or via CLI)
-- Requires: auth.users (managed by Supabase Auth)

create extension if not exists "pgcrypto";

-- Profiles mirror auth users for app role + display fields
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    'student'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists profiles_email_idx on public.profiles (email);

-- Questions bank
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  stem text not null,
  big_five_key text,
  use_likert boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_category_sort_idx on public.questions (category, sort_order);

-- Test attempts
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'scored')),
  responses jsonb not null default '[]'::jsonb,
  scores jsonb,
  profile_vector jsonb,
  career_matches jsonb,
  submitted_at timestamptz,
  scored_at timestamptz,
  writing_evaluation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_attempts_user_created_idx on public.test_attempts (user_id, created_at desc);

-- Career patterns for matching
create table if not exists public.career_patterns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  vector jsonb not null,
  required_skills jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempt_id uuid not null references public.test_attempts (id) on delete cascade,
  structured_summary jsonb not null,
  ai_narrative text,
  skill_gaps jsonb not null default '[]'::jsonb,
  top_careers jsonb not null default '[]'::jsonb,
  writing_evaluation jsonb,
  ai_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id)
);

create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.career_patterns enable row level security;
alter table public.reports enable row level security;

-- API uses service role from Express; direct browser access can be locked down.
-- Add policies later if you query from the client with the anon key + user JWT.
