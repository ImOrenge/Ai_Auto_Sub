import { expect, test } from "@playwright/test";

test.describe("VideoInputPipeline", () => {
  test("validates inputs and shows success state for URL mode", async ({ page }) => {
    await page.goto("/");

    const pipelineForm = page.locator("form").filter({ hasText: "비디오 입력" }).first();
    await pipelineForm.evaluate((form) => form.setAttribute("novalidate", "true"));

    // Ensure we're in URL mode (default)
    const urlTab = pipelineForm.getByRole("button", { name: "URL 입력" });
    await urlTab.click();

    const submitButton = pipelineForm.getByRole("button", { name: "자막 생성 시작하기" });
    const urlInput = pipelineForm.getByPlaceholder("https://youtube.com/watch?v=...");

    // Test empty URL validation
    await submitButton.click();
    await expect(page.getByText("영상이나 음원이 포함된 URL을 입력해주세요.")).toBeVisible();

    // Test invalid URL validation
    await urlInput.fill("notaurl");
    await submitButton.click();
    await expect(
      page.getByText("유효한 URL 형식이 아닙니다. https://example.com/video.mp4 형태로 입력해주세요."),
    ).toBeVisible();

    // Mock API response
    const resolvedJobId = "job_e2e_123";
    await page.route("**/api/jobs", async (route, request) => {
      const payload = (await request.postDataJSON()) as { url: string; autoStart: boolean };
      expect.soft(payload.url).toContain("storage.googleapis.com");
      expect(payload.autoStart).toBe(true);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          job: {
            id: resolvedJobId,
            url: payload.url,
            status: "pending",
            step: null,
          },
        }),
      });
    });

    // Use sample button
    const sampleButton = pipelineForm.getByRole("button", { name: "Big Buck Bunny" });
    await sampleButton.click();

    // Verify preview video appears
    const previewVideo = pipelineForm.locator("video");
    await expect(previewVideo).toBeVisible();

    await submitButton.click();

    await expect(
      page.getByText("작업이 생성되었습니다. 진행 상황을 확인해보세요!"),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "작업 상세 보기" })).toHaveAttribute(
      "href",
      `/jobs/${resolvedJobId}`,
    );
    await expect(urlInput).toHaveValue("");
  });

  test("switches between URL and upload modes", async ({ page }) => {
    await page.goto("/");

    const pipelineForm = page.locator("form").filter({ hasText: "비디오 입력" }).first();

    // Default is URL mode
    const urlInput = pipelineForm.getByPlaceholder("https://youtube.com/watch?v=...");
    await expect(urlInput).toBeVisible();

    // Switch to upload mode
    const uploadTab = pipelineForm.getByRole("button", { name: "파일 업로드" });
    await uploadTab.click();

    // URL input should be hidden, file input label should be visible
    await expect(urlInput).not.toBeVisible();
    await expect(pipelineForm.getByText("여기를 눌러 파일을 선택하세요")).toBeVisible();

    // Switch back to URL mode
    const urlTab = pipelineForm.getByRole("button", { name: "URL 입력" });
    await urlTab.click();
    await expect(urlInput).toBeVisible();
  });
});
