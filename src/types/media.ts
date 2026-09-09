export type MediaKind = 'image' | 'audio' | 'video';
export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  name: string;
  url: string;
  size: number;
  durationSeconds?: number;
  status: MediaStatus;
  error?: string;
  createdAt: string;
}
