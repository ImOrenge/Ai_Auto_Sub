-- Phase 1 schema for ai-sub-auto
-- Ensures jobs metadata and results storage alignment between Supabase and Next.js.

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_kind text not null default 'remote',
  target_locale text not null,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  current_step text not null default 'ingest',
  progress integer not null default 0 check (progress between 0 and 100),
  error_message text,
  payload jsonb,
  storage_path text,
  result_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.jobs is 'Tracks audio ingestion, STT, translation, and delivery stages.';
comment on column public.jobs.source_kind is 'remote, upload, or replay';
comment on column public.jobs.payload is 'ad-hoc options passed from the UI';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_updated_at_idx on public.jobs (updated_at desc);

alter table public.jobs enable row level security;

drop policy if exists "service role manages jobs" on public.jobs;
create policy "service role manages jobs"
on public.jobs
for all
to service_role
using (true)
with check (true);

drop policy if exists "read jobs for dashboards" on public.jobs;
create policy "read jobs for dashboards"
on public.jobs
for select
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('results', 'results', true)
on conflict (id) do nothing;

drop policy if exists "authenticated can read results" on storage.objects;
create policy "authenticated can read results"
on storage.objects
for select
to authenticated
using (bucket_id = 'results');

drop policy if exists "service role can manage results" on storage.objects;
create policy "service role can manage results"
on storage.objects
for all
to service_role
using (bucket_id = 'results')
with check (bucket_id = 'results');

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "authenticated can read uploads" on storage.objects;
create policy "authenticated can read uploads"
on storage.objects
for select
to authenticated
using (bucket_id = 'uploads');

drop policy if exists "service role can manage uploads" on storage.objects;
create policy "service role can manage uploads"
on storage.objects
for all
to service_role
using (bucket_id = 'uploads')
with check (bucket_id = 'uploads');
