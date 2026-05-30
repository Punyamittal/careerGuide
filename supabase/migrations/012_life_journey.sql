-- Life Journey narrative intelligence (additive module)

create table if not exists public.life_journey_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  life_stage text not null,
  event_type text not null,
  domain text not null,
  subcategory text not null,
  event_label text not null,
  custom_event boolean not null default false,
  impacts jsonb not null default '[]'::jsonb,
  intensity smallint not null check (intensity between 1 and 5),
  emotions jsonb not null default '[]'::jsonb,
  reflection_lens text not null,
  signal_map jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_journey_events_user_created_idx
  on public.life_journey_events (user_id, created_at desc);

create index if not exists life_journey_events_user_stage_idx
  on public.life_journey_events (user_id, life_stage);

alter table public.life_journey_events enable row level security;
