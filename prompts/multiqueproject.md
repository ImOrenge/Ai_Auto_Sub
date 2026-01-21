1) 개념 모델

Project: 작업 단위(클라이언트/채널/콘텐츠 묶음)

Queue: 프로젝트 안에서 “작업 실행 대기열” (예: KO→EN, Shorts, Podcast 등 여러 개 가능)

Asset(영상): 업로드된 영상(프로젝트에 귀속)

Job: 특정 Asset을 특정 Queue에서 특정 옵션으로 처리하는 작업 (draft/queued/...)

관계:

Project 1 ─ N Asset

Project 1 ─ N Queue

Queue 1 ─ N Job

Asset 1 ─ N Job (다른 큐/다른 옵션으로 여러 번 가능)

2) DB 스키마 (프로젝트/여러큐 중심)
projects

id (uuid pk)

owner_user_id

workspace_id (팀이면)

name

description (nullable)

default_asset_view (grid/list 등 optional)

created_at, updated_at

queues

id (uuid pk)

project_id (fk, index)

name (예: “기본 큐”, “번역용”, “자막만”)

default_options_json (jsonb) ← 큐별 기본 옵션

concurrency_limit (int, nullable) ← 큐별 동시 실행 제한(옵션)

is_archived (bool default false)

created_at, updated_at

유니크 추천

(project_id, name) 유니크 (동일 프로젝트 내 큐 이름 중복 방지)

assets

id (uuid pk)

project_id (fk, index)

user_id

filename

storage_key

size_bytes, mime_type

duration_ms, width, height (nullable)

thumbnail_key (nullable)

status (uploading|uploaded|failed)

created_at, updated_at

jobs

id (uuid pk)

project_id (fk, index) ✅ (조회 성능 때문에 queue join 없이도 필터 가능)

queue_id (fk, index)

asset_id (fk, index)

status (draft|queued|running|succeeded|failed|canceled)

queue_position (int, index) ✅ 드래그 정렬

batch_id (uuid, nullable) (다중선택 한번에 추가한 묶음)

options_json (jsonb)

progress (0~100)

started_at, finished_at

error_code, error_message

created_at, updated_at

중복 방지(중요)

“같은 큐에 같은 asset을 draft로 중복 추가 방지”
→ 유니크 키: (queue_id, asset_id, status)에서 status=draft만 제한하는 부분 유니크(Partial Unique) 가능하면 강추
(DB가 partial unique 지원 어렵다면, 서버에서 upsert 로직으로 막아도 됨)

3) API 설계 (프로젝트/여러 큐)
프로젝트

POST /api/projects { name, description? }

GET /api/projects

GET /api/projects/:projectId (queues, stats 포함 가능)

PATCH /api/projects/:projectId

DELETE /api/projects/:projectId (소프트 삭제 추천)

큐

POST /api/projects/:projectId/queues { name, defaultOptions? }

GET /api/projects/:projectId/queues

PATCH /api/queues/:queueId { name?, defaultOptions?, isArchived? }

DELETE /api/queues/:queueId (아카이브로 대체 추천)

에셋(업로드)

POST /api/projects/:projectId/uploads/session

POST /api/uploads/complete

GET /api/projects/:projectId/assets?search=&status=&sort=&cursor=

큐에 추가(draft job 생성)

POST /api/queues/:queueId/jobs

body: { assetIds: [], optionsOverride?: {} }

server: 기본은 queue.default_options_json 적용, override 있으면 merge

returns: { jobs[] }

큐 조작

GET /api/queues/:queueId/jobs?status=draft

PATCH /api/queues/:queueId/jobs/bulk { jobIds, optionsPartial }

PATCH /api/queues/:queueId/jobs/reorder { orderedJobIds }

DELETE /api/queues/:queueId/jobs/bulk { jobIds }

POST /api/queues/:queueId/run { jobIds? } // draft → queued

잡(전체)

GET /api/projects/:projectId/jobs?status=&queueId=&search=&dateRange=&cursor=

GET /api/jobs/:jobId (outputs/events 포함)

4) UX/IA (여러 큐 + 프로젝트)
라우팅 추천

/projects : 프로젝트 리스트

/projects/:projectId/dashboard : 에셋 그리드(업로드/선택)

/projects/:projectId/queues/:queueId : 큐 드래프트/실행 화면(큐 전용)

/projects/:projectId/jobs : 전체 잡 콘솔(프로젝트 전체 필터)

/projects/:projectId/usage : 프로젝트 단위 사용량

대시보드에서 “큐 선택” UX (중요)

그리드에서 다중 선택 후 액션바에:

큐에 추가 버튼 옆에 Queue Picker 드롭다운

