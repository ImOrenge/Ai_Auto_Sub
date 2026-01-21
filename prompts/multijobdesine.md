1) 핵심 UX 컨셉: “라이브러리(영상) ↔ 큐(작업)”

대시보드 그리드 = 업로드된 영상 라이브러리

우측(또는 하단) 드로어 패널 = 작업 큐

사용자는 그리드에서 다중 선택 → 큐에 추가 → 일괄 설정 → 실행 흐름으로 자연스럽게 감.

2) 화면 구조(레이아웃)
A. 상단 툴바(고정)

좌측: Upload 버튼 + 드래그&드롭 안내(hover 시)

중앙: 검색(파일명/태그/상태) + 필터(업로드됨/처리중/완료/에러)

우측: 보기 옵션(그리드 크기), 정렬(최신/이름/길이), 선택 모드 토글(옵션)

B. 메인: 영상 그리드(Thumbnail Grid)

각 카드(Thumbnail Card) 구성:

썸네일(없으면 플레이스홀더 + “썸네일 생성중”)

파일명(2줄 ellipsis)

길이, 해상도(가능하면), 업로드 날짜

상태 배지:

Uploaded, Uploading, Queued, Processing, Done, Error

카드 우상단: 체크박스(선택 모드일 때 항상 표시 / 기본은 hover 시 표시)

카드 하단(얇게): 진행률 바(업로드/처리 시)

C. 하단 “선택 액션 바”(Selection Action Bar, 선택 시 등장)

선택이 1개 이상이면 화면 하단에 고정 바가 뜸:

선택 n개

액션: 큐에 추가 / 일괄 설정 / 선택 해제 / 삭제(권한)

우측: 즉시 실행(큐 추가+실행을 한 번에)

D. 우측 “큐 패널”(Queue Drawer)

탭: Queue / History

Queue 리스트 아이템: 영상명 + 상태 + 옵션요약(언어/번역/출력) + 개별 시작/취소

상단: 전체 옵션 일괄 적용 버튼

하단: Run n jobs CTA + 예상 소요(가능하면)

3) 사용 흐름(가장 중요한 부분)
Flow 1) 다중 업로드 → 자동 그리드 표시

사용자가 Upload 클릭 또는 드롭존에 파일 드래그

파일 선택창에서 여러 개 파일 선택

업로드 즉시:

그리드에 카드가 “Uploading…” 상태로 먼저 생성(optimistic)

각 카드에 진행률 표시

업로드 완료 시:

상태 Uploaded

백엔드 썸네일 생성/메타 추출이 끝나면 썸네일이 교체됨

UX 포인트

업로드 중에도 사용자는 다른 영상을 선택/큐 구성 가능

업로드 실패 파일은 카드에 Retry / Remove 노출

Flow 2) 그리드에서 다중 선택 → 큐에 올리기

선택 규칙(윈도우/맥 사용자 익숙한 방식 그대로):

단일 선택: 클릭

다중 선택:

Ctrl/⌘ + 클릭 = 토글 선택

Shift + 클릭 = 범위 선택

“선택 모드”가 아니어도, 카드 hover 체크박스로 바로 선택 가능

선택 후:

하단 액션 바에서 큐에 추가

큐 패널에 n개 job이 쌓임(기본 옵션 적용)

Flow 3) 큐에서 일괄 설정 → 실행

일괄 설정(Bulk Settings) 모달/패널:

원본 언어(자동감지/KO/EN/JP…)

번역 여부(Off/On) + 대상 언어

자막 포맷(SRT/VTT)

화자 분리(옵션)

타임코드 정밀도(옵션)

출력 네이밍 규칙(파일명 유지/템플릿)

적용 범위: 선택된 큐 항목 or 전체 큐

실행:

Run n jobs → 상태 Queued → Processing

4) 상태 디자인(업로드/큐/처리)

각 영상(Asset)과 작업(Job)을 분리해서 상태를 명확히 보여줘야 UX가 안정적임.

Asset(영상 파일) 상태

LOCAL_SELECTED (아직 업로드 시작 전)

UPLOADING (진행률)

UPLOADED (저장 완료)

FAILED (재시도 가능)

Job(처리 작업) 상태

DRAFT (큐에만 있고 아직 실행 전)

QUEUED

RUNNING

SUCCEEDED

FAILED (재시도 버튼)

CANCELED

그리드 카드엔 “가장 중요한 상태 1개”만 보이게

업로드 중이면 업로드가 최우선

업로드 완료면 Job 상태 배지로 전환

5) “실제 구현” 기준의 기술 흐름(권장)

업로드를 브라우저 서버로 직접 보내면 병목/비용 커지니까 보통 이렇게 가:

프론트: 파일 선택 → 백엔드에 createUploadSession 요청

백엔드: 스토리지(S3/R2/GCS 등) Presigned URL 발급

프론트: Presigned URL로 직접 업로드(멀티파트/리줌 가능하면 더 좋음)

업로드 완료 콜백 → 백엔드에 completeUpload(assetId)

백엔드: 썸네일/메타 추출(비동기) 후 Asset 업데이트

사용자가 선택 → createJobs(assetIds, options)로 멀티 잡 생성

결과적으로 Asset 업로드 파이프라인과 Job 처리 파이프라인을 분리하면, “업로드는 됐는데 작업은 나중에” 같은 실제 운영 시나리오가 깔끔하게 처리됨.

6) 컴포넌트 트리(React 기준)

DashboardPage

TopToolbar

UploadButton (+ Dropzone)

SearchInput

FilterChips

SortMenu

GridSizeToggle

SelectionActionBar (조건부 렌더)

AssetGrid

AssetCard * N

QueueDrawer

QueueHeader

QueueList

QueueItem * N

QueueFooterCTA

7) 반드시 넣으면 좋은 디테일(완성도 급상승)

업로드 중 탭 이동/새로고침 경고(진행 중이면 confirm)

대용량/긴 영상 제한(플랜별 제한을 UX로 자연스럽게)

실패 케이스:

네트워크 끊김 → 자동 재시도(최대 n회) + 수동 Retry

인코딩 지원 불가 → “지원 포맷 안내 + 변환 가이드”

접근성:

키보드로 그리드 이동(방향키) + 스페이스로 선택

선택 상태 ARIA

8) 바로 적용 가능한 마이크로카피 예시

업로드 드롭존: 여기에 파일을 놓아 업로드 • 여러 개 선택 가능

진행률: 업로드 중… 42%

썸네일 생성: 미리보기 생성 중…

큐 CTA: 선택한 6개를 큐에 추가

실행 CTA: 6개 작업 실행