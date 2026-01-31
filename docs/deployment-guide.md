# Cloud Build Trigger 설정 가이드

## 1. Git Repository 연결

먼저 Google Cloud Source Repositories에 코드를 푸시하거나, GitHub/GitLab과 연결해야 합니다.

### Option A: Cloud Source Repository 사용

```bash
# 1. Cloud Source Repository 생성
gcloud source repos create ai-sub-auto

# 2. Git remote 추가
git remote add google https://source.developers.google.com/p/YOUR_PROJECT_ID/r/ai-sub-auto

# 3. 코드 푸시
git push google master
```

### Option B: GitHub Repository 연결

Google Cloud Console에서 수동으로 GitHub 연결:
1. Cloud Build > Triggers > Connect Repository
2. GitHub 선택 및 인증
3. Repository 선택

## 2. Build Trigger 생성

```bash
# Cloud Build Trigger 생성 (master branch push 시 자동 배포)
gcloud builds triggers create cloud-source-repositories \
  --repo=ai-sub-auto \
  --branch-pattern=^master$ \
  --build-config=cloudbuild.yaml \
  --description="Deploy ai-sub-auto on master branch push"
```

또는 GitHub 사용 시:

```bash
gcloud builds triggers create github \
  --repo-name=ai-sub-auto \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern=^master$ \
  --build-config=cloudbuild.yaml \
  --description="Deploy ai-sub-auto on master branch push"
```

## 3. Secrets 설정 (필수)

Cloud Build가 환경변수를 사용할 수 있도록 Secret Manager에 등록:

```bash
# Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com

# Secrets 생성
echo -n "YOUR_OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=-
echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=-
echo -n "YOUR_YOUTUBE_COOKIE" | gcloud secrets create YOUTUBE_COOKIE --data-file=-

# Cloud Build 서비스 계정에 권한 부여
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding SUPABASE_SERVICE_ROLE_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding YOUTUBE_COOKIE \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

## 4. 배포 방법

이제 코드를 커밋하고 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "Deploy to production"
git push google master  # 또는 git push origin master (GitHub 사용 시)
```

## 5. 빌드 상태 확인

```bash
# 최근 빌드 목록 확인
gcloud builds list --limit=5

# 특정 빌드 로그 확인
gcloud builds log BUILD_ID --stream
```

---

# Railway 배포 가이드 (추천)

Railway는 복잡한 설정 없이 GitHub 저장소 연결만으로 배포할 수 있는 가장 간편한 방법입니다.

## 1. 프로젝트 생성
1. [Railway.app](https://railway.app/)에 로그인합니다.
2. **New Project** > **Deploy from GitHub repo**를 선택합니다.
3. `ai-sub-auto` 저장소를 선택합니다.

## 2. 환경 변수 설정
Settings > Variables 탭에서 다음 변수들을 추가합니다:

| Key | Value (예시) | 비고 |
|-----|-------------|------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase 서비스 롤 키 |
| `YOUTUBE_COOKIE` | `[{"domain":".youtube.com",...}]` | 유튜브 쿠키 JSON |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase 익명 키 |
| `NODE_ENV` | `production` | 운영 환경 설정 |
| `PORT` | `8080` | 서버 포트 |

## 3. 리소스 설정 (중요)
1. Settings > General 탭으로 이동합니다.
2. **Resource Limits** 섹션에서 CPU와 Memory를 조정합니다.
   - 비디오 렌더링을 위해 최소 **2 vCPU / 4GB RAM** 이상을 권장합니다.
   - 부하가 많을 경우 Cloud Run 사양인 **8 vCPU / 32GB RAM**까지 늘릴 수 있습니다.

## 4. 배포
저장소의 `master` 브랜치에 코드를 푸시하면 Railway가 자동으로 `railpack.json`을 사용하여 빌드 및 배포를 진행합니다.

> [!TIP]
> **Railpack 사용 중**: 이 프로젝트는 최신 **Railpack** 빌더를 사용합니다. `railpack.json`에 비디오 렌더링에 필요한 `ffmpeg` 및 `canvas` 관련 시스템 라이브러리 설정이 포함되어 있으므로 별도의 추가 작업 없이 모든 기능을 사용할 수 있습니다.

---

## 수동 빌드 (임시 테스트용)

Trigger 없이 수동으로 빌드하려면:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)
```
