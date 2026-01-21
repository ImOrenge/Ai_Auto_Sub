1) /dashboard PRD (Multi-upload + Grid + Multi-select + Queue)
1. 목적

사용자가 여러 영상을 한 번에 업로드하고

업로드된 영상이 대시보드 그리드에 즉시 표시되며

그리드에서 다중 선택 → 작업 큐에 올리고 → 일괄 옵션 설정 → 실행까지 빠르게 진행

2. 핵심 성공 기준 (KPI)

업로드 완료 후 그리드에 표시까지 TTI(첫 표시) < 1s (낙관적 카드 생성 포함)

다중 업로드 성공률, 업로드 재시도 성공률

“큐에 추가 → 실행” 전환율

업로드/처리 실패 시 사용자 이탈률 감소(재시도 UX)

3. 주요 사용자 시나리오

드래그&드롭으로 10개 업로드 → 그리드에서 10개 확인

그리드에서 6개 선택(Ctrl/Shift) → 큐에 추가 → 번역 ON/언어 설정 → 실행

업로드 실패 2개는 Retry, 나머지는 먼저 작업 실행

큐에서 일부만 취소/재시도, 히스토리에서 결과 다운로드

4. IA / 레이아웃
상단 툴바(고정)

Upload 버튼 + Dropzone

검색(파일명/태그) + 필터(Uploaded/Uploading/Queued/Processing/Done/Error)

정렬(최신/이름/길이) + 그리드 크기 토글

메인: Asset Grid

카드: 썸네일, 파일명, 길이/해상도(가능 시), 날짜, 상태 배지, 진행률바(업로드/처리), 체크박스

클릭 동작

기본: 카드 클릭 = 미리보기/상세(우측 패널)

선택 모드: 카드 클릭 = 선택 토글(또는 체크박스)

Ctrl/⌘+클릭 토글, Shift+클릭 범위 선택

하단: Selection Action Bar(선택 시 등장)

“선택 n개”

액션: [큐에 추가] [일괄 설정] [선택 해제] [삭제(권한)]

우측 CTA: [즉시 실행] (큐추가+실행 동시)

우측: Queue Drawer

탭: Queue / History

Queue: 큐 아이템 리스트 + 옵션 요약 + 개별 취소/시작

상단: 전체/선택 일괄 옵션 적용

하단 CTA: Run n jobs

5. 상태 모델(표시 규칙)
Asset(영상 파일)

LOCAL_SELECTED(프론트만) → UPLOADING → UPLOADED → FAILED

Job(작업)

DRAFT(큐에만 있음) → QUEUED → RUNNING → SUCCEEDED/FAILED/CANCELED

그리드 카드 표시 우선순위

UPLOADING이면 업로드 상태가 최우선(작업 상태 숨김)

UPLOADED면 가장 최근 Job 상태 배지를 대표로 표시(Queued/Processing/Done/Error)

6. 권한/제한

플랜별 업로드 동시 개수/파일 크기 제한

초과 시: 업로드 직전 경고 + 대체 행동(플랜 업그레이드/파일 줄이기)

7. 에러 UX (필수)

업로드 실패: 카드에 Retry / Remove

썸네일 생성 실패: 플레이스홀더 유지 + “미리보기 생성 실패(작업은 가능)” 안내

처리 실패: 큐/히스토리에서 Retry (옵션 유지)

2) /jobs PRD (멀티잡 운영 콘솔)
1. 목적

실행된 작업을 대량으로 모니터링/필터링/재시도/취소/결과 다운로드 가능

운영 관점에서 “무슨 잡이 왜 실패했는지”가 명확해야 함

2. 화면 구성
상단

검색: jobId / 파일명 / 태그

필터: 상태(Queued/Running/Succeeded/Failed/Canceled), 기간, 옵션(번역ON 등)

정렬: 최신, 처리시간, 실패우선

일괄 액션(선택 시): Cancel, Retry, Download, Export CSV

리스트(테이블/카드)

각 Job Row:

체크박스

파일명 + assetId

상태 배지 + 진행률(러닝)

옵션 요약(언어/번역/포맷)

생성 시각/완료 시각/소요시간

액션: View / Retry / Cancel / Download

Job Detail(우측 패널 or 상세 페이지)

타임라인(Queued→Running→Done)

에러 로그(사용자 노출용 + 개발용 코드)

산출물 링크(SRT/VTT/JSON, 번역본)

“같은 옵션으로 재실행” 버튼

3. 실시간 업데이트

폴링(기본) 또는 SSE/WebSocket(권장)