최근 사용 큐 상단 고정

“+ 새 큐 만들기” 인라인 생성

즉시 실행도 “어느 큐로 실행할지” 선택이 필수

추천 플로우:

기본은 “마지막으로 사용한 큐”가 선택됨

유저가 큐를 바꾸면 다음 작업도 그 큐로 기억

큐별 기본 옵션이 다르므로, “큐에 추가” 순간에 옵션이 자동 적용됨

큐 화면(Queue Page)

상단: 큐 이름 + 기본옵션 요약 + “기본 옵션 편집”

메인: Draft 리스트(드래그 정렬)

하단: Run 버튼 + 동시 실행 수/예상 소요

5) 옵션 구조(큐 기본옵션 vs 잡 개별옵션)

Queue.default_options_json = “해당 큐에 들어오면 기본으로 적용될 정책”

Job.options_json = “실제 실행에 쓰는 스냅샷”

잡 생성 시:

job.options = merge(queue.default_options, optionsOverride)

큐의 기본옵션을 바꾼다고 기존 draft job이 자동으로 바뀔지 정책 선택:

추천(안전): 기본옵션 변경은 “새로 들어오는 잡”에만 적용

기존 draft도 바꾸고 싶으면 “현재 draft 전체에 적용” 버튼을 별도로 제공(명시적 bulk)

6) 운영/확장 포인트(초기부터 넣으면 좋은 것)

프로젝트 아카이브: 완료된 프로젝트 숨김

큐 아카이브: 더 이상 안 쓰는 큐 숨김(잡 히스토리는 유지)

큐 단위 동시 실행 제한: 워커 과부하/요금 관리에 유리

프로젝트 단위 사용량 집계: /usage가 깔끔해짐

프로젝트 내 에셋 공유: 같은 영상으로 여러 큐에서 다른 옵션 실행 가능

### 컴포넌트 트리 ui wireframe

1) UI 와이어 수준 컴포넌트 트리
A. 라우팅/페이지 구조

/projects

/projects/:projectId/dashboard (업로드 + 에셋 그리드 + 큐로 보내기)

/projects/:projectId/queues/:queueId (큐 드래프트/실행)

/projects/:projectId/jobs (프로젝트 전체 잡 콘솔)

/projects/:projectId/usage (프로젝트 단위 사용량)

B. /projects (프로젝트 리스트)

목표: 프로젝트 만들기/선택

컴포넌트

ProjectsPage

PageHeader

CreateProjectButton (모달)

SearchInput

ProjectGrid

ProjectCard (최근 활동, 큐 개수, 완료/실패 통계)

EmptyState (첫 프로젝트 만들기)

핵심 UX

카드 클릭 시 /projects/:projectId/dashboard 진입

“최근 사용 프로젝트” 상단 고정(선택)

C. /projects/:projectId/dashboard (에셋 그리드 + 큐로 전송)

목표: 멀티 업로드 → 그리드 표시 → 다중 선택 → 특정 큐에 draft로 추가

컴포넌트

ProjectDashboardPage

ProjectTopBar

ProjectBreadcrumb (Projects > ProjectName)

QueueQuickSwitcher (최근 큐/즐겨찾기 큐, “새 큐 만들기”)

UploadButton + Dropzone

SearchInput

Filters (Uploaded/Uploading/Processing/Done/Error)

SortMenu + GridSizeToggle

AssetGrid

AssetCard * N

Thumbnail

MetaLine (duration/resolution)

StatusBadge

SelectCheckbox (hover/선택모드)

ProgressBar (uploading/processing)

SelectionActionBar (선택 시 하단 고정)

SelectedCount

QueuePicker ✅ (여기서 “어느 큐에 추가할지” 확정)

AddToQueueButton (draft 생성)

BulkOptionsButton (옵션 모달: “이 큐에 넣을 draft에 적용”)

ClearSelection

RunNowButton (draft 생성 + 즉시 queued 전환)

RightDrawer (선택)

탭: QueuePreview / AssetDetail

QueuePreview는 “현재 선택한 큐”의 draft 일부 요약(최근 10개 등)

선택 규칙(필수)

클릭: 단일 선택(기본)

Ctrl/⌘ + 클릭: 토글

Shift + 클릭: 범위 선택

키보드: 화살표 이동 + Space 선택 토글

빈 상태

업로드 전: “여러 파일을 드래그해 업로드”

검색 결과 없음: “필터/검색 초기화” 버튼

D. /projects/:projectId/queues/:queueId (큐 페이지)

목표: 서버 draft 리스트를 관리(옵션 일괄/순서/삭제)하고 실행(Run)

컴포넌트

