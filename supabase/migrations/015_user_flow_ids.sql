-- Extend user_flow_sessions.flow_id to all MBS user flows (user-1 … user-6).
-- Apply after 014_user_flow_clarification.sql

alter table public.user_flow_sessions
  drop constraint if exists user_flow_sessions_flow_id_check;

alter table public.user_flow_sessions
  add constraint user_flow_sessions_flow_id_check
  check (
    flow_id in (
      'user-1',
      'user-2',
      'user-3',
      'user-4',
      'user-5',
      'user-6',
      'user-6-pilot'
    )
  );

comment on column public.user_flow_sessions.flow_id is
  'MBS user flow key (user-1 … user-6) or user-6-pilot for clarification pilots.';