상태 변동 즉시 반영 + 토스트 알림(실패/완료)

3) /usage PRD (사용량/과금 연동)
1. 목적

사용자가 **이번 달 사용량(분/초, 작업 수, 번역 사용량)**을 한 눈에 확인

플랜 한도 초과/임박 시 사전 경고

“어떤 작업이 비용을 만들었는지” 추적 가능

2. 화면 구성

요약 카드: 이번 달 총 처리시간, 번역 처리시간, 생성 산출물 수, 실패율

한도 바: 플랜 한도 대비 사용량(80%/100% 경고)

사용량 로그 테이블:

날짜/Job/Asset/처리시간/번역여부/청구 단위/상태

다운로드: 사용량 리포트(CSV)

4) DB 스키마 제안 (최소 운영 가능)
assets (업로드된 영상 “파일”)

id (uuid, pk)

user_id (uuid, index)

workspace_id (uuid, index, optional)

filename (text)

storage_key (text, unique) // S3/R2 경로

size_bytes (bigint)

mime_type (text)

duration_ms (bigint, nullable)

width (int, nullable)

height (int, nullable)

thumbnail_key (text, nullable)

status (enum: uploading, uploaded, failed)

error_code (text, nullable)

error_message (text, nullable)

created_at, updated_at

jobs (처리 작업 “단위”)

id (uuid, pk)

user_id (uuid, index)

workspace_id (uuid, index, optional)

asset_id (uuid, fk -> assets.id, index)

status (enum: draft, queued, running, succeeded, failed, canceled)

priority (int default 0)

options_json (jsonb)

sourceLang, translate(bool), targetLang, outputFormats[], diarization, etc.

progress (int 0~100, nullable)

started_at, finished_at (timestamp, nullable)

cost_units (numeric, nullable) // 분/초 기반 과금 단위

error_code, error_message (nullable)

created_at, updated_at

job_outputs (산출물)

id (uuid, pk)

job_id (uuid, fk, index)

type (enum: srt, vtt, txt, json, transcript)

storage_key (text)

size_bytes (bigint)

created_at

events (상태 이력/감사용)

id (uuid, pk)

entity_type (asset|job)

entity_id (uuid, index)

type (text) // ASSET_UPLOADED, JOB_FAILED 등

payload_json (jsonb)

created_at

5) API 엔드포인트 (프론트 구현 관점)
업로드

POST /api/uploads/session

body: { filename, sizeBytes, mimeType }

returns: { assetId, uploadUrls[] (multipart 가능), headers, storageKey }

POST /api/uploads/complete

body: { assetId, etags? }

returns: { asset }

GET /api/assets

query: status, search, sort, cursor

returns: { items[], nextCursor }

PATCH /api/assets/:id

(옵션) 태그/이름 변경 등

큐/잡 생성

POST /api/jobs

body: { assetIds: [], options, mode: "draft"|"queued" }

draft면 큐에만, queued면 즉시 실행

returns: { jobs[] }

PATCH /api/jobs/bulk

body: { jobIds: [], optionsPartial }

일괄 옵션 적용

POST /api/jobs/bulk/run

body: { jobIds: [] }

POST /api/jobs/bulk/cancel

body: { jobIds: [] }

POST /api/jobs/:id/retry

body: { keepOptions: true }

잡 조회/실시간

GET /api/jobs

query: status, dateRange, search, sort, cursor

GET /api/jobs/:id

returns: job + outputs + events

GET /api/jobs/stream (선택)

SSE로 상태 변경 push

사용량

GET /api/usage/summary?month=YYYY-MM

GET /api/usage/records?month=YYYY-MM&cursor=...

6) 프론트 상태관리(필수 포인트)

업로드 시: optimistic asset 카드 생성(status=uploading)

업로드 완료: asset.status=uploaded로 전환, 메타/썸네일은 비동기 업데이트

선택 상태: selectedAssetIds Set

큐 상태: draftJobs[] (서버 생성형으로 가면 draft job도 서버에 저장 추천)

실시간 업데이트: jobs list는 폴링(3~5초) 또는 SSE

7) 이벤트 트래킹(운영/개선용)

ASSET_UPLOAD_STARTED / PROGRESS / SUCCEEDED / FAILED

ASSET_MULTISELECT_USED (ctrl/shift/checkbox)

QUEUE_ADD_CLICKED (n개)

BULK_OPTIONS_APPLIED (옵션 스냅샷)

JOB_RUN_CLICKED (n개)

JOB_FAILED_REASON (error_code)

DOWNLOAD_OUTPUT_CLICKED