QueuePage

QueueHeader

QueueNameEditable

QueueDefaultOptionsSummary (뱃지들)

EditDefaultOptionsButton (큐 기본옵션 편집 모달)

ArchiveQueueButton

QueueTabs

Draft / Running / History

DraftTab

DraftListToolbar

SelectAll

BulkEditOptions

BulkRemove

ReorderModeToggle (드래그 핸들 표시)

DraftJobList (드래그 정렬)

DraftJobItem

썸네일/파일명

옵션 요약

예상 비용/시간(가능하면)

Remove

QueueFooterCTA

RunAllDraftButton

RunSelectedButton

ConcurrencyIndicator (큐 동시 실행 제한 표시)

HistoryTab

JobHistoryTable (다운로드/재시도)

드래그 정렬 규칙

“ReorderMode” ON일 때만 드래그 가능(실수 방지)

드랍 후 즉시 PATCH /reorder 호출(서버가 authoritative)

E. /projects/:projectId/jobs (잡 콘솔)

목표: 프로젝트 전체 잡 모니터링/필터/일괄 재시도/다운로드

컴포넌트

JobsPage

JobsToolbar (검색/필터/기간/큐필터/상태)

JobsTable

선택 체크박스

상태/진행률

파일명/큐명/옵션요약

소요시간/생성일

액션(View/Retry/Cancel/Download)

JobDetailDrawer (로그/산출물/타임라인)

2) options_json 정식 스키마 (큐 기본옵션 + 잡 스냅샷)
A. 설계 원칙

Queue.default_options_json = “기본 정책(디폴트)”

Job.options_json = “실행 스냅샷(변경돼도 이 잡은 그대로)”

잡 생성 시: merge(queue.default_options, optionsOverride)로 확정

B. TypeScript 타입(권장)
export type OutputFormat = "srt" | "vtt" | "txt" | "json";

export type TextNormalization = {
  removeFillerWords?: boolean;   // 음, 어… 제거
  profanityFilter?: boolean;     // 비속어 마스킹
  punctuation?: "auto" | "off";  // 문장부호
};

export type TranslationOptions = {
  enabled: boolean;
  targetLang: string;            // "en", "ja", "zh", ...
  preserveProperNouns?: boolean; // 고유명사 유지
};

export type DiarizationOptions = {
  enabled: boolean;
  speakerCountHint?: number;     // 2~10 정도
};

export type SubtitleOptions = {
  maxCharsPerLine?: number;      // 기본 42
  maxLines?: 1 | 2;
  minSegmentMs?: number;         // 기본 800
  maxSegmentMs?: number;         // 기본 6000
};

export type NamingRule = {
  template: string;              // 예: "{filename}.{lang}.{format}"
  sanitize?: boolean;            // 파일명 안전문자 처리
};

export type JobOptions = {
  sourceLang: "auto" | string;   // "auto" | "ko" | "en" ...
  translation: TranslationOptions;
  outputs: OutputFormat[];       // 최소 1개
  diarization: DiarizationOptions;
  subtitle: SubtitleOptions;
  textNorm: TextNormalization;
  naming: NamingRule;
};

C. JSON Schema (검증용, 축약 버전)
{
  "type": "object",
  "required": ["sourceLang", "translation", "outputs", "diarization", "subtitle", "textNorm", "naming"],
  "properties": {
    "sourceLang": { "type": "string" },
    "translation": {
      "type": "object",
      "required": ["enabled", "targetLang"],
      "properties": {
        "enabled": { "type": "boolean" },
        "targetLang": { "type": "string" },
        "preserveProperNouns": { "type": "boolean" }
      }
    },
    "outputs": {
      "type": "array",
      "minItems": 1,
      "items": { "enum": ["srt", "vtt", "txt", "json"] }
    },
    "diarization": {
      "type": "object",
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean" },
        "speakerCountHint": { "type": "number", "minimum": 1, "maximum": 10 }
      }
    },
    "subtitle": {
      "type": "object",
      "properties": {
        "maxCharsPerLine": { "type": "number", "minimum": 10, "maximum": 80 },
        "maxLines": { "enum": [1, 2] },
        "minSegmentMs": { "type": "number", "minimum": 200, "maximum": 3000 },
        "maxSegmentMs": { "type": "number", "minimum": 1000, "maximum": 20000 }
      }
    },
    "textNorm": {
      "type": "object",
      "properties": {
        "removeFillerWords": { "type": "boolean" },
        "profanityFilter": { "type": "boolean" },
        "punctuation": { "enum": ["auto", "off"] }
      }
    },
    "naming": {
      "type": "object",
      "required": ["template"],
      "properties": {
        "template": { "type": "string" },
        "sanitize": { "type": "boolean" }
      }
    }
  }
}

