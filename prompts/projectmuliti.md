PRD: 프로젝트 기반 멀티큐 자막 처리 스튜디오
0. 한 줄 요약

사용자는 프로젝트를 생성하고, 프로젝트 안에서 여러 큐(Queue) 를 운용하며, 여러 영상을 업로드/선택해 큐에 서버 draft job으로 쌓고 일괄 설정 후 실행한다. 모든 과정은 무한 로딩 없이 실패/초기화/권한/빈 상태를 명확히 처리한다.

1. 목적

“영상 업로드 → 다중 선택 → 큐에 담기(draft) → 옵션 일괄 적용 → 실행”을 최소 클릭으로 완성

프로젝트 단위로 작업을 분리(채널/클라이언트/기간별)

큐를 여러 개 운영(번역용/쇼츠용/자막만 등)하며 재사용 가능한 기본 옵션 제공

새 프로젝트/큐 없음/권한 문제/서버 오류 등 엣지케이스에서도 UI가 멈추지 않도록 설계

2. 사용자/권한
사용자 유형

개인 사용자(Owner)

팀 사용자(Workspace optional)

뷰어/에디터/오너 권한(선택)

권한 규칙

프로젝트 조회/업로드/잡 실행은 권한별 제한 가능

권한 부족 시 무한 로딩 금지, “권한 없음” 화면 제공

3. 정보 구조(IA) & 라우팅
추천 라우트

/projects : 프로젝트 목록

/projects/:projectId/studio : 프로젝트 홈(Studio)

/projects/:projectId/queues/:queueId : 큐(draft/실행/히스토리)

/projects/:projectId/jobs : 프로젝트 전체 잡 콘솔

/projects/:projectId/usage : 사용량

프로젝트 클릭 동작(중요)

프로젝트 카드 클릭 → 즉시 /projects/:projectId/studio로 이동

데이터 로딩은 Studio 페이지에서 처리

프로젝트/큐 초기화는 페이지 진입을 막지 않음(“초기화 UI”로 분기)

4. 핵심 엔터티

Project: 작업 공간

Queue: 프로젝트 내 대기열(여러 개)

Asset: 업로드된 영상

Job: 처리 작업(draft→queued→running→done)

상태 모델

Asset

uploading → uploaded → failed

Job

draft → queued → running → succeeded|failed|canceled

5. 기능 요구사항
5.1 프로젝트(Project)
5.1.1 생성

입력: 이름(필수), 설명(옵션)

생성 직후: 기본 큐 1개 자동 생성(권장: “기본 큐”)

생성 성공 후: /projects/:id/studio로 이동

엣지케이스

기본 큐 생성 실패:

Studio는 열린다

상단 배너: “프로젝트 초기화 실패. [재시도]”

큐 목록이 비어있는 UI 상태를 제공(“큐 만들기” 버튼)

5.1.2 목록/선택

/projects에서 프로젝트 카드 클릭 시 즉시 라우팅

“최근 사용” 정렬/핀

엣지케이스: 프로젝트 클릭 후 “로딩만” 문제 방지(필수)

클릭 핸들러에서 await 금지(라우팅 먼저)

Studio 페이지에 loading(스켈레톤) + error(재시도) 제공

큐가 없을 수 있음을 전제로 렌더 분기(queues[0] 가정 금지)

5.2 프로젝트 홈(Studio)
5.2.1 화면 구성

상단: Project Switcher + Queue Chips + 업로드 CTA

KPI: 오늘 처리량/진행중/크레딧(또는 사용량)

본문 2열:

좌: 최근 작업(Recent Jobs)

우: 내 큐 현황(Queue Overview)

하단: 라이브러리(영상 그리드 / 업로드 스튜디오 Empty state)

5.2.2 라이브러리(Asset Grid)

업로드된 asset을 그리드로 표시(썸네일/파일명/상태/진행률)

다중 선택 지원(Ctrl/Shift, 체크박스)

선택 시 하단 Selection Action Bar 표시

Empty state(업로드 0개)

드롭존 + [파일 선택] + [샘플로 체험]

3스텝 안내(업로드→선택→큐→실행)

엣지케이스

썸네일 생성 실패: 작업은 가능, 플레이스홀더 유지 + 안내

업로드 제한 초과: 업로드 직전 경고(파일 크기/개수/동시업로드/플랜)

네트워크 끊김: Retry 제공, 업로드 진행 상태 명확히

5.3 업로드(멀티 업로드)
5.3.1 업로드 플로우

파일 다중 선택/드롭

서버에서 presigned 발급(세션 생성)

클라에서 직접 업로드(진행률 표시)

업로드 완료 콜백(complete)

asset uploaded로 전환

백엔드 비동기로 썸네일/메타 추출

5.3.2 UX 요구사항

업로드 중에도 그리드에 카드가 먼저 나타남(optimistic)

각 카드에 진행률 바

실패 항목: Retry/Remove

엣지케이스

upload session 발급 실패: 즉시 에러 토스트 + 재시도

complete 실패: “업로드는 되었으나 등록 실패” 상태 표시 + 재시도

중복 업로드(같은 파일명): 파일명 중복 허용(서버 key는 uuid), UI에서 구분 가능

