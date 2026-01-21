1) 서버 Draft 큐 동작 원칙

사용자가 대시보드 그리드에서 영상을 선택해서 “큐에 추가”하면
→ jobs 레코드가 status=draft 로 서버에 생성됨

draft 상태는 “아직 실행 안 함”이며, 사용자는:

옵션 일괄 변경

순서 변경(드래그)

일부 삭제

실행(Run) 시 draft → queued 로 전환

새로고침/재접속해도 큐가 그대로 복원됨.

2) DB 스키마 (Draft 큐 안정화를 위한 추가 필드/테이블)
A. jobs 테이블에 추가 추천 필드

queue_id (uuid, index) : 이 잡이 속한 큐

queue_position (int, index) : 큐 내 정렬 순서

batch_id (uuid, nullable) : “이번에 선택해서 추가한 묶음” 구분(선택)

draft_expires_at (timestamp, nullable) : 장기 방치 draft 자동 정리용(선택)

locked_by / locked_at (nullable) : 실행/변경 충돌 방지(선택)

status는 기존대로 draft/queued/running/... 유지.

B. queues 테이블 (권장)

id (uuid, pk)

user_id, workspace_id

name (default: “Default Queue”)

default_options_json (jsonb) : “이 큐의 기본 옵션”

created_at, updated_at

왜 queues 테이블이 좋냐?

유저가 큐를 여러 개 만들 수도 있고(향후),

큐 기본 옵션(기본 번역/포맷 등)을 저장해두면 “큐에 추가할 때 자동 적용”이 쉬움.

(최소 구현으로는 queue 테이블 없이 user_id + status=draft로도 가능하지만, 정렬/기본옵션/확장성을 생각하면 queues 추천)

3) API 엔드포인트 (서버 Draft 큐 기준)
큐 조회/생성

GET /api/queue

returns: 기본 큐(없으면 자동 생성)

GET /api/queue/:queueId/jobs?status=draft

returns: draft job 리스트(정렬된 상태)

큐에 추가 (draft job 생성)

POST /api/queue/:queueId/jobs

body: { assetIds: string[], options?: object }

server:

assetIds 각각에 대해 job 생성(status=draft)

queue_position은 현재 맨 뒤부터 증가

options가 없으면 queues.default_options_json을 적용

returns: { jobs: Job[] }

중요: 동일 asset을 draft로 중복 추가하지 않게 하려면
(queue_id, asset_id, status=draft) 유니크 제약(또는 upsert) 추천

draft 옵션 일괄 적용

PATCH /api/queue/:queueId/jobs/bulk

body: { jobIds: string[], optionsPartial: object }

returns: updated jobs

draft 순서 변경(드래그 정렬)

PATCH /api/queue/:queueId/jobs/reorder

body: { orderedJobIds: string[] }

server: queue_position 재정렬(0..n)

draft 삭제/제거

DELETE /api/queue/:queueId/jobs/bulk

body: { jobIds: string[] }

실행 (draft → queued)

POST /api/queue/:queueId/run

body: { jobIds?: string[] } (없으면 큐의 전체 draft)

server:

대상 draft job들을 트랜잭션으로 잠금(locked_at) 후

status를 queued로 변경 + queued_at 기록

워커/큐 시스템에 enqueue

returns: { queued: Job[] }

4) UX 플로우 (서버 Draft 큐와 정확히 매칭)
대시보드(그리드) → 큐 추가

유저가 6개 선택 → “큐에 추가”

프론트는 즉시(optimistic) “Queued/Draft 표시”해도 되지만,

**최종 상태는 서버 응답(job ids)**로 확정

성공 시: 우측 Queue Drawer에 draft 6개가 나타남

일괄 설정

“일괄 설정” 모달에서 옵션 변경 → PATCH bulk

큐 상단에 “기본 옵션으로 저장” 토글을 두면:

현재 옵션을 큐의 default_options_json에도 반영 가능
(PATCH /api/queue/:id 같은 엔드포인트로)

실행

Run 클릭 → POST /run

즉시 UI에서 draft가 queued로 바뀌고, /jobs 페이지에서도 동일하게 보임

5) 서버 Draft 방식에서 꼭 챙겨야 할 운영 포인트 6개

중복 방지

같은 asset을 draft로 여러 번 큐에 넣는 실수를 막기(유니크/업서트)

정렬 일관성

reorder는 서버가 authoritative(서버가 queue_position 관리)

멱등성

run 요청이 중복 호출돼도 queued가 2번 되지 않도록(상태 체크 + 트랜잭션)

다중 탭/다중 디바이스 충돌

run이나 bulk 업데이트 시 optimistic lock(locked_at/version) 있으면 안정적

드래프트 정리 정책

예: 30일 이상 방치 draft는 자동 삭제 또는 보관 처리(draft_expires_at)

권한/플랜 제한

draft 생성 단계에서 “한 번에 큐에 담을 수 있는 개수” 제한을 걸면 UX가 깔끔해짐