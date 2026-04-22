-- Optional: the app stores likertReverse / riasecKey in questions.options JSONB so seed works
-- without this migration. Apply these columns only if you want first-class DB fields.
alter table public.questions add column if not exists likert_reverse boolean not null default false;
alter table public.questions add column if not exists riasec_key text;
