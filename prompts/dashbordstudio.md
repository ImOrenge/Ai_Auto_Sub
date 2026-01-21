PRD: Dashboard vs Studio 기능 분리
0) 목표

유저가 로그인 후 **“지금 뭐 해야 하지?”**를 바로 해결: Dashboard = 포털/현황/바로가기

실제 작업(업로드/큐/편집/용어집/프로젝트 운영)은 Studio = 작업실로 집중

결과적으로 “대시보드가 휑함/동선 혼란/기능 과밀”을 제거

1) 핵심 원칙

Dashboard는 ‘작업 수행’ 금지(최소화): 업로드 버튼은 있어도 “작업 UI(그리드/큐/편집)”는 Studio로 보냄

Studio는 ‘프로젝트 스코프’ 기본: Studio는 항상 특정 프로젝트 컨텍스트를 갖는다

Billing/Usage/API/Account는 “Dashboard 메인 기능”이 아니라 Settings 영역으로 이동

Dashboard에는 “요약 뱃지 + 링크”만 노출

2) IA / 라우팅
2.1 App 루트

/app → Dashboard

(선택) /app/dashboard (alias)

2.2 프로젝트/작업

/app/projects : 프로젝트 목록/검색/생성

/app/projects/:projectId : 프로젝트 개요(선택, 없어도 됨)

/app/projects/:projectId/studio : Studio Home (업로드/라이브러리/큐 요약)

/app/projects/:projectId/assets : 에셋 라이브러리(필요 시 Studio 내부 탭으로 통합 가능)

/app/projects/:projectId/queues/:queueId : 큐 운영(드래프트/러닝/히스토리)

/app/projects/:projectId/jobs : 잡 목록/상태

/app/projects/:projectId/editor/:jobId : 자막 편집(AWAITING_EDIT)

2.3 설정(유저/결제/사용량/API)

/app/settings/profile

/app/settings/usage

/app/settings/billing

/app/settings/api

/app/settings/security

3) 글로벌 네비게이션(사이드바/헤더)
3.1 사이드바(좌)

Dashboard

Projects

Studio (최근 프로젝트로 진입 / 프로젝트 선택 유도)

Jobs (전체 보기 + 프로젝트 필터)

Glossary (전역 or 프로젝트 택1 / 추천: 프로젝트 스코프)

3.2 우측 상단(프로필 드롭다운)

Settings

Usage

Billing

API

Logout

3.3 “Studio 진입” 행동 규칙

현재 프로젝트 컨텍스트가 없으면:

/app/projects로 보내거나

모달로 “프로젝트 선택/새 프로젝트 생성” 제공

4) 페이지 PRD
4.1 Dashboard (/app)
목적

유저가 현황을 즉시 파악하고, 다음 액션(Studio)으로 1클릭 이동

섹션 구성(권장)

Continue (가장 위)

“마지막으로 작업하던 위치” 버튼 1개 (Studio/Queue/Editor 딥링크)

보조 CTA: “새 프로젝트 생성”, “업로드 시작(=Studio로 이동)”

Recent Projects (카드 그리드)

최근 6~12개

카드 정보: 프로젝트명, 최근 업데이트, 상태 뱃지(Running/Queued/Failed/Editing)

카드 클릭: /app/projects/:id/studio

Action Needed (할 일)

AWAITING_EDIT 잡 리스트(최대 5)

Failed 잡 리스트(최대 5)

각 항목 클릭 시 해당 화면으로 이동(에디터/잡 디테일)

Activity (최근 작업 로그)

최신 잡 이벤트 타임라인 (성공/실패/편집대기/실행)

Account Summary (요약만)

사용량 진행 바 + “자세히”(settings/usage)

플랜 뱃지 + “관리”(settings/billing)

Empty/Edge

프로젝트가 0개면:

“첫 프로젝트 만들기” 중심의 온보딩(3-step)

Continue 대상이 없으면:

“새 프로젝트 / 업로드 시작” CTA만

수용 기준(AC)

로그인 후 Dashboard에서 2클릭 이내로 Studio 작업 시작 가능

AWAITING_EDIT가 있으면 유저가 대시보드에서 즉시 확인 가능

4.2 Projects (/app/projects)
목적

프로젝트를 “찾고/만들고/정리”하는 곳

기능

검색(이름)

정렬(최근/이름/상태)

핀(즐겨찾기)

생성(Create Project)

삭제/아카이브(옵션)

Empty

