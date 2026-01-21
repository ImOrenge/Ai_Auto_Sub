-- Migration aligned with prompts/master-plane.md data model.
-- Recreates the `jobs` table with the documented columns and trigger.

create extension if not exists "pgcrypto";

drop trigger if exists trg_jobs_updated_at on public.jobs;
drop function if exists public.set_jobs_updated_at();
drop table if exists public.jobs cascade;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  url text not null,
  status text not null default 'pending' check (
    status in ('pending', 'downloading', 'processing', 'stt', 'translating', 'subtitle', 'done', 'error')
  ),
  step text,
  progress numeric(5,4) not null default 0 check (progress >= 0 and progress <= 1),
  result_srt_url text,
  result_video_url text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.jobs is 'Tracks URL ingestion, STT, translation, and SRT delivery jobs.';
comment on column public.jobs.user_id is 'Optional user reference for future auth integration.';

create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_step on public.jobs(step);
create index if not exists idx_jobs_created_at on public.jobs(created_at);

create or replace function public.set_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger trg_jobs_updated_at
before update on public.jobs
for each row execute procedure public.set_jobs_updated_at();
