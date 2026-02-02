import runpod
import asyncio

# 비동기 핸들러 함수 정의
async def async_handler(job):
    """
    비동기 방식으로 작업을 처리하는 핸들러입니다.
    I/O 바운드 작업(네트워크 요청, 파일 읽기/쓰기 등)에 적합합니다.
    """
    job_input = job["input"]
    
    # 입력 데이터 추출
    prompt = job_input.get("prompt", "No prompt provided")
    delay = job_input.get("delay", 1)  # 비동기 처리를 확인하기 위한 가상 딜레이
    
    # 비동기 작업 시뮬레이션 (예: API 호출 또는 데이터 처리)
    print(f"Processing job {job['id']} with prompt: {prompt}")
    await asyncio.sleep(delay)
    
    # 결과 반환
    return {
        "status": "success",
        "output": f"Async response for: {prompt}",
        "waited": f"{delay} seconds"
    }

# 서버리스 워커 시작 (비동기 함수를 전달하면 SDK가 알아서 처리합니다)
runpod.serverless.start({"handler": async_handler})
