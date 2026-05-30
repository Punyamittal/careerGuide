-- Assessment engine + MBS occupation taxonomy (additive)
-- Apply after 012_life_journey.sql

-- ---------------------------------------------------------------------------
-- MBS domains (18 career domains from MBS_Master_Table.xlsx)
-- ---------------------------------------------------------------------------
create table if not exists public.mbs_domains (
  id text primary key,
  code text not null unique,
  label text not null,
  career_group text not null,
  career_domain text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.mbs_domains is 'MBS-01 … MBS-20 occupation taxonomy (student-facing career domains).';

-- ---------------------------------------------------------------------------
-- O*NET SOC → MBS classification (from MBS_Master_Table.xlsx)
-- ---------------------------------------------------------------------------
create table if not exists public.onet_mbs_classifications (
  soc_code text primary key,
  mbs_domain_id text not null references public.mbs_domains (id) on delete restrict,
  career_group text not null,
  career_domain text not null,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  highlights jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onet_mbs_classifications_domain_idx
  on public.onet_mbs_classifications (mbs_domain_id);

create index if not exists onet_mbs_classifications_group_idx
  on public.onet_mbs_classifications (career_group);

-- ---------------------------------------------------------------------------
-- Assessment module registry (39 product modules)
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_modules (
  id text primary key,
  product_code text not null unique,
  title text not null,
  description text,
  engine_type text not null check (
    engine_type in (
      'likert',
      'branching',
      'reaction_time',
      'tracing',
      'drag_drop',
      'node_graph'
    )
  ),
  toolkit_ref text,
  construct_tags text[] not null default '{}',
  mbs_domain_hints text[] not null default '{}',
  difficulty_tier text not null default 'beginner'
    check (difficulty_tier in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes smallint not null default 5,
  status text not null default 'draft'
    check (status in ('draft', 'beta', 'live', 'deprecated')),
  config jsonb not null default '{}'::jsonb,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_modules_status_idx
  on public.assessment_modules (status, sort_order);

-- ---------------------------------------------------------------------------
-- Assessment sessions
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null references public.assessment_modules (id) on delete restrict,
  track_id text,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'aborted')),
  difficulty_level smallint not null default 1,
  items_total smallint,
  items_completed smallint not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  client_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_sessions_user_started_idx
  on public.assessment_sessions (user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- Telemetry (high-volume event stream)
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_telemetry_events (
  id bigserial primary key,
  session_id uuid not null references public.assessment_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null,
  item_id text,
  event_type text not null,
  stimulus_id text,
  response_value jsonb,
  response_correct boolean,
  response_time_ms integer,
  attempt_index smallint not null default 1,
  difficulty_level smallint,
  engine_type text,
  metadata jsonb not null default '{}'::jsonb,
  client_seq bigint,
  recorded_at timestamptz not null default now()
);

create index if not exists assessment_telemetry_session_seq_idx
  on public.assessment_telemetry_events (session_id, client_seq);

create index if not exists assessment_telemetry_user_recorded_idx
  on public.assessment_telemetry_events (user_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Module scores (aggregated per session)
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_module_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null,
  scoring_provider text not null default 'rule',
  construct_scores jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  accuracy numeric(6, 4),
  mean_response_time_ms integer,
  difficulty_reached smallint,
  created_at timestamptz not null default now(),
  unique (session_id)
);

-- ---------------------------------------------------------------------------
-- Adaptive router state (snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_adaptive_state (
  session_id uuid primary key references public.assessment_sessions (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Learner MBS profile (rolled up for recommendations)
-- ---------------------------------------------------------------------------
create table if not exists public.learner_mbs_profile (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  construct_scores jsonb not null default '{}'::jsonb,
  domain_affinities jsonb not null default '{}'::jsonb,
  signal_contributions jsonb not null default '{}'::jsonb,
  source_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mbs_domains enable row level security;
alter table public.onet_mbs_classifications enable row level security;
alter table public.assessment_modules enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_telemetry_events enable row level security;
alter table public.assessment_module_scores enable row level security;
alter table public.assessment_adaptive_state enable row level security;
alter table public.learner_mbs_profile enable row level security;
