import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaAsset } from '../types/media';
import { makeId } from '../utils/id';
import { detectKind, formatBytes, getMediaDuration, MAX_MEDIA_BYTES, readFileAsDataUrl } from '../utils/media';

interface MediaStore {
  assets: MediaAsset[];
  /** Non-persisted — transient upload progress, keyed by asset id. */
  progress: Record<string, number>;

  /** Creates a placeholder asset immediately (status 'uploading') and returns its id; the read/decode happens async. */
  uploadFile: (file: File) => string;
  updateAsset: (id: string, patch: Partial<MediaAsset>) => void;
  removeAsset: (id: string) => void;
  renameAsset: (id: string, name: string) => void;
  getAsset: (id: string) => MediaAsset | undefined;
}

export const useMediaStore = create<MediaStore>()(
  persist(
    (set, get) => ({
      assets: [],
      progress: {},

      updateAsset: (id, patch) => set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      uploadFile: (file) => {
        const id = makeId('media');
        const kind = detectKind(file);
        const asset: MediaAsset = {
          id,
          kind: kind ?? 'image',
          name: file.name,
          url: '',
          size: file.size,
          status: 'uploading',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ assets: [asset, ...s.assets], progress: { ...s.progress, [id]: 0 } }));

        (async () => {
          if (!kind) {
            get().updateAsset(id, { status: 'failed', error: 'Unsupported file type' });
            return;
          }
          if (file.size > MAX_MEDIA_BYTES) {
            get().updateAsset(id, { status: 'failed', error: `File is too large (max ${formatBytes(MAX_MEDIA_BYTES)})` });
            return;
          }
          try {
            const url = await readFileAsDataUrl(file, (pct) => set((s) => ({ progress: { ...s.progress, [id]: pct } })));
            get().updateAsset(id, { url, status: 'processing' });
            const durationSeconds = await getMediaDuration(url, kind);
            get().updateAsset(id, { status: 'ready', durationSeconds });
          } catch {
            get().updateAsset(id, { status: 'failed', error: 'Upload failed — please try again.' });
          } finally {
            set((s) => {
              const rest = { ...s.progress };
              delete rest[id];
              return { progress: rest };
            });
          }
        })();

        return id;
      },

      removeAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),
      renameAsset: (id, name) => set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, name } : a)) })),
      getAsset: (id) => get().assets.find((a) => a.id === id),
    }),
    { name: 'quiz-presenter/media', partialize: (s) => ({ assets: s.assets }) }
  )
);
