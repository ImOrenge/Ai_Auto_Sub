# Setup Cloud Build deployment pipeline (PowerShell version)

Write-Host "=== Cloud Build 배포 파이프라인 설정 ===" -ForegroundColor Green

# Project ID 가져오기
$PROJECT_ID = gcloud config get-value project
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"

Write-Host "Project ID: $PROJECT_ID"
Write-Host "Project Number: $PROJECT_NUMBER"

# 1. 필요한 API 활성화
Write-Host "`n1. Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 2. Cloud Source Repository 생성
Write-Host "`n2. Creating Cloud Source Repository..." -ForegroundColor Yellow
$repoExists = gcloud source repos describe ai-sub-auto 2>&1
if ($LASTEXITCODE -ne 0) {
    gcloud source repos create ai-sub-auto
    Write-Host "Repository created: ai-sub-auto" -ForegroundColor Green
} else {
    Write-Host "Repository already exists" -ForegroundColor Cyan
}

# 3. Git remote 설정
Write-Host "`n3. Configuring git remote..." -ForegroundColor Yellow
$remoteExists = git remote get-url google 2>&1
if ($LASTEXITCODE -ne 0) {
    git remote add google "https://source.developers.google.com/p/$PROJECT_ID/r/ai-sub-auto"
    Write-Host "Git remote 'google' added" -ForegroundColor Green
} else {
    Write-Host "Git remote 'google' already exists" -ForegroundColor Cyan
}

# 4. Secrets 생성
Write-Host "`n4. Setting up secrets in Secret Manager..." -ForegroundColor Yellow

if (Test-Path .env.production) {
    $envVars = @{}
    Get-Content .env.production | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            $envVars[$matches[1]] = $matches[2]
        }
    }
    
    # OPENAI_API_KEY
    $secretExists = gcloud secrets describe OPENAI_API_KEY 2>&1
    if ($LASTEXITCODE -ne 0) {
        $envVars['OPENAI_API_KEY'] | gcloud secrets create OPENAI_API_KEY --data-file=-
        Write-Host "Created secret: OPENAI_API_KEY" -ForegroundColor Green
    } else {
        Write-Host "Secret OPENAI_API_KEY already exists" -ForegroundColor Cyan
    }
    
    # SUPABASE_SERVICE_ROLE_KEY
    $secretExists = gcloud secrets describe SUPABASE_SERVICE_ROLE_KEY 2>&1
    if ($LASTEXITCODE -ne 0) {
        $envVars['SUPABASE_SERVICE_ROLE_KEY'] | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=-
        Write-Host "Created secret: SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
    } else {
        Write-Host "Secret SUPABASE_SERVICE_ROLE_KEY already exists" -ForegroundColor Cyan
    }
    
    # YOUTUBE_COOKIE
    $secretExists = gcloud secrets describe YOUTUBE_COOKIE 2>&1
    if ($LASTEXITCODE -ne 0) {
        $envVars['YOUTUBE_COOKIE'] | gcloud secrets create YOUTUBE_COOKIE --data-file=-
        Write-Host "Created secret: YOUTUBE_COOKIE" -ForegroundColor Green
    } else {
        Write-Host "Secret YOUTUBE_COOKIE already exists" -ForegroundColor Cyan
    }
} else {
    Write-Host "WARNING: .env.production not found. Please create secrets manually." -ForegroundColor Red
}

# 5. Cloud Build 서비스 계정에 권한 부여
Write-Host "`n5. Granting permissions to Cloud Build service account..." -ForegroundColor Yellow

@('OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'YOUTUBE_COOKIE') | ForEach-Object {
    gcloud secrets add-iam-policy-binding $_ `
        --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
        --role=roles/secretmanager.secretAccessor `
        --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Permission granted for $_" -ForegroundColor Green
    }
}

# Cloud Run Admin 권한
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
    --role=roles/run.admin --quiet 2>$null

# Service Account User 권한
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
    --role=roles/iam.serviceAccountUser --quiet 2>$null

# 6. Build Trigger 생성
Write-Host "`n6. Creating Cloud Build trigger..." -ForegroundColor Yellow
$triggerExists = gcloud builds triggers describe ai-sub-auto-master-trigger 2>&1
if ($LASTEXITCODE -ne 0) {
    gcloud builds triggers create cloud-source-repositories `
        --repo=ai-sub-auto `
        --branch-pattern='^master$' `
        --build-config=cloudbuild.yaml `
        --description="Deploy ai-sub-auto on master branch push" `
        --name=ai-sub-auto-master-trigger
    Write-Host "Build trigger created" -ForegroundColor Green
} else {
    Write-Host "Build trigger already exists" -ForegroundColor Cyan
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nNext steps:"
Write-Host "1. Commit your changes: git add . && git commit -m 'Deploy'"
Write-Host "2. Push to trigger deployment: git push google master"
Write-Host "3. Monitor build: gcloud builds list --limit=5"
Write-Host "`nOr run manual build with:"
Write-Host "  gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=`$(git rev-parse --short HEAD)"
