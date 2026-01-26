-- Add 'sequence' to source_type constraint for editor multi-clip support

-- Drop existing constraint
alter table public.jobs drop constraint if exists jobs_source_type_check;

-- Add updated constraint including 'sequence'
alter table public.jobs add constraint jobs_source_type_check check (
  source_type in ('url', 'upload', 'youtube', 'sequence')
);

-- Update column comment
comment on column public.jobs.source_type is '소스 타입: url(외부 URL), upload(로컬 업로드), youtube(유튜브), sequence(에디터 시퀀스)';