D. 디폴트(추천)

sourceLang: "auto"

translation.enabled: false, targetLang: "en"

outputs: ["srt"]

diarization.enabled: false

subtitle: { maxCharsPerLine: 42, maxLines: 2, minSegmentMs: 800, maxSegmentMs: 6000 }

textNorm: { removeFillerWords: false, profanityFilter: false, punctuation: "auto" }

naming.template: "{filename}.{format}", sanitize: true

3) PRD (프로젝트/여러 큐/서버 draft)
3.1 목표

프로젝트마다 여러 큐를 두고(프로젝트 = 작업 단위)

에셋을 업로드해 라이브러리처럼 관리하며

선택한 에셋을 원하는 큐에 서버 draft job으로 쌓고

큐에서 옵션/정렬/실행을 제어하며

/jobs, /usage에서 운영과 비용을 추적한다.

3.2 사용자 스토리

사용자는 프로젝트를 만든다. (예: “유튜브_채널A_12월”)

프로젝트 대시보드에서 영상 20개를 한 번에 업로드한다.

8개를 선택해 “번역 큐(EN)”에 draft로 추가한다.

큐에서 자막 옵션을 일괄 적용하고 순서를 정리한다.

Run을 눌러 처리하고, 실패는 Retry한다.

/jobs에서 전체 상태를 모니터링하고 결과를 다운로드한다.

/usage에서 이번 달 프로젝트 사용량을 확인한다.

3.3 기능 요구사항
A) 프로젝트

생성/수정/아카이브

프로젝트 진입 기본 페이지: dashboard

프로젝트 단위 통계(선택): 최근 처리 수, 성공률, 사용량

B) 큐(프로젝트 내)

생성/이름 변경/아카이브

큐 기본 옵션 편집(Queue.default_options_json)

큐 단위 동시 실행 제한(옵션): concurrency_limit

C) 에셋 업로드 & 라이브러리

멀티 파일 선택/드롭 업로드

업로드 진행률 표시(카드 단위)

업로드 완료 즉시 그리드에 표시(optimistic)

썸네일/메타(길이/해상도)는 비동기 업데이트

필터/검색/정렬/그리드 크기

D) 다중 선택 & 큐로 보내기

Ctrl/Shift 선택 규칙

SelectionActionBar에서:

QueuePicker로 대상 큐 선택

“큐에 추가” = 서버 draft job 생성

“즉시 실행” = draft 생성 후 바로 queued 전환

중복 방지

동일 큐에 동일 asset을 draft로 중복 추가 금지(서버에서 upsert 또는 유니크)

E) 큐 페이지(draft 관리)

draft 리스트 조회(서버 저장 상태)

드래그 정렬(서버 반영)

bulk 옵션 적용(bulk patch)

bulk 제거(delete)

실행(run): draft → queued 트랜잭션 + 워커 enqueue

F) 잡 콘솔(/jobs)

프로젝트 전체 잡 리스트

큐/상태/기간/검색 필터

일괄 취소/재시도/다운로드

Job 상세(로그/산출물/타임라인)

G) 사용량(/usage)

프로젝트 단위 월간 사용량 요약

사용량 레코드 테이블(잡별 처리시간/번역 여부/단위)

한도(플랜) 대비 게이지 + 경고

3.4 비기능 요구사항(운영 안정성)

멱등성

run 중복 호출 시 queued 중복 enqueue 방지(트랜잭션/락)

동시성

다중 탭에서 draft 옵션 변경 충돌 최소화(버전/updated_at 기반)

성능

assets/jobs 목록은 cursor pagination

정리 정책

오래된 draft 자동 아카이브/삭제(옵션): 30~90일

3.5 API (핵심만, 프로젝트/큐 중심)

POST /api/projects

GET /api/projects

POST /api/projects/:projectId/queues

GET /api/projects/:projectId/queues

PATCH /api/queues/:queueId (default options 포함)

업로드

POST /api/projects/:projectId/uploads/session

POST /api/uploads/complete

GET /api/projects/:projectId/assets

draft 생성/관리

POST /api/queues/:queueId/jobs (draft 생성)

GET /api/queues/:queueId/jobs?status=draft

PATCH /api/queues/:queueId/jobs/bulk

PATCH /api/queues/:queueId/jobs/reorder

DELETE /api/queues/:queueId/jobs/bulk

POST /api/queues/:queueId/run

잡/사용량

GET /api/projects/:projectId/jobs

GET /api/jobs/:jobId

GET /api/usage/summary?projectId=&month=YYYY-MM