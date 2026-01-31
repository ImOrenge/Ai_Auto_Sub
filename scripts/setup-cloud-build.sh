#!/bin/bash
# Setup Cloud Build deployment pipeline

set -e

echo "=== Cloud Build 배포 파이프라인 설정 ==="

# Project ID 가져오기
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"

# 1. 필요한 API 활성화
echo ""
echo "1. Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 2. Cloud Source Repository 생성
echo ""
echo "2. Creating Cloud Source Repository..."
if ! gcloud source repos describe ai-sub-auto &>/dev/null; then
  gcloud source repos create ai-sub-auto
  echo "Repository created: ai-sub-auto"
else
  echo "Repository already exists"
fi

# 3. Git remote 설정
echo ""
echo "3. Configuring git remote..."
if ! git remote get-url google &>/dev/null; then
  git remote add google https://source.developers.google.com/p/$PROJECT_ID/r/ai-sub-auto
  echo "Git remote 'google' added"
else
  echo "Git remote 'google' already exists"
fi

# 4. Secrets 생성 (먼저 .env.production에서 값 읽기)
echo ""
echo "4. Setting up secrets in Secret Manager..."

# .env.production 파일 확인
if [ -f .env.production ]; then
  source .env.production
  
  # OPENAI_API_KEY
  if ! gcloud secrets describe OPENAI_API_KEY &>/dev/null; then
    echo -n "$OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=-
    echo "Created secret: OPENAI_API_KEY"
  else
    echo "Secret OPENAI_API_KEY already exists"
  fi
  
  # SUPABASE_SERVICE_ROLE_KEY
  if ! gcloud secrets describe SUPABASE_SERVICE_ROLE_KEY &>/dev/null; then
    echo -n "$SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=-
    echo "Created secret: SUPABASE_SERVICE_ROLE_KEY"
  else
    echo "Secret SUPABASE_SERVICE_ROLE_KEY already exists"
  fi
  
  # YOUTUBE_COOKIE
  if ! gcloud secrets describe YOUTUBE_COOKIE &>/dev/null; then
    echo -n "$YOUTUBE_COOKIE" | gcloud secrets create YOUTUBE_COOKIE --data-file=-
    echo "Created secret: YOUTUBE_COOKIE"
  else
    echo "Secret YOUTUBE_COOKIE already exists"
  fi
else
  echo "WARNING: .env.production not found. Please create secrets manually."
fi

# 5. Cloud Build 서비스 계정에 권한 부여
echo ""
echo "5. Granting permissions to Cloud Build service account..."
for SECRET in OPENAI_API_KEY SUPABASE_SERVICE_ROLE_KEY YOUTUBE_COOKIE; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor \
    --quiet 2>/dev/null || echo "Permission already granted for $SECRET"
done

# Cloud Run Admin 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin \
  --quiet 2>/dev/null || echo "Cloud Run Admin permission already granted"

# Service Account User 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser \
  --quiet 2>/dev/null || echo "Service Account User permission already granted"

# 6. Build Trigger 생성
echo ""
echo "6. Creating Cloud Build trigger..."
if ! gcloud builds triggers describe ai-sub-auto-master-trigger &>/dev/null; then
  gcloud builds triggers create cloud-source-repositories \
    --repo=ai-sub-auto \
    --branch-pattern=^master$ \
    --build-config=cloudbuild.yaml \
    --description="Deploy ai-sub-auto on master branch push" \
    --name=ai-sub-auto-master-trigger
  echo "Build trigger created"
else
  echo "Build trigger already exists"
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Deploy'"
echo "2. Push to trigger deployment: git push google master"
echo "3. Monitor build: gcloud builds list --limit=5"
echo ""
echo "Or run manual build with:"
echo "  gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=\$(git rev-parse --short HEAD)"
