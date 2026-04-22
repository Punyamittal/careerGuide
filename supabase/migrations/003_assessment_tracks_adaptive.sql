-- Four product assessments + adaptive flow metadata (external_code, flow_rules, assessment_keys)

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
