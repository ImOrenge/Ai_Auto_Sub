-- 소스 타입 컬럼 추가
-- 파이프라인에서 로컬 업로드인지 외부 URL인지 구분

-- source_type 컬럼 추가 (url, upload, youtube)
alter table public.jobs add column if not exists source_type text default 'url';

comment on column public.jobs.source_type is '소스 타입: url(외부 URL), upload(로컬 업로드), youtube(유튜브)';

-- source_type 체크 제약 추가
alter table public.jobs drop constraint if exists jobs_source_type_check;

alter table public.jobs add constraint jobs_source_type_check check (
  source_type in ('url', 'upload', 'youtube')
);
