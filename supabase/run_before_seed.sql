-- ============================================================================
-- Run this in Supabase → SQL Editor if `node scripts/seed.mjs` fails with:
--   "Could not find the 'assessment_keys' column" (or external_code / flow_rules)
-- ============================================================================

alter table public.test_attempts
  add column if not exists assessment_key text not null default 'career_g11';

alter table public.test_attempts
  add column if not exists session_state jsonb not null default '{}'::jsonb;

alter table public.test_attempts
  drop constraint if exists test_attempts_assessment_key_check;

alter table public.test_attempts
  add constraint test_attempts_assessment_key_check
  check (assessment_key in ('early_g5', 'middle_g8', 'stream_g910', 'career_g11'));

alter table public.questions
  add column if not exists external_code text;

create unique index if not exists questions_external_code_uidx
  on public.questions (external_code)
  where external_code is not null;

alter table public.questions
  add column if not exists flow_rules jsonb not null default '{}'::jsonb;

alter table public.questions
  add column if not exists assessment_keys text[] not null default array['career_g11']::text[];

create index if not exists questions_assessment_keys_idx on public.questions using gin (assessment_keys);

alter table public.test_attempts
  add column if not exists intake_profile jsonb not null default '{}'::jsonb;

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  game_type text not null check (game_type in ('iq', 'physiology')),
  event_kind text not null check (event_kind in ('action', 'session')),
  success boolean,
  score numeric(6,2),
  accuracy numeric(6,4),
  errors integer,
  duration_seconds integer,
  level integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists game_events_user_created_idx
  on public.game_events(user_id, created_at desc);
