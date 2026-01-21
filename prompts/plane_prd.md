📘 AutoSubAI – 가격 플랜 설계 명세서 (v1.2 / Studio 플랜 보류판)
1. 서비스 개요

AutoSubAI는 영상 URL 또는 파일을 입력하면
→ Whisper 기반 STT
→ 한국어 번역
→ 자막 파일(SRT) 생성
→ 자막 삽입 영상(MP4) 생성까지 제공하는 자동화 현지화 SaaS이다.

❗ 원본 영상 다운로드는 제공하지 않는다.

현재는 3단계 플랜: Free → Creator → Pro
Studio는 추후 B2B 수요에 맞춰 재도입한다.

2. 가격 플랜 개요 (Studio 플랜 제거 반영)
플랜명	가격	주요 타깃	제공 범위
Free	₩0	체험자	기본 SRT 생성
Creator	₩9,900	크리에이터	번역 + SRT + 1080p 자막 영상
Pro	₩24,900	편집자	Whisper Large + 4K 자막 영상 + 긴 영상
3. 플랜별 상세 제공 기능
🆓 1) Free Plan — 무료 플랜
🎯 타깃

가볍게 AutoSubAI를 시험해보는 사용자

📌 제공 기능

월 3개 영상 처리

영상 길이 최대 3분

Whisper Small STT

한국어 번역 제공

SRT 파일 다운로드 제공

❌ 제공되지 않는 기능

자막 삽입 영상(MP4) 제공 없음

Instagram/Threads URL 처리 없음

Whisper Medium / Large 없음

팀 기능, API 없음

⭐ 2) Creator Plan — ₩9,900 / 월
🎯 타깃

TikTok / Reels / YouTube Shorts 제작자

쇼폼 중심 크리에이터

📌 제공 기능

월 50개 영상 처리

영상 길이 최대 10분

Whisper Medium STT

한국어 번역(GPT 기반)

결과물:

SRT 파일

자막 삽입 MP4(1080p)

지원 플랫폼:

YouTube

Instagram

Threads

🔧 성능

처리 우선순위: Free 대비 20% 추가

❌ 미제공

Whisper Large

4K 영상 자막

팀 기능

API

💼 3) Pro Plan — ₩24,900 / 월
🎯 타깃

유튜브 편집자

프리랜서 영상 전문가

긴 영상 또는 고품질 번역 필요한 사용자

📌 제공 기능

월 200개 영상 처리

영상 길이 최대 30분

Whisper Large STT

고품질 번역 (GPT-4o tier)

결과물:

SRT 파일

자막 삽입 MP4(1080p + 4K 지원)

플랫폼 전체 지원

처리 우선순위: Creator 대비 50% 빠름

팀원 1명 초대 가능

❌ 미제공

API 제공

병렬 대량 처리 (Studio에서 가능했던 기능이므로 현재 보류)

4. 플랜 비교표 (Studio 삭제 반영)
항목	Free	Creator	Pro
월 처리량	3개	50개	200개
영상 길이	3분	10분	30분
Whisper 모델	Small	Medium	Large
번역	basic	GPT-4o mini	GPT-4o
SRT 파일	✔	✔	✔
자막 MP4	❌	1080p	1080p + 4K
플랫폼	YouTube	+Instagram/Threads	All
속도 우선순위	기본	+20%	+50%
팀 기능	❌	❌	1명
API	❌	❌	❌ (보류)
5. Studio 플랜 보류 결정 이유 및 전략

Studio 플랜은 아래 이유로 보류함:

✔ 초기 개발 범위 축소

병렬 처리

팀 공유 5명

대형 API 트래픽

전용 고객지원
이 요구사항이 MVP에서 부담이 크기 때문.

✔ 초기 타깃은 크리에이터 + 편집자

→ Studio의 고객군(B2B)은 MVP 출시 후 실제 수요 확인 후 확장하는 것이 효율적.

✔ 가격 구조 간소화 → 전환율 증가

3단계 플랜은 사용자에게 선택 피로도가 낮음.

📌 Studio 플랜은 2~3개월 후 재도입 가능

재도입시 추가 기능:

병렬 처리 5개

월 1000개 처리

API 제공

팀 관리 기능(5명 이상)

6. 초과 사용량 정책(동일 유지)

영상 1개 초과 처리: 200원

영상 길이 추가 1분당: 50원

7. 향후 확장 전략
1) Studio 플랜은 시장 반응을 보고 출시

편집자/기업 고객 요청이 충분히 발생할 시 론칭

2) Pro → Studio로 자연스럽게 업셀

Pro 유저 중 월간 처리량 초과가 잦은 고객이 대상

3) API 기반 B2B 확장은 Studio 출시와 함께 진행