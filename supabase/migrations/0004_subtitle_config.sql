-- 자막 스타일 설정을 위한 subtitle_config 컬럼 추가
-- 워크플로우 변경에 따른 새로운 상태값 추가

-- 1. subtitle_config JSONB 컬럼 추가
alter table public.jobs add column if not exists subtitle_config jsonb default null;

comment on column public.jobs.subtitle_config is 'FFmpeg 자막 합성 시 적용될 커스텀 스타일 설정 (폰트, 색상, 위치 등)';

-- 2. status 체크 제약 업데이트 (새로운 상태 추가)
alter table public.jobs drop constraint if exists jobs_status_check;

alter table public.jobs add constraint jobs_status_check check (
  status in (
    'pending',
    'uploading',       -- Supabase Uploads
    'preprocessing',   -- FFmpeg 전처리/자막 스타일 설정
    'downloading',
    'processing',
    'stt',             -- Whisper STT
    'translating',     -- 영한 번역
    'subtitle',
    'compositing',     -- SRT 자막 합성
    'awaiting_edit',
    'editing',
    'ready_to_export',
    'exporting',
    'done',
    'error',
    'canceled'
  )
);
