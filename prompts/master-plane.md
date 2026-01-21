You are an expert full-stack engineer.

Target stack:
- Next.js 14 (App Router, TypeScript)
- REST API using Next.js Route Handlers (`app/api/**/route.ts`)
- Supabase (Postgres, Auth, Storage)
- Deployment on Vercel
- OpenAI Whisper API (no separate Python worker)
- ffmpeg-optional: first focus on generating SRT subtitles, then optionally burning subtitles into video if feasible.

You are building an MVP for a service called **"AutoSubAI"**:

> Users paste a video URL (YouTube / Instagram / etc.).  
> The backend downloads the video audio, sends it to Whisper for STT (English),  
> translates it to Korean, generates SRT subtitles, optionally burns subtitles back into the video,  
> and saves results (SRT file + processed video URL) to Supabase Storage.  
> Job progress & results are stored in Supabase (Postgres).

---

# 1. Project Goals

Generate a **ready-to-run Next.js + Supabase project scaffold**:

- Frontend: Next.js pages and UI
- Backend: Route Handlers as REST API
- Supabase integration: DB schema + client/server helpers
- Job processing flow: URL → Job row → STT → translation → SRT → Storage → Job updated

Design it to be deployable on Vercel and Supabase.

---

# 2. Data Model (Supabase)

Create a `jobs` table in Supabase with the following structure:

