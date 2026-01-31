import { z } from 'zod';

export const SubtitleConfigSchema = z.object({
  fontName: z.string().optional(),
  fontSize: z.number().optional(),
  fontColor: z.string().optional(),
  outlineColor: z.string().optional(),
  outlineSize: z.number().optional(),
  backgroundColor: z.string().optional(),
  backgroundRadius: z.number().optional(),
  verticalPosition: z.number().optional(),
  y: z.number().optional(),
  opacity: z.number().optional(),
  position: z.enum(['top', 'center', 'bottom']).optional(),
  style: z.enum(['default', 'karaoke', 'pop', 'minimal']).optional(),
  animation: z.object({
    fadeIn: z.number().optional(),
    fadeOut: z.number().optional()
  }).optional(),
  displayMode: z.enum(['standard', 'single-word']).optional(),
  videoFit: z.enum(['contain', 'cover']).optional(),
  videoAspectRatio: z.enum(['original', '9:16', '1:1', '16:9']).optional(),
});

export const CreateJobSchema = z.object({
  url: z.string().url().optional(),
  assetId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  autoStart: z.boolean().optional().default(true),
  subtitleConfig: SubtitleConfigSchema.optional(),
  sourceType: z.enum(['youtube', 'upload', 'sequence', 'url']).optional(),
}).refine(data => {
  return !!(data.url || data.assetId);
}, {
  message: "Either 'url' or 'assetId' is required",
  path: ["url"]
});

export const GetJobsQuerySchema = z.object({
  counts: z.enum(['true', 'false']).optional(),
  status: z.enum(['pending', 'processing', 'done', 'error', 'canceled']).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(), // Expect ISO string
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  projectId: z.string().uuid().optional(),
  queueId: z.string().uuid().optional(),
});
