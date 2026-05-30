-- Phase upgrade foundations for explainability + institutional analytics + iterative tracking.

create table if not exists public.user_profile_vectors (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  cognitive_score numeric(5,2) not null default 0,
  personality_traits jsonb not null default '{}'::jsonb,
  skill_scores jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,2) not null default 0,
  last_updated timestamptz not null default now()
);

create table if not exists public.report_explanations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  factor text not null,
  weight numeric(5,2) not null default 0,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists report_explanations_report_id_idx on public.report_explanations (report_id);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_users (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'student' check (role in ('admin', 'counsellor', 'teacher', 'student')),
  created_at timestamptz not null default now(),
  unique (institution_id, user_id)
);
create index if not exists institution_users_user_id_idx on public.institution_users (user_id);

create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.student_group_members (
  group_id uuid not null references public.student_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('coding', 'logic', 'domain')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  career_tag text not null,
  prompt text not null,
  rubric jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists tasks_career_tag_idx on public.tasks (career_tag);

create table if not exists public.task_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  score numeric(5,2) not null default 0,
  time_taken int not null default 0,
  attempts int not null default 1,
  solution_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists task_attempts_user_created_idx on public.task_attempts (user_id, created_at desc);

create table if not exists public.game_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  metric_type text not null,
  value numeric(10,3) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists game_metrics_user_game_idx on public.game_metrics (user_id, game_id, created_at desc);

create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  metric text not null,
  previous_value numeric(10,3),
  new_value numeric(10,3),
  created_at timestamptz not null default now()
);
create index if not exists progress_logs_user_created_idx on public.progress_logs (user_id, created_at desc);

alter table public.user_profile_vectors enable row level security;
alter table public.report_explanations enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_users enable row level security;
alter table public.student_groups enable row level security;
alter table public.student_group_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_attempts enable row level security;
alter table public.game_metrics enable row level security;
alter table public.progress_logs enable row level security;
