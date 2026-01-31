# Google Cloud Run 배포 가이드

이 문서는 GitHub 연동을 통한 자동 배포 설정 방법을 안내합니다.

## 📋 사전 요구사항

- Google Cloud Platform 프로젝트
- GitHub 저장소
- gcloud CLI 설치 및 인증

## 🚀 초기 설정

### 1. Google Cloud 프로젝트 설정

```bash
# 프로젝트 ID 설정
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# 필요한 API 활성화
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Secret Manager에 환경 변수 저장

민감한 API 키들은 Secret Manager에 저장합니다:

```bash
# OpenAI API Key
echo -n "your-openai-api-key" | gcloud secrets create OPENAI_API_KEY --data-file=-

# Supabase Service Role Key
echo -n "your-supabase-service-role-key" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=-

# YouTube Cookie (선택사항)
echo -n "your-youtube-cookie" | gcloud secrets create YOUTUBE_COOKIE --data-file=-

# Cloud Build가 Secret Manager에 접근할 수 있도록 권한 부여
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding SUPABASE_SERVICE_ROLE_KEY \
  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 3. Cloud Build 서비스 계정 권한 설정

```bash
# Cloud Run 배포 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

# Service Account 사용 권한
gcloud iam service-accounts add-iam-policy-binding \
  $PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

## 🔗 GitHub 연동 설정

### 방법 1: Google Cloud Console (권장)

1. [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers) 페이지로 이동
2. "트리거 만들기" 클릭
3. 다음 설정 입력:
   - **이름**: `deploy-ai-sub-auto`
   - **리전**: `asia-northeast3` (서울)
   - **이벤트**: Push to a branch
   - **소스**: GitHub 저장소 연결
   - **브랜치**: `^main$` (또는 원하는 브랜치)
   - **구성**: Cloud Build 구성 파일 (yaml 또는 json)
   - **위치**: `cloudbuild.yaml`
   - **대체 변수** (선택사항):
     - `_REGION`: `asia-northeast3`

4. "만들기" 클릭

### 방법 2: gcloud CLI

```bash
# GitHub 앱 설치 (처음 한 번만)
gcloud builds connections create github "github-connection" \
  --region=asia-northeast3

# GitHub 저장소 연결
gcloud builds repositories create "your-repo-name" \
  --remote-uri=https://github.com/your-username/ai-sub-auto.git \
  --connection=github-connection \
  --region=asia-northeast3

# 트리거 생성
gcloud builds triggers create github \
  --name="deploy-ai-sub-auto" \
  --region=asia-northeast3 \
  --repo-name="your-repo-name" \
  --repo-owner="your-username" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

## 🔧 환경 변수 설정

### cloudbuild.yaml에 환경 변수 추가

`cloudbuild.yaml` 파일의 Cloud Run 배포 단계에서 필요한 환경 변수를 추가합니다:

```yaml
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
    - 'run'
    - 'deploy'
    - 'ai-sub-auto'
    # ... 기타 설정 ...
    - '--set-env-vars'
    - 'NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NEXT_PUBLIC_SUPABASE_URL=https://jzoklqdfjqeshonnkywr.supabase.co,NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key,SUPABASE_JOBS_TABLE=jobs,SUPABASE_RESULTS_BUCKET=results,SUPABASE_UPLOADS_BUCKET=uploads,WHISPER_MODEL=whisper-1,TRANSLATION_PROVIDER=openai,TRANSLATION_MODEL=gpt-4o-mini'
    - '--set-secrets'
    - 'OPENAI_API_KEY=OPENAI_API_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,YOUTUBE_COOKIE=YOUTUBE_COOKIE:latest'
```

> **⚠️ 주의**: 공개 저장소의 경우 민감한 정보를 `cloudbuild.yaml`에 직접 포함하지 마세요. Secret Manager를 사용하세요.

## 📦 수동 배포

GitHub 연동 없이 로컬에서 직접 배포:

```bash
# Cloud Build로 빌드 및 배포
gcloud builds submit --config cloudbuild.yaml

# 또는 간단한 배포 (Dockerfile만 사용)
gcloud builds submit --tag gcr.io/$PROJECT_ID/ai-sub-auto
gcloud run deploy ai-sub-auto \
  --image gcr.io/$PROJECT_ID/ai-sub-auto \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 32Gi \
  --cpu 8 \
  --timeout 3600
```

## 🔍 배포 확인

```bash
# Cloud Run 서비스 상태 확인
gcloud run services describe ai-sub-auto --region asia-northeast3

# 서비스 URL 확인
gcloud run services describe ai-sub-auto \
  --region asia-northeast3 \
  --format='value(status.url)'

# 로그 확인
gcloud run services logs read ai-sub-auto --region asia-northeast3 --limit 50
```

## 🎯 배포 후 설정

### 1. 커스텀 도메인 설정 (선택사항)

```bash
gcloud run domain-mappings create \
  --service ai-sub-auto \
  --domain your-domain.com \
  --region asia-northeast3
```

### 2. NEXT_PUBLIC_APP_URL 업데이트

배포된 Cloud Run URL을 확인한 후 환경 변수를 업데이트:

```bash
SERVICE_URL=$(gcloud run services describe ai-sub-auto \
  --region asia-northeast3 \
  --format='value(status.url)')

gcloud run services update ai-sub-auto \
  --region asia-northeast3 \
  --set-env-vars NEXT_PUBLIC_APP_URL=$SERVICE_URL
```

## 📊 리소스 사양

현재 설정된 Cloud Run 리소스:

- **메모리**: 32GB
- **CPU**: 8 cores
- **타임아웃**: 3600초 (60분)
- **최대 인스턴스**: 10
- **최소 인스턴스**: 0 (자동 스케일링)
- **리전**: asia-northeast3 (서울)

## 💰 비용 최적화 팁

1. **Cold Start 개선**: 최소 인스턴스를 1로 설정 (비용 증가)
   ```bash
   --min-instances 1
   ```

2. **리소스 조정**: 작업 부하에 따라 메모리/CPU 조정
   - 일반 작업: 4GB RAM, 2 CPU
   - 비디오 렌더링: 32GB RAM, 8 CPU

3. **타임아웃 설정**: 불필요하게 긴 타임아웃 방지

## 🐛 문제 해결

### 빌드 실패 시

```bash
# 최근 빌드 로그 확인
gcloud builds list --limit 5
gcloud builds log <BUILD_ID>
```

### 배포 실패 시

```bash
# Cloud Run 서비스 로그 확인
gcloud run services logs read ai-sub-auto --region asia-northeast3 --limit 100

# 서비스 상세 정보 확인
gcloud run services describe ai-sub-auto --region asia-northeast3
```

### 일반적인 오류

1. **권한 오류**: Cloud Build 서비스 계정 권한 확인
2. **메모리 부족**: Cloud Run 메모리 제한 증가
3. **빌드 타임아웃**: `cloudbuild.yaml`의 timeout 값 증가

## 📝 추가 리소스

- [Cloud Build 문서](https://cloud.google.com/build/docs)
- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [Secret Manager 문서](https://cloud.google.com/secret-manager/docs)
- [GitHub 연동 가이드](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github)
