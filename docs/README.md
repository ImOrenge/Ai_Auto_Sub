# 🎉 Google Cloud Build 설정 완료!

Google Cloud Run 배포를 위한 모든 설정이 완료되었습니다.

## ✅ 생성된 파일

### 핵심 설정 파일
- ✅ [`cloudbuild.yaml`](../cloudbuild.yaml) - Cloud Build 구성 (32GB RAM, 8 CPU, Docker 캐싱)
- ✅ [`.gcloudignore`](../.gcloudignore) - 빌드 속도 최적화

### 문서
- 📘 [`QUICKSTART.md`](./QUICKSTART.md) - **5-15분 배포 가이드 (여기서 시작!)**
- 📗 [`deployment.md`](./deployment.md) - 상세 배포 가이드
- 📙 [`environment-variables.md`](./environment-variables.md) - 환경 변수 설정 가이드

### 자동화 스크립트
- 🪟 [`scripts/setup-gcloud.ps1`](../scripts/setup-gcloud.ps1) - Windows 초기 설정
- 🐧 [`scripts/setup-gcloud.sh`](../scripts/setup-gcloud.sh) - Linux/Mac 초기 설정

## 🚀 빠른 시작

### 1단계: 초기 설정 (5분)

**Windows**:
```powershell
.\scripts\setup-gcloud.ps1
```

**Mac/Linux**:
```bash
chmod +x scripts/setup-gcloud.sh
./scripts/setup-gcloud.sh
```

### 2단계: GitHub 연동 (3분)

[Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)에서 트리거 생성

### 3단계: 배포! (10-15분)

```bash
git push origin main
```

또는 수동 배포:
```bash
gcloud builds submit --config cloudbuild.yaml
```

## 📊 Cloud Run 사양

| 항목 | 설정 |
|------|------|
| 리전 | asia-northeast3 (서울) |
| 메모리 | 32GB |
| CPU | 8 cores |
| 타임아웃 | 60분 |
| 자동 스케일링 | 0-10 인스턴스 |

## 🔐 보안

- ✅ Secret Manager로 API 키 관리
- ✅ 환경 변수 자동 설정
- ✅ 최소 권한 원칙 적용

## 📚 다음 단계

상세한 가이드는 [`QUICKSTART.md`](./QUICKSTART.md)를 참고하세요!

---

**문제가 있나요?**
- [`deployment.md`](./deployment.md)의 문제 해결 섹션 참고
- Cloud Build 로그: `gcloud builds list --limit 5`
- Cloud Run 로그: `gcloud run services logs read ai-sub-auto --region asia-northeast3`
