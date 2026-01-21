
## Phase 1. 프로젝트 및 인프라 베이스
- [x] Next.js 14(App Router) + Tailwind + TypeScript 기본 구조를 점검하고 `app/`, `components/`, `lib/` 디렉터리를 정리한다.
- [x] Supabase `jobs` 테이블과 `results` 스토리지 버킷을 생성하고 `updated_at` 트리거를 포함한 SQL 스크립트를 문서화한다.
- [x] `.env.local` 예시와 Vercel/Supabase 환경 변수 매핑 가이드를 작성해 배포 환경 준비를 마친다.


## Phase 2. 백엔드 파이프라인 구축
- [x] `lib/supabaseServer.ts`와 `lib/jobs/*` 헬퍼를 구현해 Job 생성/조회/상태 업데이트를 표준화한다.
- [x] `/app/api/jobs` POST와 `/app/api/jobs/[id]` GET 라우트를 작성해 Job 생성, 상태 조회, 동기 처리 흐름을 완성한다.
- [x] `processJob` 오케스트레이터와 세부 모듈(`downloadAudioFromUrl`, `callWhisper`, `translateSegments`, `generateSrt`, `uploadToStorage`)을 제작해 다운로드→STT→번역→SRT→업로드 파이프라인을 연결한다.
- [x] 각 단계에서 `status/step/progress`를 갱신하고 오류 발생 시 `error_message`를 기록하도록 방어 로직을 추가한다.

## Phase 3. 프론트엔드 UX
- [x] `app/layout.tsx`, `app/page.tsx`, `components/JobForm.tsx`를 구현해 URL 입력과 Job 생성 피드백을 제공한다.
- [x] `app/jobs/[id]/page.tsx`를 클라이언트 컴포넌트로 작성해 3초 폴링, 진행률 표시, SRT 다운로드 링크, 결과 영상 미리보기를 지원한다.
- [x] 폼 검증, 로딩/에러 상태, Tailwind 토큰 사용 등 UI 세부 사항을 다듬는다.

## Phase 4. URL 스크래핑 및 다운로드 확장
- [x] `resolveMediaSource` 모듈을 추가해 YouTube뿐 아니라 `<video>`, `<source>`, `meta og:video` 기반 일반 URL에서 실제 미디어 파일을 추출한다.
- [x] 도메인 타입 감지, HTML 파싱(`cheerio` 등), HTTPS 강제, 타임아웃·최대 응답 크기 제한, MIME 검증을 통해 안전하게 원본 파일을 찾아낸다.
- [x] 추출된 실제 미디어 URL을 `downloadMedia`/`downloadAudioFromUrl` 흐름에 연결하고, ffmpeg 기반 오디오 추출이나 Whisper 직접 전송 경로를 통일한다.
- [x] 스크래핑 실패 시 명확한 오류 메시지를 기록하고 향후 도메인별 파서를 손쉽게 추가할 수 있도록 구조화한다.

## Phase 5. 검증 및 배포
- [x] 대표 URL(YouTube, `<video>` 포함 블로그, og:video 기반 SNS)로 수동 E2E 테스트를 수행하고 `npm run lint`를 통과시킨다.
- [x] README/문서에 현재 제약(YouTube 우선, 장시간 영상 Vercel 타임아웃 가능 등)과 향후 백그라운드 처리, 추가 플랫폼 지원 로드맵을 정리한다.
- [x] Vercel + Supabase 조합으로 배포하고 필요한 모니터링/롤백 절차를 문서화한다.
