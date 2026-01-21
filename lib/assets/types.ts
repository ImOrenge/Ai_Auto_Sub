export type AssetStatus = 'uploading' | 'uploaded' | 'failed' | 'downloading';

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
  meta: AssetMeta;
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
  status?: AssetStatus;
  meta?: AssetMeta;
  errorMessage?: string;
};
