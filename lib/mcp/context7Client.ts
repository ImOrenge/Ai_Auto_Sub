import {
  applySubtitlesToVideo,
  type CaptionedVideoResult,
  callWhisper,
  downloadAudioFromUrl,
  generateSrt,
  type DownloadedAudio,
  type SubtitleResult,
  translateSegments,
  type TranscriptionResult,
  type TranslationResult,
  type UploadResult,
  uploadToStorage,
} from "@/lib/jobs/operations";

type ExtractAudioInput = { url: string };
type SpeechToTextInput = { audio: DownloadedAudio; sourceLocale?: string };
type TranslateTextInput = { transcription: TranscriptionResult; targetLocale: string };
type GenerateCaptionsInput = { translation: TranslationResult; format?: "srt" };
type UploadCaptionInput = { subtitles: SubtitleResult };
type ApplyCaptionsInput = { videoUrl: string; subtitles: SubtitleResult };

type Context7ToolSpec = {
  "context7.extract-audio": {
    input: ExtractAudioInput;
    output: DownloadedAudio;
  };
  "context7.speech-to-text": {
    input: SpeechToTextInput;
    output: TranscriptionResult;
  };
  "context7.translate-text": {
    input: TranslateTextInput;
    output: TranslationResult;
  };
  "context7.generate-captions": {
    input: GenerateCaptionsInput;
    output: SubtitleResult;
  };
  "context7.upload-captions": {
    input: UploadCaptionInput;
    output: UploadResult;
  };
  "context7.apply-captions": {
    input: ApplyCaptionsInput;
    output: CaptionedVideoResult;
  };
};

export type Context7ToolName = keyof Context7ToolSpec;
type Context7ToolInput<TTool extends Context7ToolName> = Context7ToolSpec[TTool]["input"];
type Context7ToolOutput<TTool extends Context7ToolName> = Context7ToolSpec[TTool]["output"];

export type Context7Invocation<TTool extends Context7ToolName> = {
  tool: TTool;
  input: Context7ToolInput<TTool>;
  output: Context7ToolOutput<TTool>;
  startedAt: number;
  finishedAt: number;
};

type ToolHandler<TTool extends Context7ToolName> = (
  payload: Context7ToolInput<TTool>,
) => Promise<Context7ToolOutput<TTool>>;

type Context7ToolHandlers = {
  [TTool in Context7ToolName]: ToolHandler<TTool>;
};

export class Context7McpClient {
  private history: Context7Invocation<Context7ToolName>[] = [];

  constructor(private readonly handlers: Context7ToolHandlers) {}

  async invoke<TTool extends Context7ToolName>(
    tool: TTool,
    payload: Context7ToolInput<TTool>,
  ): Promise<Context7Invocation<TTool>> {
    const handler = this.handlers[tool];
    if (!handler) {
      throw new Error(`Context7 MCP tool ${tool} is not registered`);
    }
    const startedAt = Date.now();
    const output = await handler(payload);
    const finishedAt = Date.now();
    const record: Context7Invocation<TTool> = {
      tool,
      input: payload,
      output,
      startedAt,
      finishedAt,
    };
    this.history.push(record as Context7Invocation<Context7ToolName>);
    return record;
  }

  getInvocations() {
    return [...this.history];
  }
}

export function createDefaultContext7Client(): Context7McpClient {
  const handlers: Context7ToolHandlers = {
    "context7.extract-audio": async ({ url }) => downloadAudioFromUrl(url),
    "context7.speech-to-text": async ({ audio }) => callWhisper(audio),
    "context7.translate-text": async ({ transcription, targetLocale }) =>
      translateSegments(transcription, targetLocale),
    "context7.generate-captions": async ({ translation }) => generateSrt(translation),
    "context7.upload-captions": async ({ subtitles }) => uploadToStorage(subtitles),
    "context7.apply-captions": async ({ videoUrl, subtitles }) => {
      const media = await downloadAudioFromUrl(videoUrl);
      return applySubtitlesToVideo(media, subtitles);
    },
  };

  return new Context7McpClient(handlers);
}
