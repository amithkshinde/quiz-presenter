import type { MediaKind } from '../types/media';

// localStorage has a practical ~5-10MB quota shared across the whole app;
// data-URL media is base64 (~33% larger than the file), so cap well under it.
export const MAX_MEDIA_BYTES = 6 * 1024 * 1024;

export const ACCEPT_FOR: Record<MediaKind, string> = { image: 'image/*', audio: 'audio/*', video: 'video/*' };

export function detectKind(file: File): MediaKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return null;
}

export function readFileAsDataUrl(file: File, onProgress?: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Reads duration off a real media element — best-effort, resolves undefined if it can't be determined quickly. */
export function getMediaDuration(url: string, kind: MediaKind): Promise<number | undefined> {
  if (kind === 'image') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const el = document.createElement(kind === 'audio' ? 'audio' : 'video');
    const done = (value: number | undefined) => {
      el.remove();
      resolve(value);
    };
    el.preload = 'metadata';
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? Math.round(el.duration) : undefined);
    el.onerror = () => done(undefined);
    el.src = url;
    window.setTimeout(() => done(undefined), 4000);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
