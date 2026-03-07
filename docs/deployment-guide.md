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

---

## 수동 빌드 (임시 테스트용)

Trigger 없이 수동으로 빌드하려면:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)
```
