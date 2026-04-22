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

create index if not exists game_events_user_kind_idx
  on public.game_events(user_id, event_kind);

create index if not exists game_events_user_type_idx
  on public.game_events(user_id, game_type);