“프로젝트 생성” + 샘플 프로젝트 생성(옵션)

4.3 Studio Home (/app/projects/:projectId/studio)
목적

업로드/에셋/큐/편집으로 이어지는 작업 허브

레이아웃(추천)

상단: Project Switcher + “Upload” CTA + Queue 상태 chips

본문 탭(2안 중 택1)

(안A) 한 페이지 내 섹션형: Upload 패널 → Asset Grid → Queue Draft Drawer

(안B) 탭형: Assets / Queue / Jobs / Glossary

핵심 동선

업로드 완료 → Asset Grid 등장

Asset 다중선택 → “Add to Draft Queue”

Draft Queue에서 옵션 지정(STT/번역/프리셋 등) → Run

완료 후 결과 다운로드 or AWAITING_EDIT로 편집 진입

Empty/Edge

에셋 0개: 업로드 Empty state + 샘플 파일 안내(옵션)

큐 0개: “첫 큐 만들기” 가이드

4.4 Queue 운영 (/app/projects/:projectId/queues/:queueId)
목적

Draft → Running → History 운영

탭

Draft: 드래그 정렬, 다중삭제, 파이프라인 옵션, “Run”

Running: 진행률, 취소, 병렬 처리 표시

History: 결과(다운로드/재시도/에디터 열기)

AC

Draft에서 Run 시 즉시 Running으로 상태 전환(낙관적 UI 가능)

실패 항목은 History에서 “재시도” 제공

4.5 Jobs (/app/projects/:projectId/jobs) + 전체 Jobs (/app/jobs 선택)
목적

잡을 필터/검색하고 상태를 추적

기능

상태 필터(queued/running/succeeded/failed/awaiting_edit)

검색(파일명)

잡 클릭 → 디테일 페이지 or 에디터 딥링크

4.6 Editor (/app/projects/:projectId/editor/:jobId)
목적

AWAITING_EDIT 잡의 편집/프리셋/용어집 적용 후 export

필수

플레이어 + 타임라인 + 자막 라인 편집

스타일 프리셋 적용(추후 확장)

Export / Save

