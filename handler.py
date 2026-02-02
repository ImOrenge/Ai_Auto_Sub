import runpod
import asyncio

# Runpod Serverless Overview(https://docs.runpod.io/serverless/overview) 스타일의 핸들러 구현

async def handler(event):
    """
    이 함수는 서버리스 엔드포인트에 요청이 올 때마다 실행됩니다.
    'event' 객체에는 요청 ID와 입력 데이터(input)가 포함되어 있습니다.
    """
    # 1. 요청으로부터 입력 데이터 추출
    input_data = event.get("input", {})
    
    # 예: 입력 데이터 처리 로직
    prompt = input_data.get("prompt", "Default prompt")
    
    # 2. 비동기 처리 수행 (AI 모델 추론, API 요청 등)
    # 여기서는 예시로 비동기 sleep을 사용합니다.
    print(f"Processing job {event.get('id')} with prompt: {prompt}")
    await asyncio.sleep(1) 
    
    # 3. 처리 결과 반환
    result = {
        "message": "Success",
        "processed_prompt": f"Processed: {prompt}",
        "status": "COMPLETED"
    }
    
    return result

# 4. 서버리스 워커 시작 (필수)
# SDK는 비동기 함수(async def)를 자동으로 감지하여 적절히 실행합니다.
runpod.serverless.start({"handler": handler})
