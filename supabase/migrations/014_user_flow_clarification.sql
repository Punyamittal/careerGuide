-- User Flow 6 Phase 7.5 clarification (Supabase PostgreSQL)
-- Apply after 013_assessment_engine_mbs.sql
-- Reuses profiles(id) and optionally links block phases to assessment_sessions.

-- ---------------------------------------------------------------------------
-- user_flow_sessions — multi-phase orchestrator (phases 0 → 7.5 → 8)
-- ---------------------------------------------------------------------------
create table if not exists public.user_flow_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  flow_id text not null default 'user-6'
    check (flow_id in ('user-6', 'user-6-pilot')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'clarification', 'completed', 'aborted')),
  current_phase text not null default '0'
    check (current_phase in ('0', '1', '2', '3', '4', '5', '6', '7', '7.5', '8')),
  phase_progress jsonb not null default '{}'::jsonb,
  construct_snapshot jsonb not null default '{}'::jsonb,
  validity_flags jsonb not null default '{}'::jsonb,
  telemetry jsonb not null default '{}'::jsonb,
  accommodation jsonb not null default '{}'::jsonb,
  intake_meta jsonb not null default '{}'::jsonb,
  block_sessions jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_flow_sessions_user_flow_status_idx
  on public.user_flow_sessions (user_id, flow_id, status);

create index if not exists user_flow_sessions_user_created_idx
  on public.user_flow_sessions (user_id, created_at desc);

create index if not exists user_flow_sessions_flow_phase_idx
  on public.user_flow_sessions (flow_id, current_phase);