4.7 Settings (/app/settings/*)
목적

계정/플랜/사용량/API 관리(“대시보드가 아니라 설정”으로)

5) 데이터 모델(요약 계약)
Project

id, name, createdAt, updatedAt

pinned?: boolean

stats: { assetsCount, jobsRunning, jobsQueued, jobsFailed, jobsAwaitingEdit }

Asset

id, projectId, type(video/audio), filename, duration, thumbnailUrl, createdAt

meta: { size, codec, resolution }

Queue

id, projectId, name, status(draft/running/idle)

draftItems: [{ assetId, pipelineConfig }]

Job

id, projectId, assetId

status(queued/running/succeeded/failed/awaiting_edit)

progress(0-100), error?

outputs: { srtUrl?, vttUrl?, jsonUrl? }

UsageSummary

periodStart, periodEnd

usedSeconds, includedSeconds, overageSeconds

estimatedCost?

PlanSummary

planName, renewalDate, limits, features

GlossaryTerm

id, projectId, source, target, note?, updatedAt

6) API 엔드포인트(예시)
Dashboard

GET /api/dashboard/summary

recentProjects[]

continueLink

actionNeeded: { awaitingEditJobs[], failedJobs[] }

activity[]

usageSummary + planSummary(요약)

Projects

GET /api/projects?query=&sort=

POST /api/projects

PATCH /api/projects/:id (name/pin/archive)

DELETE /api/projects/:id

Assets/Upload

POST /api/projects/:id/assets/upload (multipart or presigned)

GET /api/projects/:id/assets?cursor=

Queues/Jobs

POST /api/projects/:id/queues

GET /api/projects/:id/queues/:queueId

POST /api/projects/:id/queues/:queueId/run

GET /api/projects/:id/jobs?status=&cursor=

GET /api/projects/:id/jobs/:jobId

Editor

GET /api/projects/:id/jobs/:jobId/subtitles

PATCH /api/projects/:id/jobs/:jobId/subtitles

POST /api/projects/:id/jobs/:jobId/export

Settings

GET /api/settings/profile

GET /api/settings/usage

GET /api/settings/billing

GET /api/settings/api-keys

7) 상태/UX 규칙(로딩 지옥 방지용 “고정 규칙”)

라우트 진입 시 레이아웃 먼저 렌더 + Skeleton

데이터 실패 시 Error Boundary + 재시도

리스트는 cursor 기반으로 점진 로딩

Continue 딥링크는 “존재 검증” 실패 시 Dashboard로 graceful fallback

8) 이벤트/분석(옵션)

dashboard_continue_clicked

project_card_opened

studio_upload_started / completed

queue_run_clicked

job_status_changed

editor_opened / export_done

upgrade_clicked (usage limit 경고에서)

9) 마이그레이션 체크리스트

기존 “대시보드에 있던 업로드/그리드/큐” → Studio로 이동

/app는 Dashboard(현황/바로가기)로 재정의

오래된 링크가 있다면:

/app/dashboard → /app 유지

(레거시) /dashboard 접근 시 /app로 리다이렉트

(A) Dashboard 와이어프레임 (텍스트)

목적: 현황 + 다음 액션(Studio)로 즉시 이동
원칙: Dashboard에서 “작업 UI(그리드/큐/편집)”는 하지 않음. 바로가기만.

0) 공통 레이아웃 (AppShell)

좌측 Sidebar

상단 Header

좌: 현재 페이지 타이틀 (Dashboard)

우: Search(옵션) / 알림(옵션) / 프로필 드롭다운(Settings, Billing 등)

Main Content: 아래 섹션

1) Hero / Continue (상단 고정)
[ Continue Card ]
- Title: "이어하기"
- Subtitle: "마지막 작업: {ProjectName} · {LastContextLabel}"
- Primary CTA: [계속하기] -> lastDeepLink (Studio/Queue/Editor)
- Secondary CTA: [업로드 시작] -> /app/projects/:id/studio (또는 프로젝트 선택 모달)
- Tertiary: [새 프로젝트] -> /app/projects (생성 모달 오픈)


Empty(continue 없음)

“최근 작업이 없습니다”

CTA: 새 프로젝트 / 업로드 시작만 노출

2) Recent Projects (카드 그리드)
Header: Recent Projects   [검색] [정렬] [전체보기]
Grid (6~12 cards)

[ ProjectCard ]
- Name
- UpdatedAt (상대 시간)
- Status chips: Running / Queued / Failed / Awaiting Edit
- CTA: [Studio] (primary)
- Optional: [Jobs] / [Queue]


Empty(프로젝트 0개)

큰 Empty State: “첫 프로젝트를 만들어보세요”

CTA: [프로젝트 생성] + 3-step 가이드(선택)

3) Action Needed (해야 할 일)
Two columns (or tabs)

[ Awaiting Edit ]
- list up to 5
- item: {filename} {duration} [열기] -> /editor/:jobId

[ Failed Jobs ]
- list up to 5
- item: {filename} {errorSummary} [재시도] / [디테일]


없으면 섹션 숨기거나 “현재 처리할 작업이 없습니다” 최소 표시

4) Activity (최근 활동 타임라인)
[ ActivityTimeline ]
- Job created
- Queue run
- Completed / Failed / Exported / Sent to Editor
- Click -> 해당 job detail or studio context

5) Account Summary (요약만, 관리 화면 X)
[ UsageSummaryCard ]
- Progress bar (used/included)
- Warning: 80%, 100% 임박 표시
- Link: [사용량 자세히] -> /app/settings/usage

[ PlanBadgeCard ]
- Current plan badge
- Link: [플랜 관리] -> /app/settings/billing

Dashboard 컴포넌트 트리 (권장)

DashboardPage

ContinueCard

RecentProjectsSection

ProjectCardGrid

ProjectCard

ActionNeededSection

AwaitingEditList

FailedJobsList

ActivitySection

ActivityTimeline

AccountSummaryRow

UsageSummaryCard

PlanBadgeCard

(B) Studio 와이어프레임 (텍스트)

목적: 업로드 → 에셋선택 → 큐 구성 → 실행/모니터링 → 편집/내보내기
원칙: Studio는 프로젝트 컨텍스트 필수.

0) Studio Header (프로젝트 스코프)
Left:
[ ProjectSwitcher ▼ ]  (최근/검색)
Right:
[ Upload ]  [ New Queue ]  [ Jobs ]  [ Glossary ]
Status chips:
Queued: N | Running: N | Failed: N | Awaiting Edit: N


프로젝트 컨텍스트 없음

Studio 진입 시 /app/projects로 보내거나 “프로젝트 선택 모달”

1) Main Layout (추천: 2패널 + 드로어)

좌/중앙: Asset Library (그리드)

우측(고정 패널 또는 Drawer): Draft Queue

1-1) Asset Library (그리드)
Top row:
- Search (filename)
- Filters: video/audio, uploaded today, tagged
- Sort: recent/name/duration

Grid:
[AssetThumbCard]
- thumbnail
- filename, duration
- checkbox (multi-select)
- quick actions: preview / details


Empty(에셋 0)

“파일을 업로드해서 시작하세요”

드래그&드롭 영역 + 업로드 버튼

Multi-select 상태

상단 sticky selection bar:

“N개 선택됨”

[Add to Draft Queue]

[Remove] (옵션)

[Clear]

2) Draft Queue (우측 패널/드로어)
Header: Draft Queue (QueueName editable)   [Clear] [Save Queue]

List:
[QueueItemRow]
- asset name, duration
- drag handle
- pipeline config summary (STT, Translate, Preset, Glossary)
- remove item

Bottom:
[Pipeline Config]
- STT: model / language
- Translate: on/off + target language
- Subtitle Preset: dropdown
- Glossary: attach
- Output: srt/vtt/json

Actions:
[Run Queue] (primary)
[Validate] (optional)


Run 클릭

즉시 “Running” 탭/페이지로 이동하거나 상단에서 Running 상태 표시

성공/실패/편집대기는 History/Jobs에서 추적

3) Running / History (탭 또는 별도 라우트)

탭형이면 Studio 안에서:

Assets | Queue | Running | History | Jobs | Glossary

라우트형이면:

/queues/:queueId에서 Running/History 운영

4) AWAITING_EDIT 처리

Studio 상단 chips 클릭 또는 “Action Needed”에서:

/editor/:jobId로 바로 이동

Studio 컴포넌트 트리 (권장)

StudioPage({projectId})

StudioTopBar

ProjectSwitcher

UploadButton

QueueStatusChips

StudioBody

AssetLibrary

AssetToolbar

AssetGrid

AssetThumbCard

SelectionBar

DraftQueuePanel

DraftQueueHeader

DraftQueueList

QueueItemRow

PipelineConfigForm

RunActions

(C) Next.js(App Router) navItems / 라우트 헬퍼 스니펫

포인트: Studio 메뉴는 마지막 프로젝트가 있으면 거기로, 없으면 Projects로 fallback.

// app/_lib/routes.ts
export const routes = {
  dashboard: () => "/app",
  projects: () => "/app/projects",
  jobs: () => "/app/jobs",

  project: (projectId: string) => `/app/projects/${projectId}`,
  studio: (projectId: string) => `/app/projects/${projectId}/studio`,
  projectJobs: (projectId: string) => `/app/projects/${projectId}/jobs`,
  queue: (projectId: string, queueId: string) => `/app/projects/${projectId}/queues/${queueId}`,
  editor: (projectId: string, jobId: string) => `/app/projects/${projectId}/editor/${jobId}`,
  glossary: (projectId: string) => `/app/projects/${projectId}/glossary`,

  settings: {
    profile: () => "/app/settings/profile",
    usage: () => "/app/settings/usage",
    billing: () => "/app/settings/billing",
    api: () => "/app/settings/api",
    security: () => "/app/settings/security",
  },
} as const

export type NavItem = {
  key: string
  label: string
  href: string
  icon?: string // or LucideIcon
  match?: (pathname: string) => boolean
}

export function buildSidebarNav(opts: { lastProjectId?: string | null }): NavItem[] {
  const studioHref = opts.lastProjectId ? routes.studio(opts.lastProjectId) : routes.projects()

  return [
    { key: "dashboard", label: "Dashboard", href: routes.dashboard() },
    { key: "projects", label: "Projects", href: routes.projects() },
    { key: "studio", label: "Studio", href: studioHref },
    { key: "jobs", label: "Jobs", href: routes.jobs() },
  ]
}

export function buildProfileMenu(): NavItem[] {
  return [
    { key: "settings_profile", label: "Settings", href: routes.settings.profile() },
    { key: "settings_usage", label: "Usage", href: routes.settings.usage() },
    { key: "settings_billing", label: "Billing", href: routes.settings.billing() },
    { key: "settings_api", label: "API", href: routes.settings.api() },
    { key: "settings_security", label: "Security", href: routes.settings.security() },
  ]
}

(옵션) Studio 메뉴 클릭 시 프로젝트 선택 모달

lastProjectId가 없으면 routes.projects()로 보내되,

Projects 페이지에서 “프로젝트 선택 즉시 Studio로 이동” CTA 제공.