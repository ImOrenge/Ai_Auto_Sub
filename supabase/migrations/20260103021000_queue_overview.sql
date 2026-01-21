-- Queue overview for all queues (draft + execution flow counts)

create or replace view public.queue_overview
with (security_invoker = on)
as
select
  q.id as queue_id,
  q.project_id,
  q.user_id,
  q.name,
  q.created_at as queue_created_at,
  q.updated_at as queue_updated_at,
  count(j.id) filter (where j.status = 'draft') as draft_count,
  count(j.id) filter (
    where j.status in (
      'queued',
      'running',
      'uploading',
      'preprocessing',
      'downloading',
      'processing',
      'stt',
      'translating',
      'subtitle',
      'compositing',
      'exporting'
    )
  ) as in_progress_count,
  count(j.id) filter (
    where j.status in ('awaiting_edit', 'editing', 'ready_to_export')
  ) as awaiting_edit_count,
  count(j.id) filter (where j.status in ('done', 'succeeded')) as done_count,
  count(j.id) filter (where j.status in ('error', 'failed', 'canceled')) as error_count,
  max(j.created_at) as last_job_at
from public.queues q
left join public.jobs j on j.queue_id = q.id
group by q.id;
