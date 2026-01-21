import { expect, test } from "@playwright/test";

test.describe("Job pipeline", () => {
  test("runs upload → STT → translate → SRT → caption flow", async ({ page }) => {
    const jobId = "job_pipeline_e2e";
    const createdAt = new Date("2024-01-01T00:00:00.000Z").toISOString();
    const resultSrtUrl = "https://cdn.example.com/jobs/job_pipeline_e2e.srt";
    const resultVideoUrl = "https://cdn.example.com/jobs/job_pipeline_e2e.mp4";
    const baseJob = {
      id: jobId,
      userId: null,
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      errorMessage: null,
      resultSrtUrl: null,
      resultVideoUrl: null,
      createdAt,
      updatedAt: createdAt,
    };
    const jobSnapshots = [
      {
        ...baseJob,
        status: "downloading",
        step: "download",
        progress: 0.1,
      },
      {
        ...baseJob,
        status: "stt",
        step: "transcribe",
        progress: 0.4,
      },
      {
        ...baseJob,
        status: "translating",
        step: "translate",
        progress: 0.7,
      },
      {
        ...baseJob,
        status: "subtitle",
        step: "subtitle",
        progress: 0.9,
      },
      {
        ...baseJob,
        status: "done",
        step: "deliver",
        progress: 1,
        resultSrtUrl,
        resultVideoUrl,
        updatedAt: new Date("2024-01-01T00:05:00.000Z").toISOString(),
      },
    ];
    const srtPreview = `1
00:00:00,000 --> 00:00:02,000
Pipeline 단계 1

2
00:00:02,500 --> 00:00:05,000
Pipeline 단계 2`;

    await page.route("**/api/jobs", async (route, request) => {
      const payload = (await request.postDataJSON()) as { url: string; autoStart: boolean };
      expect.soft(payload.url).toContain("storage.googleapis.com");
      expect(payload.autoStart).toBe(true);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          job: {
            id: jobId,
            url: payload.url,
            status: "pending",
            step: null,
          },
        }),
      });
    });

    let jobRequestCount = 0;
    await page.route(`**/api/jobs/${jobId}`, async (route) => {
      const snapshot = jobSnapshots[Math.min(jobRequestCount, jobSnapshots.length - 1)];
      jobRequestCount += 1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ job: snapshot }),
      });
    });

    await page.route(resultSrtUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: srtPreview,
      });
    });

    await page.route(resultVideoUrl, async (route) => {
      await route.fulfill({
        status: 204,
        contentType: "video/mp4",
      });
    });

    await page.addInitScript(() => {
      const originalSetInterval = window.setInterval;
      window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        if (timeout === 3000) {
          return 0 as unknown as number;
        }
        return originalSetInterval(handler, timeout, ...args);
      }) as typeof window.setInterval;
    });

    await page.goto("/");

    // Use the new VideoInputPipeline component
    const pipelineForm = page.locator("form").filter({ hasText: "비디오 입력" }).first();
    
    // Ensure URL tab is selected
    const urlTab = pipelineForm.getByRole("button", { name: "URL 입력" });
    await urlTab.click();
    
    const urlInput = pipelineForm.getByPlaceholder("https://youtube.com/watch?v=...");
    await urlInput.fill("https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4");

    await pipelineForm.getByRole("button", { name: "자막 생성 시작하기" }).click();
    await expect(page.getByText("작업이 생성되었습니다. 진행 상황을 확인해보세요!")).toBeVisible();

    await page.getByRole("link", { name: "작업 상세 보기" }).click();

    await expect(page).toHaveURL(`/jobs/${jobId}`);
    const refreshButton = page.getByRole("button", { name: "새로 고침" });
    const statusPanel = page.locator("section").filter({ hasText: "현재 상태" }).first();
    const expectStatus = async (label: string) => {
      await expect(statusPanel).toContainText(label);
    };

    await expectStatus("다운로드");

    await refreshButton.click();
    await expectStatus("STT");

    await refreshButton.click();
    await expectStatus("번역");

    await refreshButton.click();
    await expectStatus("자막 생성");

    await refreshButton.click();
    await expectStatus("완료");

    const downloadButton = page.getByRole("link", { name: "SRT 다운로드" });
    await expect(downloadButton).toHaveAttribute("href", resultSrtUrl);

    const previewBlock = page.locator("pre").filter({ hasText: "Pipeline 단계 1" });
    await expect(previewBlock).toContainText("00:00:00,000 --> 00:00:02,000");
    await expect(previewBlock).toContainText("Pipeline 단계 2");

    const videoPlayer = page.locator("video[controls]");
    await expect(videoPlayer).toHaveAttribute("src", resultVideoUrl);
  });
});
