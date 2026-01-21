📄 PRD
AutoSubAI Console Layout (v1.0)
문서 정보

제품명: AutoSubAI

모듈: 운영 콘솔(App Shell & Navigation)

작성 목적: 자동 AI 자막(STT/번역/SRT) SaaS에 적합한 콘솔 레이아웃 정의

대상: 기획 / 프론트엔드 / 백엔드 / 디자인

상태: Draft → Dev Ready

1. 배경(Problem)

현재 AutoSubAI 콘솔은:

상단 네비게이션만 존재하여 확장성 부족

사용자의 현재 위치(Active Page) 인지 어려움

인증 상태가 UI에 명확히 드러나지 않음

자동 자막 SaaS의 핵심인 작업 상태(Job Status) 와 사용량 정보가 레이아웃에 반영되지 않음

➡️ 결과적으로 “기능은 있지만 운영 콘솔다운 신뢰감·통제감이 약함”.

2. 목표(Objectives)

운영 콘솔다운 정보 구조(IA) 확립

사용자가 “지금 어디에 있고, 무엇이 돌아가고 있는지” 즉시 인지

향후 기능 확장을 고려한 사이드바 기반 레이아웃

인증/권한/상태 중심의 SaaS UX 확보

3. 핵심 사용자
유형	설명
Creator	영상 업로드 후 자동 자막 생성
Operator	다량의 자막 작업을 큐 단위로 관리
Marketer	마케팅 페이지/결과물 관리
Admin	사용량, 결제, 설정 관리
4. 범위(Scope)
포함

글로벌 App Shell (Header / Sidebar / Main / Footer)

Active Navigation 표시

인증 상태 기반 UI 분기

데스크톱/모바일 반응형 대응

제외 (차후 버전)

Job Queue 상세 로직

결제 실제 연동

알림 실시간(WebSocket)

5. 정보 구조 (IA)
App Shell
 ├─ Header
 │   ├─ Logo / Workspace
 │   ├─ Quick Docs Link
 │   └─ Auth Area (Login | User Menu)
 │
 ├─ Sidebar (md+)
 │   ├─ Dashboard
 │   ├─ Jobs (자막 처리 큐)
 │   ├─ Uploads
 │   ├─ Glossary
 │   ├─ Billing / Credits
 │   ├─ Marketing
 │   └─ Settings
 │
 ├─ Main (children)
 │
 └─ Footer

6. UX / UI 요구사항
6.1 Header

항상 고정

반투명 + backdrop blur

구성 요소:

AutoSubAI 콘솔 로고

외부 문서 링크 (Supabase Docs)

인증 상태 영역

비로그인: 로그인 버튼

로그인: Logout 또는 User Menu

6.2 Sidebar (Desktop)

md 이상 화면에서 표시

Active 메뉴 강조:

배경 강조 + 텍스트 컬러 변경

aria-current="page" 적용

메뉴는 데이터 기반(navItems)

6.3 Mobile

사이드바 숨김

상단에 핵심 메뉴 1~2개만 노출

추후 Drawer 확장 가능

7. 기능 요구사항 (Functional Requirements)
FR-1. Active Navigation

현재 pathname 기준으로 메뉴 활성화

/jobs/123 → /jobs active 처리

FR-2. Authentication Awareness

RootLayout에서 인증 상태 주입

UI는 인증 상태에 따라 자동 분기

FR-3. 확장성

메뉴 추가 시 레이아웃 변경 최소화

navItems 배열 수정만으로 반영 가능

8. 비기능 요구사항 (Non-Functional)
항목	요구
접근성	aria-current, focus ring
성능	레이아웃은 CSR 최소화
유지보수	AppShell 컴포넌트 단일화
반응형	Desktop / Tablet / Mobile 대응
9. 성공 지표(Success Metrics)

사용자가 페이지 위치를 인지하는 시간 감소

대시보드 → 잡 큐 이동 이탈률 감소

향후 메뉴 7개 이상 확장 시 UX 붕괴 없음

내부 테스트 기준 “콘솔 같다” 평가 80% 이상

10. 향후 확장 로드맵
v1.1

Header에 Job Queue 상태 pill

크레딧 잔여량 표시

v1.2

알림(Notification) 센터

워크스페이스 전환

v2.0

멀티 프로젝트 콘솔

Admin 전용 레이아웃 분기

11. 결론

본 PRD는 AutoSubAI를
**“기능 데모” → “실제 운영 가능한 B2B SaaS 콘솔”**로 끌어올리기 위한 최소 단위 설계다.
레이아웃 안정성 확보 후, Job / Billing / Automation이 자연스럽게 얹히는 구조를 목표로 한다.