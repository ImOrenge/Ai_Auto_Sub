import type { SubtitleCue, SubtitleConfig } from "@/lib/jobs/types";

export const LOCAL_RENDER_RESOLUTIONS = [
  "sd",
  "hd",
  "fhd",
  "uhd",
  "720p",
  "1080p",
  "4k",
] as const;

export type LocalRenderResolution = (typeof LOCAL_RENDER_RESOLUTIONS)[number];

export const LOCAL_RENDER_ASPECT_RATIOS = [
  "original",
  "9:16",
  "1:1",
  "16:9",
  "4:5",
] as const;

export type LocalRenderAspectRatio = (typeof LOCAL_RENDER_ASPECT_RATIOS)[number];

export type LocalRenderTask = {
  jobId: string;
  sourceUrl: string;
  cues: SubtitleCue[];
  style: SubtitleConfig;
  resolution?: LocalRenderResolution;
  aspectRatio?: LocalRenderAspectRatio;
  videoFit?: "contain" | "cover";
  watermarkText?: string;
  uploadPath: string;
};
