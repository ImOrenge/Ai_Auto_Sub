-- Fix Storage RLS policies to support project-based upload paths
-- Studio uploads to: projects/{projectId}/{timestamp}-{filename}
-- This migration updates the policies to allow this pattern

-- Drop existing restrictive policies
drop policy if exists "authenticated can insert uploads" on storage.objects;
drop policy if exists "authenticated can update uploads" on storage.objects;
drop policy if exists "authenticated can select uploads" on storage.objects;
drop policy if exists "authenticated can delete uploads" on storage.objects;

-- Policy for INSERT - Allow any authenticated user to upload to projects folder
create policy "authenticated can insert uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads' AND
  (
    -- Project-based uploads: projects/{projectId}/{filename}
    (storage.foldername(name))[1] = 'projects' OR
    -- User-based uploads: {userId}/{filename}
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Thumbnails: thumbnails/{userId}/{filename}
    ( (storage.foldername(name))[1] = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text )
  )
);

-- Policy for UPDATE (Resumable Uploads)
create policy "authenticated can update uploads"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads' AND
  (
    (storage.foldername(name))[1] = 'projects' OR
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text )
  )
);

-- Policy for SELECT (View/Download)
create policy "authenticated can select uploads"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'uploads' AND
  (
    (storage.foldername(name))[1] = 'projects' OR
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text )
  )
);

-- Policy for DELETE
create policy "authenticated can delete uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'uploads' AND
  (
    (storage.foldername(name))[1] = 'projects' OR
    (storage.foldername(name))[1] = auth.uid()::text OR
    ( (storage.foldername(name))[1] = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text )
  )
);