5.4 큐(Queue) & 서버 Draft Jobs
5.4.1 큐 생성/관리

프로젝트 내 큐 생성(이름, 기본 옵션)

큐 아카이브(삭제보다 권장)

큐 기본 옵션 편집(Queue.default_options_json)

엣지케이스

큐 0개:

Studio에서 “큐 없음” 배너 + [큐 만들기]

Selection Action Bar에서 큐 선택 불가 시 자동으로 “큐 만들기” 모달 오픈

5.4.2 큐에 추가(Add to Queue = draft job 생성)

Studio에서 asset 다중 선택 → QueuePicker로 대상 큐 선택 → “큐에 추가”

서버에 jobs 생성(status=draft, queue_position 부여)

큐의 default options가 job options로 스냅샷 적용(merge + override)

엣지케이스(중요)

동일 큐에 동일 asset을 draft로 중복 추가:

서버에서 upsert/유니크로 방지

UI는 “이미 큐에 있습니다” 토스트 + 해당 큐로 이동 링크 제공

5.4.3 큐 페이지(/queues/:queueId)

Draft 탭: draft 리스트(드래그 정렬, bulk 옵션, bulk 제거)

Running 탭: 진행 중 작업

History 탭: 완료/실패/다운로드/재시도

엣지케이스

reorder 실패: UI 롤백 + “정렬 저장 실패, 재시도”

bulk 옵션 적용 실패: 부분 실패를 알려주고 재시도

queueId가 잘못됨: 404 처리 + 프로젝트 홈으로 이동

5.4.4 실행(Run)

Run 클릭 → 대상 draft들을 queued로 전환(트랜잭션)

워커 큐 enqueue

UI: draft에서 빠지고 queued/running 표시

엣지케이스(멱등성/동시성)

Run 중복 클릭/중복 요청:

이미 queued로 바뀐 job은 제외(멱등)

동시에 여러 탭에서 Run:

서버에서 lock/트랜잭션으로 중복 enqueue 방지

큐 동시 실행 제한:

제한 초과 시 일부만 queued, 나머지는 draft 유지 + 안내

5.5 Jobs 콘솔(/jobs)

프로젝트 전체 잡 리스트

필터: 상태/큐/기간/검색

일괄 액션: cancel/retry/download

Job 상세: 로그/산출물/타임라인

엣지케이스

로그 조회 권한 없음: 마스킹/제한

다운로드 만료(서명 URL): 재발급 버튼

5.6 Usage(/usage)

프로젝트 단위 사용량 요약(월간)

잡별 사용량 레코드

한도 임박/초과 경고

엣지케이스

집계 지연: “집계 업데이트 중(최대 n분 지연)” 배너

결제 문제: 크레딧 부족 시 run 단계에서 차단 + 업그레이드 CTA

6. 필수 UX 안정성 요구사항(무한 로딩 방지 규격)
6.1 라우팅 규칙

프로젝트 클릭 시: push 먼저, fetch 나중

클릭 핸들러에서 API await로 네비게이션을 막지 않는다

6.2 페이지 상태 4종 표준화

loading: 스켈레톤(최대 1~2초 체감)

empty: 업로드 0/큐 0 등 명확한 CTA 제공

error: 에러 화면 + reset/재시도

partial: 일부 데이터만 로딩되어도 페이지는 렌더(예: queues 없음)

6.3 “큐 0개”는 정상 상태로 취급

queues[0] 같은 하드 가정 금지

큐가 없으면 “프로젝트 초기화/큐 생성” UI로 분기

7. API 요구사항(요약)

Projects: CRUD

Queues: project-scoped CRUD + default options

Assets: 업로드 세션/완료/목록

Jobs: draft 생성/조회/bulk/reorder/run + 프로젝트별 목록

멱등성/유니크 요구

draft 생성: (queue_id, asset_id, status=draft) 중복 방지

run: 상태 기반 멱등 처리

8. 로그/에러코드 표준(권장)

PROJECT_NOT_FOUND

PROJECT_FORBIDDEN

QUEUE_EMPTY_INITIALIZING

QUEUE_CREATE_FAILED

UPLOAD_SESSION_FAILED

UPLOAD_COMPLETE_FAILED

JOB_DUPLICATE_DRAFT

JOB_RUN_IDEMPOTENT

INSUFFICIENT_CREDIT

UI는 위 코드를 기반으로 사용자 친화 문구/CTA 제공.

9. 수용 기준(Acceptance Criteria)

새 프로젝트 생성 후 클릭 → Studio는 항상 열린다(무한 로딩 없음)

큐가 없어도 Studio가 깨지지 않고 “큐 만들기/초기화 재시도”가 노출된다

멀티 업로드 진행률이 카드 단위로 표시되고 실패는 Retry 가능

다중 선택 후 큐에 추가 시 서버에 draft job이 저장되며 새로고침 후에도 유지된다

동일 asset을 같은 큐에 draft로 중복 추가하려 하면 중복 방지된다

Run을 연타하거나 다중 탭에서 실행해도 중복 실행(중복 enqueue)이 발생하지 않는다

서버 오류 발생 시 error.tsx/재시도로 복구 가능하다