```sql
id            uuid (primary key, default uuid_generate_v4())
user_id       uuid (nullable, for future auth integration)
url           text NOT NULL

status        text NOT NULL DEFAULT 'pending'
-- 'pending' | 'downloading' | 'processing' | 'stt' | 'translating' | 'subtitle' | 'done' | 'error'

step          text NULL
progress      numeric NULL  -- 0.0 ~ 1.0

result_srt_url     text NULL
result_video_url   text NULL
error_message      text NULL

created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()

Add a trigger or application-level logic that updates updated_at on change.
3. Architecture

Use only Next.js + Supabase + OpenAI APIs (no separate Python service).

High-level flow:

    User opens / page and enters a video URL.

    POST /api/jobs is called:

        Insert a row into jobs table with status = 'pending'.

        Option A (simpler MVP): Immediately process the job synchronously in the same request (best for short videos).

        Option B (more scalable): Only create the job, and processing will be done by a separate API/cron (for now, choose Option A for MVP).

    The processing pipeline for a job:

        Detect video URL type (YouTube, generic, etc.).

        Use a Node-friendly downloader (e.g. ytdl-core for YouTube or other libs) to fetch audio only.

        Send audio to OpenAI Whisper API for transcription (English).

        Translate English segments to Korean using OpenAI GPT model.

        Generate SRT file content from the segments.

        Upload SRT file to Supabase Storage.

        (Optional) If burning subtitles into video is implemented, create a processed video and upload it too.

        Update jobs row: status = 'done', fill result_srt_url and optionally result_video_url.

    The UI:

        /jobs/[id] page polls GET /api/jobs/[id] to show status+progress.

        When status is 'done', show:

            Download SRT button

            Video preview if result_video_url is available.

4. REST API Endpoints (Next.js Route Handlers)

Implement these route handlers:
4.1 POST /api/jobs

    Body: { "url": string }

    Behavior:

        Validate URL.

        Insert new row into jobs in Supabase (status = 'pending').

        Immediately call an internal function processJob(jobId: string, url: string) that:

            updates status/step/progress

            runs full pipeline (download → STT → translate → SRT → upload → update row).

        Return JSON: { jobId: "<uuid>" }.

    Note: for now, you may perform processing synchronously in the same route handler. Make sure to structure the code so that processJob is a reusable function (for future migration to background jobs / cron).

4.2 GET /api/jobs/[id]

    Returns the job row (status, step, progress, result URLs).

    JSON response should match:

type JobResponse = {
  id: string;
  url: string;
  status: string;
  step: string | null;
  progress: number | null;
  result_srt_url?: string | null;
  result_video_url?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

5. Next.js Frontend

Use TypeScript and App Router.
5.1 Pages
/app/layout.tsx

    Basic layout with title "AutoSubAI".

    Dark theme with minimal Tailwind styling.

/app/page.tsx

    Renders a URL input form (component: JobForm).

    On submit: calls POST /api/jobs via fetch.

    If job created, show link: "/jobs/{jobId}".

/app/jobs/[id]/page.tsx

    Client component.

    Poll GET /api/jobs/[id] every 3–5 seconds.

    Display:

        Status, step, progress.

        If finished and result_srt_url exists → show "Download SRT" button.

        If result_video_url exists → show <video src={result_video_url} controls />.

5.2 Components
components/JobForm.tsx

    Controlled input for URL.

    Submit button.

    Error handling.

    After success, show link to job page.

6. Supabase Integration
6.1 Client helpers

Create:
/lib/supabaseClient.ts

    For client-side usage (if needed later).

    Initializes Supabase browser client using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

/lib/supabaseServer.ts

    For server-side (API route handlers).

    Uses createClient with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

    This client is used to:

        Insert/select jobs rows.

        Upload files to Supabase Storage (e.g. bucket results).

7. Processing Functions (Server-side utilities)

Create a directory /lib/jobs/ with:

    createJob.ts – helper to insert a job row.

    getJob.ts – helper to retrieve a job row.

    updateJobStatus.ts – helper to update status/step/progress/result URLs.

Create /lib/pipeline/ with:

    processJob.ts – main orchestrator:

export async function processJob(jobId: string, url: string) {
  // 1) update job to "downloading"
  // 2) download audio from URL
  // 3) call Whisper for STT
  // 4) translate segments to Korean
  // 5) generate SRT text
  // 6) upload SRT to Supabase Storage
  // 7) (optional) process video with subtitles
  // 8) update job with 'done' + URLs
}

    downloadAudioFromUrl.ts – (for MVP, implement YouTube support only, using ytdl-core or similar).

    callWhisper.ts – calls OpenAI Whisper API with the audio file.

    translateSegments.ts – calls OpenAI GPT model to translate English text to Korean.

    generateSrt.ts – builds SRT from segments.

    uploadToStorage.ts – uploads generated SRT/video to Supabase Storage.

8. Deliverables – Generate Complete Code Files

Generate the following files with realistic, compilable code:
8.1 Next.js

    package.json with dependencies:

        "next": "14.x"

        "react", "react-dom", "typescript"

        "@supabase/supabase-js"

        "ytdl-core" (for YouTube audio download)

        "openai" (for Whisper + GPT)

        "tailwindcss", "postcss", "autoprefixer"

    /app/layout.tsx

    /app/page.tsx

    /app/jobs/[id]/page.tsx

    /app/api/jobs/route.ts

    /app/api/jobs/[id]/route.ts

    /components/JobForm.tsx

    /lib/supabaseClient.ts

    /lib/supabaseServer.ts

    /lib/jobs/createJob.ts

    /lib/jobs/getJob.ts

    /lib/jobs/updateJobStatus.ts

    /lib/pipeline/processJob.ts

    /lib/pipeline/downloadAudioFromUrl.ts

    /lib/pipeline/callWhisper.ts

    /lib/pipeline/translateSegments.ts

    /lib/pipeline/generateSrt.ts

    /lib/pipeline/uploadToStorage.ts

    Tailwind config + globals.css basic setup.

8.2 Environment Variables

Document required env vars:

    NEXT_PUBLIC_SUPABASE_URL

    NEXT_PUBLIC_SUPABASE_ANON_KEY

    SUPABASE_URL

    SUPABASE_SERVICE_ROLE_KEY

    OPENAI_API_KEY

Provide example .env.local snippet.
9. Output Format

Return everything as organized markdown:

    Project structure tree.

    SQL for Supabase jobs table.

    All code files with proper TypeScript types.

    Setup instructions:

        How to create Supabase project and jobs table.

        How to set environment variables.

        How to run npm install, npm run dev.

    Short note on limitations:

        For now, only YouTube URLs are supported.

        Long videos may time out on Vercel — advise future migration to background jobs / edge functions.

Make the code realistic and consistent. Avoid pseudocode. The goal is that a developer can paste your answer into a new repository and get a working MVP of AutoSubAI on Next.js + Supabase + Vercel.