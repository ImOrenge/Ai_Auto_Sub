-- Add RLS policies for authenticated uploads to the 'uploads' bucket
-- Supports:
-- 1. Standard Uploads: {userId}/{filename}
-- 2. Thumbnails: thumbnails/{userId}/{filename}

-- Policy for INSERT
create policy "authenticated can insert uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads' and
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' and (storage.foldername(name))[2] = auth.uid()::text )
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
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' and (storage.foldername(name))[2] = auth.uid()::text )
  )
);

-- Policy for SELECT (View/Download)
create policy "authenticated can select uploads"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'uploads' and
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' and (storage.foldername(name))[2] = auth.uid()::text )
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
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' and (storage.foldername(name))[2] = auth.uid()::text )
  )
);
