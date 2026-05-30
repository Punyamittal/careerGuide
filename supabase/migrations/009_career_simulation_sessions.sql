create table if not exists public.career_simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_slug text not null,
  role_title text not null,
  tone text not null check (tone in ('confident', 'balanced', 'cautious')),
  completion_score numeric(5,2) not null default 0,
  choices jsonb not null default '{}'::jsonb,
  scenes_completed integer not null default 0,
  total_scenes integer not null default 0,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists career_sim_sessions_user_created_idx
  on public.career_simulation_sessions (user_id, created_at desc);

alter table public.career_simulation_sessions enable row level security;
