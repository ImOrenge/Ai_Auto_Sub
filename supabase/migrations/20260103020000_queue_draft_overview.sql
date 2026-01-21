-- Draft queue overview + execution flow helpers (Supabase / Postgres)

-- View: draft queues only, with counts + recency for UI listing
create or replace view public.queue_draft_overview
with (security_invoker = on)
as
select
  q.id as queue_id,
  q.project_id,
  q.user_id,
  q.name,
  q.created_at as queue_created_at,
  q.updated_at as queue_updated_at,
  count(j.id) as draft_count,
  min(j.queue_position) as next_queue_position,
  min(j.created_at) as oldest_draft_at,
  max(j.created_at) as newest_draft_at
from public.queues q
join public.jobs j
  on j.queue_id = q.id
 and j.status = 'draft'
group by q.id;

-- Indexes to speed draft listing and run flow
create index if not exists idx_jobs_queue_draft_position
  on public.jobs(queue_id, queue_position)
  where status = 'draft';

create index if not exists idx_jobs_queue_status
  on public.jobs(queue_id, status);

create index if not exists idx_jobs_queue_status_created_at
  on public.jobs(queue_id, status, created_at);

-- Trigger: keep queue updated_at in sync with job changes
create or replace function public.touch_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.queue_id is not null then
      update public.queues
      set updated_at = timezone('utc', now())
      where id = new.queue_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.queue_id is distinct from old.queue_id then
      if old.queue_id is not null then
        update public.queues
        set updated_at = timezone('utc', now())
        where id = old.queue_id;
      end if;
      if new.queue_id is not null then
        update public.queues
        set updated_at = timezone('utc', now())
        where id = new.queue_id;
      end if;
    elsif new.status is distinct from old.status
      or new.queue_position is distinct from old.queue_position then
      if new.queue_id is not null then
        update public.queues
        set updated_at = timezone('utc', now())
        where id = new.queue_id;
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    if old.queue_id is not null then
      update public.queues
      set updated_at = timezone('utc', now())
      where id = old.queue_id;
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_jobs_touch_queue on public.jobs;
create trigger trg_jobs_touch_queue
after insert or update or delete on public.jobs
for each row execute procedure public.touch_queue_updated_at();

-- Trigger: set started_at / finished_at for execution flow
create or replace function public.set_job_flow_timestamps()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'running' and new.started_at is null then
      new.started_at = timezone('utc', now());
    end if;
    if new.status in ('succeeded', 'failed', 'canceled', 'error', 'done')
      and new.finished_at is null then
      new.finished_at = timezone('utc', now());
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'running' and new.started_at is null then
      new.started_at = timezone('utc', now());
    end if;
    if new.status in ('succeeded', 'failed', 'canceled', 'error', 'done')
      and new.finished_at is null then
      new.finished_at = timezone('utc', now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_jobs_flow_timestamps on public.jobs;
create trigger trg_jobs_flow_timestamps
before insert or update on public.jobs
for each row execute procedure public.set_job_flow_timestamps();
