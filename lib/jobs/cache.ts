import { createHash } from "node:crypto";
import type { SequenceClip, SequenceData, VideoCut } from "@/lib/jobs/types";

const HASH_LENGTH = 12;

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, HASH_LENGTH);
}

export function buildTrimmedAudioCacheKey(
  sourceFingerprint: string,
  cuts: VideoCut[],
): { hash: string; storageKey: string } {
  const sortedCuts = [...cuts].sort((a, b) => a.start - b.start);
  const hash = hashPayload({ sourceFingerprint, cuts: sortedCuts });
  return {
    hash,
    storageKey: `cache/trimmed/${hash}.mp3`,
  };
}

function selectSequenceClips(sequence: SequenceClip[] | SequenceData): SequenceClip[] {
  if (Array.isArray(sequence)) {
    return sequence;
  }

  const activeLayer =
    sequence.layers.find((layer) => layer.id === sequence.activeLayerId) ?? sequence.layers[0];
  return activeLayer?.clips ?? [];
}

export function buildSequenceCacheKey(
  sequence: SequenceClip[] | SequenceData,
): { hash: string; storageKey: string } {
  const clips = selectSequenceClips(sequence)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const payload = clips.map((clip) => ({
    assetId: clip.assetId,
    startTime: clip.startTime,
    endTime: clip.endTime,
    order: clip.order,
    speed: clip.speed ?? 1,
  }));
  const hash = hashPayload(payload);
  return {
    hash,
    storageKey: `cache/sequence/${hash}.mp4`,
  };
}
