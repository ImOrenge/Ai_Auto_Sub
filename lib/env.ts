type EnvValue = string | undefined;

function assertEnv(name: string, value: EnvValue) {
  if (!value || value.length === 0) {
    if (typeof window !== 'undefined') {
        // In browser, skip validation for server-side vars (non-NEXT_PUBLIC)
        if (!name.startsWith('NEXT_PUBLIC_')) {
            return undefined as any; 
        }
    }
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

const clientEnv = {
  supabaseUrl: assertEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: assertEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};

const serverEnv = {
  supabaseServiceRoleKey: assertEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  openAiApiKey: assertEnv('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
};

export const env = {
  ...clientEnv,
  ...serverEnv,
  jobsTable: process.env.SUPABASE_JOBS_TABLE ?? 'jobs',
  resultsBucket: process.env.SUPABASE_RESULTS_BUCKET ?? 'results',
  uploadsBucket: process.env.SUPABASE_UPLOADS_BUCKET ?? 'uploads',
  whisperModel: process.env.WHISPER_MODEL ?? 'whisper-1',
  translationProvider: process.env.TRANSLATION_PROVIDER ?? 'openai',
  translationModel: process.env.TRANSLATION_MODEL ?? 'gpt-4o-mini',
  youtubeCookie: process.env.YOUTUBE_COOKIE ?? null,
  ytDlpPath: process.env.YT_DLP_PATH ?? 'yt-dlp',
};
