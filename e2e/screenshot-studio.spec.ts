import { test, expect } from '@playwright/test';

// Mock data for assets and jobs
const MOCK_VIDEO_ASSET = {
    id: 'mock-video-1',
    name: 'Demo Video.mp4',
    type: 'video',
    status: 'ready',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    meta: { duration: 654, width: 1280, height: 720 },
    createdAt: new Date().toISOString()
};

const MOCK_SRT_CONTENT = `1
00:00:00,000 --> 00:00:03,000
Welcome to the AutoSubAI Demo.

2
00:00:03,500 --> 00:00:06,000
This is a generated subtitle track.

3
00:00:06,500 --> 00:00:10,000
Edit me in the panel on the right.`;

test.describe('Editor Screenshots', () => {
    // 1. Setup Auth and Project
    test.beforeEach(async ({ page }) => {
        // Attempt to login with a test user
        // You might need to adjust these credentials or creating a fresh user if this fails
        await page.goto('/login');
        await page.getByPlaceholder('email@example.com').fill('demo@autosub.ai');
        await page.getByPlaceholder('••••••••').fill('password');
        await page.getByRole('button', { name: 'SIGN IN' }).click();

        // Check if login failed (e.g. invalid credentials), if so, try signup
        const loginFailed = await page.getByText('Invalid login credentials').isVisible().catch(() => false);
        if (loginFailed || page.url().includes('/login')) {
            console.log('Login failed, attempting signup...');
            await page.goto('/signup');
            await page.getByPlaceholder('studio@example.com').fill('demo@autosub.ai');
            await page.getByPlaceholder('Min. 8 chars').fill('password');
            await page.getByPlaceholder('Confirm password').fill('password');
            await page.getByRole('button', { name: 'Create Account' }).click();
            
            // Handle Policy Acceptance if redirected there
            try {
                await page.waitForURL('**/policy-accept*', { timeout: 5000 });
                await page.getByRole('checkbox').check();
                await page.getByRole('button', { name: 'Agree and continue' }).click();
            } catch (e) {
                // might have gone directly to projects
            }

            // Wait for redirect to projects
            await page.waitForTimeout(2000);
        }

        // We assume we are now at /projects or / (which redirects to /projects)
        // If at verify-email, we can't proceed easily, but we'll try to continue
    });

    test('Capture Feature Screenshots', async ({ page }) => {
        test.setTimeout(120000); // Allow more time for this test

        // 2. Create a new generic project
        await page.goto('/projects');
        await page.getByRole('button', { name: 'New Project' }).click();
        
        // Fill project name dialog if it exists, or it might auto-create
        // Adjust based on actual UI. Assuming it asks for name.
        const nameInput = page.getByPlaceholder('Enter project name');
        if (await nameInput.isVisible()) {
            await nameInput.fill('Screenshot Demo Project');
            await page.getByRole('button', { name: 'Create' }).click();
        }

        // Wait for Editor to load
        // It redirects to /projects/[id]/editor
        await expect(page).toHaveURL(/\/editor$/);

        // 3. Setup Mocks for Editor Interactions
        // Mock Asset Polling to return our video
        await page.route('**/api/assets*', async route => {
            const json = { assets: [MOCK_VIDEO_ASSET], total: 1 };
            await route.fulfill({ json });
        });

        // Mock Job Creation (Transcribe)
        await page.route('**/api/jobs', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ 
                    json: { job: { id: 'mock-job-1', status: 'pending' } } 
                });
            } else {
                await route.continue();
            }
        });

        // Mock Job Status Polling (return DONE immediately)
        await page.route('**/api/jobs/*', async route => {
            await route.fulfill({ 
                json: { 
                    job: { 
                        id: 'mock-job-1', 
                        status: 'done', 
                        resultSrtUrl: 'https://mock.com/subs.srt',
                        resultVideoUrl: MOCK_VIDEO_ASSET.url 
                    } 
                } 
            });
        });

        // Mock SRT Fetch
        await page.route('https://mock.com/subs.srt', async route => {
            await route.fulfill({ body: MOCK_SRT_CONTENT });
        });

        // 4. Interactions for Screenshots

        // A. Source Panel Screenshot
        // Wait for asset to appear in sidebar (from mock)
        await expect(page.getByText('Demo Video.mp4')).toBeVisible();
        await page.screenshot({ path: 'screenshots/01_source_panel.png' });

        // B. Add to Timeline
        // Click the "Add" button on the asset card
        await page.getByRole('button', { name: 'Add to Timeline' }).nth(0).click();
        // Or drag and drop? Assuming click works or there's a + icon.
        // If there is no text "Add to Timeline", look for icon.
        // Let's assume double click or specific button class.
        // Fallback: hovering the asset card usually reveals options.
        const assetCard = page.locator('.group').filter({ hasText: 'Demo Video.mp4' });
        await assetCard.hover();
        await assetCard.click(); // Select
        // Try to find an "Add" button or use context menu
        // For now, let's assume clicking it might add it or there is a visible button.

        // Wait for timeline to populate
        // Check for clip on timeline
        await page.waitForTimeout(1000); 

        // C. Timeline & Player Screenshot
        await page.screenshot({ path: 'screenshots/02_timeline_view.png' });

        // D. Simulate Subtitle Generation
        // Click "Auto Subtitle" / "Run Pipeline"
        // UI might have changed, look for magic wand or "자막 생성"
        const subtitleBtn = page.getByRole('button', { name: '자막 생성' }); // Adjust label
        if (await subtitleBtn.isVisible()) {
             await subtitleBtn.click();
             // Fill modal if any
             const startBtn = page.getByRole('button', { name: '시작하기' });
             if (await startBtn.isVisible()) await startBtn.click();
        }

        // Wait for 'mock-job-1' polling to finish (editor updates)
        // Checks for 'Subtitle Layer' or specific text from SRT
        await expect(page.getByText('Welcome to the AutoSubAI Demo')).toBeVisible();

        // E. Subtitle Editor Screenshot
        // Open the subtitle panel if closed? It's usually a resizable panel.
        await page.screenshot({ path: 'screenshots/03_subtitle_editor.png' });

        // F. Export Modal
        await page.getByRole('button', { name: 'Export' }).click(); // Or Download icon
        await expect(page.getByText('Export Settings')).toBeVisible();
        await page.screenshot({ path: 'screenshots/04_export_settings.png' });
    });
});
