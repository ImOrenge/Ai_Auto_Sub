-- Migration: Add Projects Table & Relationships

-- 1. Create PROJECTS table
create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    is_archived boolean default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Index for user_id on projects
create index if not exists idx_projects_user_id on public.projects(user_id);

-- Trigger for projects updated_at
create trigger trg_projects_updated_at
before update on public.projects
for each row execute procedure public.set_assets_updated_at(); -- Using existing function

-- RLS for projects
alter table public.projects enable row level security;

do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'Users can view own projects') then
    create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'Users can insert own projects') then
    create policy "Users can insert own projects" on public.projects for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'Users can update own projects') then
    create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'projects' and policyname = 'Users can delete own projects') then
    create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);
  end if;
end $$;


-- 2. Add project_id to ASSETS
alter table public.assets
    add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists idx_assets_project_id on public.assets(project_id);


-- 3. Add project_id to QUEUES
alter table public.queues
    add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists idx_queues_project_id on public.queues(project_id);


-- 4. Add project_id to JOBS
-- (Use for easier filtering by project without joining queues/assets every time)
alter table public.jobs
    add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists idx_jobs_project_id on public.jobs(project_id);


-- 5. RLS Updates (Optional/Strictness)
-- You might want to enforce project ownership in policies, but user_id check is usually sufficient for now.
