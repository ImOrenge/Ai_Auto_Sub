# Environment Variables Configuration for Cloud Run

# 이 파일은 Cloud Run 배포 시 필요한 환경 변수 설정을 위한 가이드입니다.
# cloudbuild.yaml에서 --set-env-vars 또는 --set-secrets 플래그와 함께 사용됩니다.

## Public Environment Variables (--set-env-vars)
# 민감하지 않은 정보는 직접 설정 가능

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Supabase Public Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jzoklqdfjqeshonnkywr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6b2tscWRmanFlc2hvbm5reXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjI1NTUsImV4cCI6MjA4MDkzODU1NX0.uDu3u90ohyxOXgcv9bOI5MhKuby8tap1z3tM0XxHwoM

# Supabase Table and Bucket Names
SUPABASE_JOBS_TABLE=jobs
SUPABASE_RESULTS_BUCKET=results
SUPABASE_UPLOADS_BUCKET=uploads

# AI Model Configuration
WHISPER_MODEL=whisper-1
TRANSLATION_PROVIDER=openai
TRANSLATION_MODEL=gpt-4o-mini

## Secret Environment Variables (--set-secrets)
# 민감한 정보는 Secret Manager를 통해 관리

# 다음 명령어로 Secret Manager에 저장:
# echo -n "your-api-key" | gcloud secrets create SECRET_NAME --data-file=-

# Required Secrets:
# - OPENAI_API_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - YOUTUBE_COOKIE (optional)

## cloudbuild.yaml 예시

# Deploy step에 다음과 같이 추가:
# 
# - '--set-env-vars'
# - 'NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NEXT_PUBLIC_SUPABASE_URL=https://...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...,SUPABASE_JOBS_TABLE=jobs,SUPABASE_RESULTS_BUCKET=results,SUPABASE_UPLOADS_BUCKET=uploads,WHISPER_MODEL=whisper-1,TRANSLATION_PROVIDER=openai,TRANSLATION_MODEL=gpt-4o-mini'
# - '--set-secrets'
# - 'OPENAI_API_KEY=OPENAI_API_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,YOUTUBE_COOKIE=YOUTUBE_COOKIE:latest'

## 주의사항

# 1. NEXT_PUBLIC_APP_URL은 배포 후 Cloud Run URL로 업데이트 필요
# 2. 공개 저장소에는 민감한 정보를 절대 포함하지 마세요
# 3. Secret Manager 사용 시 Cloud Build 서비스 계정에 접근 권한 필요
