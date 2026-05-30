-- O*NET occupational intelligence foundation (additive, deployment-safe).
-- Apply after 009. Does not modify existing assessment tables.

create extension if not exists pg_trgm;

-- Future pgvector: run 011_onet_pgvector.sql when enabling semantic search.
-- Embeddings stored as jsonb until then (see onet_occupation_embeddings).

create table if not exists public.onet_releases (
  id uuid primary key default gen_random_uuid(),
  version_label text not null,
  source_date date,
  imported_at timestamptz not null default now(),
  is_active boolean not null default false,
  row_counts jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  constraint onet_releases_version_label_unique unique (version_label)
);

create index if not exists onet_releases_active_idx
  on public.onet_releases (is_active)
  where is_active = true;

create table if not exists public.onet_occupations (
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  title text not null,
  description text,
  job_zone smallint check (job_zone is null or job_zone between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (release_id, soc_code)
);

create index if not exists onet_occupations_title_trgm_idx
  on public.onet_occupations using gin (title gin_trgm_ops);

create index if not exists onet_occupations_title_fts_idx
  on public.onet_occupations using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

create table if not exists public.onet_alternate_titles (
  id bigserial primary key,
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  title text not null,
  short_title text,
  source_type text,
  created_at timestamptz not null default now(),
  foreign key (release_id, soc_code) references public.onet_occupations (release_id, soc_code) on delete cascade
);

create index if not exists onet_alternate_titles_release_soc_idx
  on public.onet_alternate_titles (release_id, soc_code);

create index if not exists onet_alternate_titles_title_trgm_idx
  on public.onet_alternate_titles using gin (title gin_trgm_ops);

create index if not exists onet_alternate_titles_title_fts_idx
  on public.onet_alternate_titles using gin (to_tsvector('english', coalesce(title, '')));

create table if not exists public.onet_elements (
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  element_id text not null,
  element_name text not null,
  domain text not null,
  description text,
  created_at timestamptz not null default now(),
  primary key (release_id, element_id)
);

create index if not exists onet_elements_domain_idx
  on public.onet_elements (release_id, domain);

create table if not exists public.onet_occupation_ratings (
  id bigserial primary key,
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  element_id text not null,
  element_name text,
  scale_id text not null,
  scale_name text,
  data_value numeric(12, 6) not null,
  domain_source text,
  created_at timestamptz not null default now(),
  foreign key (release_id, soc_code) references public.onet_occupations (release_id, soc_code) on delete cascade,
  foreign key (release_id, element_id) references public.onet_elements (release_id, element_id) on delete cascade,
  constraint onet_occupation_ratings_unique unique (release_id, soc_code, element_id, scale_id)
);

create index if not exists onet_occupation_ratings_soc_idx
  on public.onet_occupation_ratings (release_id, soc_code);

create index if not exists onet_occupation_ratings_element_scale_idx
  on public.onet_occupation_ratings (release_id, element_id, scale_id);

create index if not exists onet_occupation_ratings_scale_soc_idx
  on public.onet_occupation_ratings (release_id, scale_id, soc_code);

create table if not exists public.onet_related_occupations (
  id bigserial primary key,
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  related_soc_code text not null,
  related_title text,
  relatedness_tier text,
  match_index smallint,
  created_at timestamptz not null default now(),
  foreign key (release_id, soc_code) references public.onet_occupations (release_id, soc_code) on delete cascade,
  constraint onet_related_unique unique (release_id, soc_code, related_soc_code)
);

create index if not exists onet_related_soc_idx
  on public.onet_related_occupations (release_id, soc_code, match_index);

create table if not exists public.onet_technology_skills (
  id bigserial primary key,
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  example text not null,
  commodity_code bigint,
  commodity_title text,
  hot_technology boolean not null default false,
  in_demand boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (release_id, soc_code) references public.onet_occupations (release_id, soc_code) on delete cascade
);

create index if not exists onet_technology_skills_soc_idx
  on public.onet_technology_skills (release_id, soc_code);

create table if not exists public.onet_occupation_vectors (
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  vector_type text not null check (vector_type in ('riasec', 'profile_v1')),
  vector jsonb not null,
  created_at timestamptz not null default now(),
  primary key (release_id, soc_code, vector_type),
  foreign key (release_id, soc_code) references public.onet_occupations (release_id, soc_code) on delete cascade
);

create index if not exists onet_occupation_vectors_type_idx
  on public.onet_occupation_vectors (release_id, vector_type);

-- Snapshot of occupation matches per assessment attempt (bounded rows; explainability payload).
create table if not exists public.attempt_occupation_matches (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts (id) on delete cascade,
  release_id uuid not null references public.onet_releases (id) on delete restrict,
  soc_code text not null,
  occupation_title text,
  rank int not null check (rank > 0),
  match_score numeric(5, 2) not null,
  confidence_score numeric(5, 2),
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint attempt_occupation_matches_unique unique (attempt_id, soc_code)
);

create index if not exists attempt_occupation_matches_attempt_rank_idx
  on public.attempt_occupation_matches (attempt_id, rank);

create index if not exists attempt_occupation_matches_release_soc_idx
  on public.attempt_occupation_matches (release_id, soc_code);

-- Future semantic search (jsonb now; migrate column to vector(1536) in 011).
create table if not exists public.onet_occupation_embeddings (
  release_id uuid not null references public.onet_releases (id) on delete cascade,
  soc_code text not null,
  model_version text not null,
  embedding jsonb,
  created_at timestamptz not null default now(),
  primary key (release_id, soc_code, model_version),
  foreign key (release_id, soc_code) references public.onet_occupations (release_id, soc_code) on delete cascade
);

-- Only one active release at a time.
create or replace function public.onet_set_active_release(p_release_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.onet_releases where id = p_release_id) then
    raise exception 'Release % not found', p_release_id;
  end if;
  update public.onet_releases set is_active = false where is_active = true;
  update public.onet_releases set is_active = true where id = p_release_id;
end;
$$;

alter table public.onet_releases enable row level security;
alter table public.onet_occupations enable row level security;
alter table public.onet_alternate_titles enable row level security;
alter table public.onet_elements enable row level security;
alter table public.onet_occupation_ratings enable row level security;
alter table public.onet_related_occupations enable row level security;
alter table public.onet_technology_skills enable row level security;
alter table public.onet_occupation_vectors enable row level security;
alter table public.attempt_occupation_matches enable row level security;
alter table public.onet_occupation_embeddings enable row level security;

-- API uses service role; policies can be added for read-only anon catalog later.
