#!/bin/bash

# Google Cloud Run 초기 설정 스크립트
# 이 스크립트는 Cloud Run 배포에 필요한 초기 설정을 자동화합니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 ID 입력
echo -e "${GREEN}Google Cloud 프로젝트 ID를 입력하세요:${NC}"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}프로젝트 ID를 입력해주세요.${NC}"
    exit 1
fi

echo -e "${GREEN}프로젝트 설정: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# 필요한 API 활성화
echo -e "${YELLOW}필요한 API를 활성화합니다...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Secret Manager에 환경 변수 저장
echo -e "${YELLOW}Secret Manager에 환경 변수를 저장합니다...${NC}"

echo -e "${GREEN}OpenAI API Key를 입력하세요:${NC}"
read -sp "OPENAI_API_KEY: " OPENAI_API_KEY
echo
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo -n "$OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=- 2>/dev/null || \
    echo -n "$OPENAI_API_KEY" | gcloud secrets versions add OPENAI_API_KEY --data-file=-
    echo -e "${GREEN}✓ OPENAI_API_KEY 저장 완료${NC}"
fi

echo -e "${GREEN}Supabase Service Role Key를 입력하세요:${NC}"
read -sp "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
echo
if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -n "$SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=- 2>/dev/null || \
    echo -n "$SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets versions add SUPABASE_SERVICE_ROLE_KEY --data-file=-
    echo -e "${GREEN}✓ SUPABASE_SERVICE_ROLE_KEY 저장 완료${NC}"
fi

echo -e "${GREEN}YouTube Cookie를 입력하세요 (선택사항, 엔터로 스킵):${NC}"
read -p "YOUTUBE_COOKIE: " YOUTUBE_COOKIE
if [ ! -z "$YOUTUBE_COOKIE" ]; then
    echo -n "$YOUTUBE_COOKIE" | gcloud secrets create YOUTUBE_COOKIE --data-file=- 2>/dev/null || \
    echo -n "$YOUTUBE_COOKIE" | gcloud secrets versions add YOUTUBE_COOKIE --data-file=-
    echo -e "${GREEN}✓ YOUTUBE_COOKIE 저장 완료${NC}"
fi

# Cloud Build 서비스 계정 권한 설정
echo -e "${YELLOW}Cloud Build 서비스 계정 권한을 설정합니다...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Secret Manager 접근 권한
for SECRET in OPENAI_API_KEY SUPABASE_SERVICE_ROLE_KEY YOUTUBE_COOKIE; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
        --role=roles/secretmanager.secretAccessor 2>/dev/null || true
done

# Cloud Run 배포 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
    --role=roles/run.admin

# Service Account 사용 권한
gcloud iam service-accounts add-iam-policy-binding \
    $PROJECT_NUMBER-compute@developer.gserviceaccount.com \
    --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
    --role=roles/iam.serviceAccountUser

echo -e "${GREEN}✓ 모든 설정이 완료되었습니다!${NC}"
echo -e "${YELLOW}다음 단계:${NC}"
echo -e "1. GitHub 저장소와 Cloud Build 연동"
echo -e "2. Cloud Build 트리거 생성"
echo -e "3. Git push로 자동 배포 테스트"
echo ""
echo -e "자세한 내용은 docs/deployment.md를 참고하세요."
