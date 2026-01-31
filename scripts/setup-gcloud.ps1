# Google Cloud Run 초기 설정 스크립트 (PowerShell)
# Windows 사용자를 위한 스크립트

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId
)

# 색상 함수
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 프로젝트 ID 입력
if (-not $ProjectId) {
    Write-ColorOutput "Google Cloud 프로젝트 ID를 입력하세요:" "Green"
    $ProjectId = Read-Host "Project ID"
}

if ([string]::IsNullOrEmpty($ProjectId)) {
    Write-ColorOutput "프로젝트 ID를 입력해주세요." "Red"
    exit 1
}

Write-ColorOutput "프로젝트 설정: $ProjectId" "Green"
gcloud config set project $ProjectId

# 필요한 API 활성화
Write-ColorOutput "필요한 API를 활성화합니다..." "Yellow"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Secret Manager에 환경 변수 저장
Write-ColorOutput "Secret Manager에 환경 변수를 저장합니다..." "Yellow"

Write-ColorOutput "OpenAI API Key를 입력하세요:" "Green"
$OPENAI_API_KEY = Read-Host "OPENAI_API_KEY" -AsSecureString
$OPENAI_API_KEY_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($OPENAI_API_KEY))

if (-not [string]::IsNullOrEmpty($OPENAI_API_KEY_Plain)) {
    $OPENAI_API_KEY_Plain | gcloud secrets create OPENAI_API_KEY --data-file=- 2>$null
    if ($LASTEXITCODE -ne 0) {
        $OPENAI_API_KEY_Plain | gcloud secrets versions add OPENAI_API_KEY --data-file=-
    }
    Write-ColorOutput "✓ OPENAI_API_KEY 저장 완료" "Green"
}

Write-ColorOutput "Supabase Service Role Key를 입력하세요:" "Green"
$SUPABASE_KEY = Read-Host "SUPABASE_SERVICE_ROLE_KEY" -AsSecureString
$SUPABASE_KEY_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SUPABASE_KEY))

if (-not [string]::IsNullOrEmpty($SUPABASE_KEY_Plain)) {
    $SUPABASE_KEY_Plain | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=- 2>$null
    if ($LASTEXITCODE -ne 0) {
        $SUPABASE_KEY_Plain | gcloud secrets versions add SUPABASE_SERVICE_ROLE_KEY --data-file=-
    }
    Write-ColorOutput "✓ SUPABASE_SERVICE_ROLE_KEY 저장 완료" "Green"
}

Write-ColorOutput "YouTube Cookie를 입력하세요 (선택사항, 엔터로 스킵):" "Green"
$YOUTUBE_COOKIE = Read-Host "YOUTUBE_COOKIE"

if (-not [string]::IsNullOrEmpty($YOUTUBE_COOKIE)) {
    $YOUTUBE_COOKIE | gcloud secrets create YOUTUBE_COOKIE --data-file=- 2>$null
    if ($LASTEXITCODE -ne 0) {
        $YOUTUBE_COOKIE | gcloud secrets versions add YOUTUBE_COOKIE --data-file=-
    }
    Write-ColorOutput "✓ YOUTUBE_COOKIE 저장 완료" "Green"
}

# Cloud Build 서비스 계정 권한 설정
Write-ColorOutput "Cloud Build 서비스 계정 권한을 설정합니다..." "Yellow"
$PROJECT_NUMBER = gcloud projects describe $ProjectId --format='value(projectNumber)'

# Secret Manager 접근 권한
$secrets = @("OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "YOUTUBE_COOKIE")
foreach ($secret in $secrets) {
    gcloud secrets add-iam-policy-binding $secret `
        --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com `
        --role=roles/secretmanager.secretAccessor 2>$null
}

# Cloud Run 배포 권한
gcloud projects add-iam-policy-binding $ProjectId `
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com `
    --role=roles/run.admin

# Service Account 사용 권한
gcloud iam service-accounts add-iam-policy-binding `
    "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" `
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com `
    --role=roles/iam.serviceAccountUser

Write-ColorOutput "✓ 모든 설정이 완료되었습니다!" "Green"
Write-ColorOutput "다음 단계:" "Yellow"
Write-ColorOutput "1. GitHub 저장소와 Cloud Build 연동"
Write-ColorOutput "2. Cloud Build 트리거 생성"
Write-ColorOutput "3. Git push로 자동 배포 테스트"
Write-ColorOutput ""
Write-ColorOutput "자세한 내용은 docs/deployment.md를 참고하세요."
