-- Force replace policies for 'uploads' bucket
-- Dropping existing policies to ensure clean state
drop policy if exists "authenticated can insert uploads" on storage.objects;
drop policy if exists "authenticated can update uploads" on storage.objects;
drop policy if exists "authenticated can select uploads" on storage.objects;
drop policy if exists "authenticated can delete uploads" on storage.objects;

-- Policy for INSERT
create policy "authenticated can insert uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads' and
  (
    name like (auth.uid() || '/%') or
    name like ('thumbnails/' || auth.uid() || '/%')
  )
);

-- Policy for UPDATE (Resumable Uploads)
create policy "authenticated can update uploads"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads' and
  (
    name like (auth.uid() || '/%') or
    name like ('thumbnails/' || auth.uid() || '/%')
  )
);

-- Policy for SELECT (View/Download - needed for thumbnail verification etc)
create policy "authenticated can select uploads"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'uploads' and
  (
    name like (auth.uid() || '/%') or
    name like ('thumbnails/' || auth.uid() || '/%')
  )
);

-- Policy for DELETE
create policy "authenticated can delete uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'uploads' and
  (
    name like (auth.uid() || '/%') or
    name like ('thumbnails/' || auth.uid() || '/%')
  )
);
