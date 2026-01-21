-- Migration: Multi-Queue Schema (Assets, Queues, Jobs Update)
-- Aligns with prompts/multijobdesine.md, prompts/dashmordux.md, prompts/draft.md

-- 1. Create ASSETS table
create type public.asset_status as enum ('uploading', 'uploaded', 'failed');

create table if not exists public.assets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    filename text not null,
    storage_key text not null, -- S3/Storage path
    status public.asset_status not null default 'uploading',
    meta jsonb default '{}'::jsonb, -- size, duration, width, height, mime_type
    error_message text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- 2. Create QUEUES table
create table if not exists public.queues (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text default 'Default Queue',
    default_options jsonb default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- 3. Modify JOBS table
-- Add new status values to the constraint if possible, or relax it.
-- Since postgres enums are hard to modify transactionally if used by check constraints, 
-- we will drop the old check constraint and add a new one or convert to text if needed.
-- The existing table has: status text check (status in (...))

alter table public.jobs 
    drop constraint if exists jobs_status_check;

-- Sanitize existing data: invalid statuses -> 'failed'
update public.jobs
set status = 'failed'
where status not in ('draft', 'pending', 'downloading', 'processing', 'stt', 'translating', 'subtitle', 'done', 'error', 'queued', 'running', 'succeeded', 'failed', 'canceled');

alter table public.jobs
    add constraint jobs_status_check check (
        status in ('draft', 'pending', 'downloading', 'processing', 'stt', 'translating', 'subtitle', 'done', 'error', 'queued', 'running', 'succeeded', 'failed', 'canceled')
    );

alter table public.jobs
    add column if not exists asset_id uuid references public.assets(id) on delete set null,
    add column if not exists queue_id uuid references public.queues(id) on delete set null,
    add column if not exists queue_position int default 0,
    add column if not exists options jsonb default '{}'::jsonb,
    add column if not exists started_at timestamptz,
    add column if not exists finished_at timestamptz;

-- 4. Create JOB_OUTPUTS table
create table if not exists public.job_outputs (
    id uuid primary key default gen_random_uuid(),
    job_id uuid references public.jobs(id) on delete cascade not null,
    type text not null, -- 'srt', 'vtt', 'txt', 'json'
    storage_key text not null,
    filename text,
    size_bytes bigint,
    created_at timestamptz not null default timezone('utc', now())
);

-- 5. Indexes and Triggers
create index if not exists idx_assets_user_id on public.assets(user_id);
create index if not exists idx_assets_status on public.assets(status);

create index if not exists idx_queues_user_id on public.queues(user_id);

create index if not exists idx_jobs_asset_id on public.jobs(asset_id);
create index if not exists idx_jobs_queue_id on public.jobs(queue_id);
create index if not exists idx_job_outputs_job_id on public.job_outputs(job_id);

-- Trigger for assets updated_at
create or replace function public.set_assets_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger trg_assets_updated_at
before update on public.assets
for each row execute procedure public.set_assets_updated_at();

-- Trigger for queues updated_at
create or replace function public.set_queues_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger trg_queues_updated_at
before update on public.queues
for each row execute procedure public.set_queues_updated_at();

-- RLS Policies (Basic)
alter table public.assets enable row level security;
alter table public.queues enable row level security;
alter table public.job_outputs enable row level security;

-- Assets Policies
create policy "Users can view own assets" on public.assets
  for select using (auth.uid() = user_id);
create policy "Users can insert own assets" on public.assets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own assets" on public.assets
  for update using (auth.uid() = user_id);
create policy "Users can delete own assets" on public.assets
  for delete using (auth.uid() = user_id);

-- Queues Policies
create policy "Users can view own queues" on public.queues
  for select using (auth.uid() = user_id);
create policy "Users can insert own queues" on public.queues
  for insert with check (auth.uid() = user_id);
create policy "Users can update own queues" on public.queues
  for update using (auth.uid() = user_id);
create policy "Users can delete own queues" on public.queues
  for delete using (auth.uid() = user_id);

-- Job Outputs Policies
create policy "Users can view own job outputs" on public.job_outputs
  for select using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_outputs.job_id
      and jobs.user_id = auth.uid()
    )
  );

-- Fix Jobs Policies (Existing jobs table might need RLS enabled if not already)
alter table public.jobs enable row level security;
-- Ensure policies exist for jobs (assuming they might not, or adding if missing)
drop policy if exists "Users can view own jobs" on public.jobs;
create policy "Users can view own jobs" on public.jobs
    for select using (auth.uid() = user_id);
    
drop policy if exists "Users can insert own jobs" on public.jobs;
create policy "Users can insert own jobs" on public.jobs
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own jobs" on public.jobs;
create policy "Users can update own jobs" on public.jobs
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own jobs" on public.jobs;
create policy "Users can delete own jobs" on public.jobs
    for delete using (auth.uid() = user_id);
