export type AssetStatus = 'uploading' | 'uploaded' | 'failed' | 'downloading' | 'processing';
export type TranscriptionStatus = 'idle' | 'transcribing' | 'completed' | 'failed';

export type AssetMeta = {
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  [key: string]: any;
};

export type AssetRecord = {
  id: string;
  userId: string;
  projectId?: string | null;
  filename: string;
  storageKey: string | null;
  sourceUrl?: string | null;
  status: AssetStatus;
  transcriptionStatus: TranscriptionStatus;
  meta: AssetMeta;
  captions?: any; // format: CaptionData
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAssetParams = {
  userId: string;
  projectId?: string;
  filename: string;
  storageKey?: string | null;
  sourceUrl?: string | null;
  status?: AssetStatus;
  meta?: AssetMeta;
};

export type UpdateAssetParams = {
  filename?: string;
  status?: AssetStatus;
  transcriptionStatus?: TranscriptionStatus;
  meta?: AssetMeta;
  captions?: any;
  errorMessage?: string;
  storageKey?: string;
};
