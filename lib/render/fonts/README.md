# 폰트 설치 가이드

## ✅ 한글 폰트 설치 완료

**Noto Sans KR Variable 폰트가 이미 설치되어 있습니다!**

Railway 환경에서 한글 캡션이 올바르게 렌더링됩니다.

## 설치된 폰트 파일

- ✅ `NotoSansKR-Variable.ttf` - 모든 가중치를 지원하는 Variable 폰트 (10.4MB)
- ✅ `Anton-Regular.ttf` - 영문 폰트

Variable 폰트는 하나의 파일로 Regular, Bold 등 모든 font-weight를 지원합니다.

## 폰트 매핑

다음 폰트 이름들은 자동으로 Noto Sans KR로 매핑됩니다:
- NanumGothic → Noto Sans KR
- NanumBarunGothic → Noto Sans KR
- Malgun Gothic → Noto Sans KR
- Apple SD Gothic Neo → Noto Sans KR
- 맑은 고딕 → Noto Sans KR
- 나눔고딕 → Noto Sans KR

## Railway 배포

Railway에 배포할 때 이 폰트 파일들이 자동으로 포함되어 한글 캡션이 깨지지 않습니다.

## 수동으로 다시 다운로드가 필요한 경우

```powershell
# Windows (PowerShell)
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf" -OutFile "lib/render/fonts/NotoSansKR-Variable.ttf"
```

```bash
# Linux/Mac
curl -L "https://github.com/google/fonts/raw/refs/heads/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf" -o lib/render/fonts/NotoSansKR-Variable.ttf
```

