# Cloud Run 소스 기반 배포 가이드

Docker 빌드 문제를 우회하고 더 간단하게 배포하는 방법입니다.

## 방법 1: Cloud Run 소스 기반 배포 (권장)

Dockerfile 없이 소스 코드를 직접 배포합니다. Cloud Build가 자동으로 Google Cloud Buildpacks를 사용하여 이미지를 생성합니다.

### 1단계: 필요한 파일 확인

`.gcloudignore` 파일을 생성하여 불필요한 파일 제외:

```bash
# .gcloudignore
node_modules/
.next/
.git/
*.log
.env.local
.env.development
```

### 2단계: Cloud Run에 직접 배포

```bash
gcloud run deploy ai-sub-auto \
  --source . \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 32Gi \
  --cpu 8 \
  --timeout 3600 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" \
  --update-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,YOUTUBE_COOKIE=YOUTUBE_COOKIE:latest"
```

이 명령은:
- 소스 코드를 Cloud Build로 전송
- Node.js Buildpack이 자동으로 `npm install` 및 `npm run build` 실행
- 이미지를 Container Registry에 저장
- Cloud Run 서비스를 생성/업데이트

### 장점
- ✅ Dockerfile 관리 불필요
- ✅ Buildpack이 자동으로 최적화된 이미지 생성
- ✅ npm 의존성 문제 자동 해결
- ✅ 더 빠른 빌드 시간
- ✅ 보안 패치 자동 적용

## 방법 2: Docker 빌드 문제 해결 (고급)

계속 Dockerfile을 사용하고 싶다면:

### package.json에 engines 명시

```json
{
  "engines": {
    "node": "20.x",
    "npm": "10.x"
  }
}
```

### package-lock.json 재생성

```bash
rm package-lock.json
rm -rf node_modules
npm install
```

### Dockerfile 간소화

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Run
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
```

## 배포 후 확인

```bash
# 서비스 URL 확인
gcloud run services describe ai-sub-auto --region asia-northeast3 --format='value(status.url)'

# 로그 확인
gcloud run services logs read ai-sub-auto --region asia-northeast3
```

## 환경변수 업데이트

배포 후 NEXT_PUBLIC_APP_URL 업데이트:

```bash
SERVICE_URL=$(gcloud run services describe ai-sub-auto --region asia-northeast3 --format='value(status.url)')

gcloud run services update ai-sub-auto \
  --region asia-northeast3 \
  --update-env-vars "NEXT_PUBLIC_APP_URL=$SERVICE_URL"
```
