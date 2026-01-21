-- 1. Create projects table if not exists (in case it wasn't created yet)
-- Ensuring public.projects matches expected structure
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

-- 2. Add project_id to queues if not exists
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'queues' and column_name = 'project_id') then
    alter table public.queues add column project_id uuid references public.projects(id) on delete cascade;
  end if;
end $$;

-- 3. Add project_id to usage_ledger if not exists
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'usage_ledger' and column_name = 'project_id') then
    alter table public.usage_ledger add column project_id uuid references public.projects(id) on delete set null;
  end if;
end $$;

-- 4. Enable RLS on usage_ledger for project access (optional, if we want project members to view usage)
-- Currently only owner can view, which is covered by user_id check.
