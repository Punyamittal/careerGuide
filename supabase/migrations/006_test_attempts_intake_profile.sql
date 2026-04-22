-- Rich learner context (demographics, preferences, constraints) collected before psychometric items
alter table public.test_attempts
  add column if not exists intake_profile jsonb not null default '{}'::jsonb;

comment on column public.test_attempts.intake_profile is 'Structured intake: age, education, projects text, work/env prefs, support/problems (see API validator).';
