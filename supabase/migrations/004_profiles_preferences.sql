-- App preferences synced from Settings (email digest opt-in, UI toggles)
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.preferences is 'User settings: emailDigest, compactSidebarHints, etc.';
