create table if not exists public.media_cache (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  hash text not null,
  storage_key text not null,
  mime_type text,
  duration_ms integer,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_cache_kind_hash_idx
  on public.media_cache (kind, hash);