-- ---------------------------------------------------------------------------
-- user_flow_block_sessions — optional bridge to assessment_sessions (phases 0–7)
-- ---------------------------------------------------------------------------
create table if not exists public.user_flow_block_sessions (
  id uuid primary key default gen_random_uuid(),
  flow_session_id uuid not null references public.user_flow_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  phase text not null,
  block_key text not null,
  assessment_session_id uuid references public.assessment_sessions (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (flow_session_id, phase, block_key)
);

create index if not exists user_flow_block_sessions_flow_idx
  on public.user_flow_block_sessions (flow_session_id);

-- ---------------------------------------------------------------------------
-- clarification_sessions — 1:1 with flow when Phase 7.5 active
-- ---------------------------------------------------------------------------
create table if not exists public.clarification_sessions (
  id uuid primary key default gen_random_uuid(),
  flow_session_id uuid not null unique references public.user_flow_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'evaluating'
    check (status in ('evaluating', 'in_progress', 'finalized', 'skipped')),
  fired_rules text[] not null default '{}',
  assigned_journeys text[] not null default '{}',
  max_journeys smallint not null default 2 check (max_journeys >= 0 and max_journeys <= 3),
  current_journey_index smallint not null default 0 check (current_journey_index >= 0),
  journey_progress jsonb not null default '{}'::jsonb,
  assigned_journey_meta jsonb not null default '[]'::jsonb,
  accommodation_snapshot jsonb not null default '{}'::jsonb,
  fusion_result jsonb,
  blocked_constructs text[] not null default '{}',
  evaluated_at timestamptz,
  finalized_at timestamptz,
  schema_version smallint not null default 2 check (schema_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clarification_sessions_user_status_idx
  on public.clarification_sessions (user_id, status);

create index if not exists clarification_sessions_user_created_idx
  on public.clarification_sessions (user_id, created_at desc);

create index if not exists clarification_sessions_fired_rules_idx
  on public.clarification_sessions using gin (fired_rules);

-- ---------------------------------------------------------------------------
-- clarification_responses — per-item answers
-- ---------------------------------------------------------------------------
create table if not exists public.clarification_responses (
  id uuid primary key default gen_random_uuid(),
  clarification_session_id uuid not null references public.clarification_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  journey_id text not null,
  item_id text not null check (item_id ~ '^CLAR-'),
  item_version smallint not null default 2 check (item_version >= 1),
  question_type text not null default 'unknown'
    check (question_type in ('sjt', 'forced-choice', 'ranking', 'micro-CAT', 'likert', 'unknown')),
  response_value jsonb not null default '{}'::jsonb,
  response_correct boolean,
  partial_score numeric(6, 4) check (partial_score is null or (partial_score >= 0 and partial_score <= 1)),
  response_time_ms integer check (response_time_ms is null or response_time_ms >= 0),
  answer_change_count integer not null default 0 check (answer_change_count >= 0),
  scoring_rubric text,
  client_seq bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clarification_session_id, journey_id, item_id)
);

create index if not exists clarification_responses_user_item_idx
  on public.clarification_responses (user_id, item_id);

create index if not exists clarification_responses_session_timeline_idx
  on public.clarification_responses (clarification_session_id, created_at);

-- ---------------------------------------------------------------------------
-- clarification_sim_results — simulation telemetry + scores
-- ---------------------------------------------------------------------------
create table if not exists public.clarification_sim_results (
  id uuid primary key default gen_random_uuid(),
  clarification_session_id uuid not null references public.clarification_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  journey_id text not null,
  sim_id text not null check (sim_id ~ '^SIM-'),
  telemetry jsonb not null default '{}'::jsonb,
  composite_score numeric(6, 4) check (composite_score is null or (composite_score >= 0 and composite_score <= 1)),
  dimension_scores jsonb not null default '{}'::jsonb,
  success boolean,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  negotiation_band text check (negotiation_band is null or negotiation_band in ('developing', 'capable', 'strong')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clarification_session_id, sim_id)
);

create index if not exists clarification_sim_results_user_sim_idx
  on public.clarification_sim_results (user_id, sim_id);

create index if not exists clarification_sim_results_journey_idx
  on public.clarification_sim_results (journey_id);

-- ---------------------------------------------------------------------------
-- clarification_item_exposure — U16 pool rotation counter
-- ---------------------------------------------------------------------------
create table if not exists public.clarification_item_exposure (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null check (item_id ~ '^CLAR-'),
  exposure_count integer not null default 0 check (exposure_count >= 0 and exposure_count <= 20),
  last_exposed_at timestamptz not null default now(),
  stem_hash text,
  journey_id text,
  pool_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists clarification_item_exposure_user_count_idx
  on public.clarification_item_exposure (user_id, exposure_count);

create index if not exists clarification_item_exposure_stem_hash_idx
  on public.clarification_item_exposure (stem_hash)
  where stem_hash is not null;

-- ---------------------------------------------------------------------------
-- Extend learner_mbs_profile for post-clarification rollup (minimal columns)
-- ---------------------------------------------------------------------------
alter table public.learner_mbs_profile
  add column if not exists validity_band text
    check (validity_band is null or validity_band in ('high', 'interpret_with_caution'));

alter table public.learner_mbs_profile
  add column if not exists clarification_summary jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_flow_sessions_updated_at on public.user_flow_sessions;
create trigger user_flow_sessions_updated_at
  before update on public.user_flow_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists clarification_sessions_updated_at on public.clarification_sessions;
create trigger clarification_sessions_updated_at
  before update on public.clarification_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists clarification_responses_updated_at on public.clarification_responses;
create trigger clarification_responses_updated_at
  before update on public.clarification_responses
  for each row execute function public.set_updated_at();

drop trigger if exists clarification_sim_results_updated_at on public.clarification_sim_results;
create trigger clarification_sim_results_updated_at
  before update on public.clarification_sim_results
  for each row execute function public.set_updated_at();

drop trigger if exists clarification_item_exposure_updated_at on public.clarification_item_exposure;
create trigger clarification_item_exposure_updated_at
  before update on public.clarification_item_exposure
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (direct client access; service role bypasses RLS)
-- ---------------------------------------------------------------------------
alter table public.user_flow_sessions enable row level security;
alter table public.user_flow_block_sessions enable row level security;
alter table public.clarification_sessions enable row level security;
alter table public.clarification_responses enable row level security;
alter table public.clarification_sim_results enable row level security;
alter table public.clarification_item_exposure enable row level security;

-- user_flow_sessions
create policy user_flow_sessions_select_own on public.user_flow_sessions
  for select using (auth.uid() = user_id);
create policy user_flow_sessions_insert_own on public.user_flow_sessions
  for insert with check (auth.uid() = user_id);
create policy user_flow_sessions_update_own on public.user_flow_sessions
  for update using (auth.uid() = user_id);

-- user_flow_block_sessions
create policy user_flow_block_sessions_select_own on public.user_flow_block_sessions
  for select using (auth.uid() = user_id);
create policy user_flow_block_sessions_insert_own on public.user_flow_block_sessions
  for insert with check (auth.uid() = user_id);
create policy user_flow_block_sessions_update_own on public.user_flow_block_sessions
  for update using (auth.uid() = user_id);

-- clarification_sessions
create policy clarification_sessions_select_own on public.clarification_sessions
  for select using (auth.uid() = user_id);
create policy clarification_sessions_insert_own on public.clarification_sessions
  for insert with check (auth.uid() = user_id);
create policy clarification_sessions_update_own on public.clarification_sessions
  for update using (auth.uid() = user_id);

-- clarification_responses
create policy clarification_responses_select_own on public.clarification_responses
  for select using (auth.uid() = user_id);
create policy clarification_responses_insert_own on public.clarification_responses
  for insert with check (auth.uid() = user_id);
create policy clarification_responses_update_own on public.clarification_responses
  for update using (auth.uid() = user_id);

-- clarification_sim_results
create policy clarification_sim_results_select_own on public.clarification_sim_results
  for select using (auth.uid() = user_id);
create policy clarification_sim_results_insert_own on public.clarification_sim_results
  for insert with check (auth.uid() = user_id);
create policy clarification_sim_results_update_own on public.clarification_sim_results
  for update using (auth.uid() = user_id);

-- clarification_item_exposure
create policy clarification_item_exposure_select_own on public.clarification_item_exposure
  for select using (auth.uid() = user_id);
create policy clarification_item_exposure_insert_own on public.clarification_item_exposure
  for insert with check (auth.uid() = user_id);
create policy clarification_item_exposure_update_own on public.clarification_item_exposure
  for update using (auth.uid() = user_id);

comment on table public.user_flow_sessions is 'User Flow 6 orchestrator — phases 0 through 8 including Phase 7.5 clarification gate.';
comment on table public.clarification_sessions is 'Phase 7.5 ambiguity resolution session (U1–U17 rules, journey routing, fusion).';
comment on table public.clarification_responses is 'Clarification item responses with partial scores.';
comment on table public.clarification_sim_results is 'Clarification simulation completions (NEG V2, Format Lab, etc.).';
comment on table public.clarification_item_exposure is 'Per-user item exposure counter for U16 pool rotation.';
