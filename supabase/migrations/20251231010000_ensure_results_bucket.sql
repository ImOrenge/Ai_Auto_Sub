-- Ensure results bucket exists
insert into storage.buckets (id, name, public)
values ('results', 'results', true)
on conflict (id) do nothing;

-- Ensure RLS policies for results bucket
drop policy if exists "results_public_read" on storage.objects;
create policy "results_public_read"
on storage.objects for select
using (bucket_id = 'results');

drop policy if exists "results_service_role_manage" on storage.objects;
create policy "results_service_role_manage"
on storage.objects for all
to service_role
using (bucket_id = 'results')
with check (bucket_id = 'results');
