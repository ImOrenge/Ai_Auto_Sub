# 🚀 Google Cloud Run 빠른 시작 가이드

이 가이드는 AI Sub Auto를 Google Cloud Run에 배포하는 가장 빠른 방법을 안내합니다.

## 📋 준비사항

- [ ] Google Cloud Platform 계정
- [ ] gcloud CLI 설치 ([다운로드](https://cloud.google.com/sdk/docs/install))
- [ ] GitHub 계정
- [ ] OpenAI API Key
- [ ] Supabase 프로젝트

## 🎯 Step 1: Google Cloud 초기 설정 (5분)

### Windows PowerShell
```powershell
cd c:\ai-sub-auto
.\scripts\setup-gcloud.ps1
```

### Mac/Linux Bash
```bash
cd /path/to/ai-sub-auto
chmod +x scripts/setup-gcloud.sh
./scripts/setup-gcloud.sh
```

스크립트가 다음을 자동으로 설정합니다:
- ✅ 필요한 Google Cloud API 활성화
- ✅ Secret Manager에 API 키 저장
- ✅ Cloud Build 권한 설정

## 🔗 Step 2: GitHub 연동 (3분)

### 옵션 A: Google Cloud Console (권장)

1. [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers) 열기
2. **"트리거 만들기"** 클릭
3. 설정 입력:
   - 리전: `asia-northeast3`
   - 소스: GitHub 저장소 연결
   - 브랜치: `^main$`
   - 구성: `cloudbuild.yaml`
4. **"만들기"** 클릭

### 옵션 B: gcloud CLI

```bash
# 1. GitHub 연결 생성
gcloud builds connections create github "github-connection" \
  --region=asia-northeast3

# 2. 저장소 연결
gcloud builds repositories create "ai-sub-auto" \
  --remote-uri=https://github.com/YOUR-USERNAME/ai-sub-auto.git \
  --connection=github-connection \
  --region=asia-northeast3

# 3. 트리거 생성
gcloud builds triggers create github \
  --name="deploy-ai-sub-auto" \
  --region=asia-northeast3 \
  --repo-name="ai-sub-auto" \
  --repo-owner="YOUR-USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

## 🎬 Step 3: 첫 배포 (10-15분)

### 자동 배포 (GitHub 연동 완료 후)

```bash
git add .
git commit -m "Setup Cloud Build configuration"
git push origin main
```

### 수동 배포 (테스트용)

```bash
gcloud builds submit --config cloudbuild.yaml
```

## ✅ Step 4: 배포 확인

```bash
# 1. 서비스 URL 확인
gcloud run services describe ai-sub-auto \
  --region asia-northeast3 \
  --format='value(status.url)'

# 2. 서비스 상태 확인
gcloud run services describe ai-sub-auto --region asia-northeast3

# 3. 로그 확인
gcloud run services logs read ai-sub-auto --region asia-northeast3
```

## 🔧 Step 5: 환경 변수 업데이트

배포 완료 후 NEXT_PUBLIC_APP_URL을 실제 Cloud Run URL로 업데이트:

```bash
# Cloud Run URL 가져오기
SERVICE_URL=$(gcloud run services describe ai-sub-auto \
  --region asia-northeast3 \
  --format='value(status.url)')

# 환경 변수 업데이트
gcloud run services update ai-sub-auto \
  --region asia-northeast3 \
  --update-env-vars NEXT_PUBLIC_APP_URL=$SERVICE_URL
```

## 🎉 완료!

이제 GitHub에 push할 때마다 자동으로 Cloud Run에 배포됩니다!

## 📊 현재 설정

- **리전**: asia-northeast3 (서울)
- **메모리**: 32GB
- **CPU**: 8 cores
- **타임아웃**: 60분
- **자동 스케일링**: 0-10 인스턴스

## 🐛 문제 해결

### 빌드 실패
```bash
# 빌드 로그 확인
gcloud builds list --limit 5
gcloud builds log <BUILD_ID>
```

### 배포 실패
```bash
# Cloud Run 로그 확인
gcloud run services logs read ai-sub-auto --region asia-northeast3 --limit 100
```

### Secret Manager 오류
```bash
# Secret 목록 확인
gcloud secrets list

# Secret 권한 확인
gcloud secrets get-iam-policy OPENAI_API_KEY
```

## 📚 자세한 문서

- [전체 배포 가이드](./deployment.md)
- [환경 변수 설정](./environment-variables.md)

## 💡 추가 팁

### 비용 절감
```bash
# 최소 인스턴스를 0으로 유지 (무료 티어 활용)
--min-instances 0
```

### 성능 향상
```bash
# Cold start 제거 (비용 증가)
--min-instances 1
```

### 커스텀 도메인 설정
```bash
gcloud run domain-mappings create \
  --service ai-sub-auto \
  --domain your-domain.com \
  --region asia-northeast3
```
