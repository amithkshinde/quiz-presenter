import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useMediaStore } from '../../state/mediaStore';
import type { MediaKind } from '../../types/media';
import { ACCEPT_FOR, detectKind, formatBytes, MAX_MEDIA_BYTES } from '../../utils/media';
import { MediaPreview } from './MediaPreview';
import styles from './media.module.css';

const PROMPT: Record<MediaKind, string> = {
  image: 'Drag and drop an image here',
  audio: 'Drag and drop an audio file here',
  video: 'Drag and drop a video file here',
};

/** Reusable upload+preview for one media reference. Kind-agnostic beyond the `kind` prop — usable for question media, round intros, quiz covers, etc. */
export function MediaUploader({ kind, assetId, onChange }: { kind: MediaKind; assetId: string | undefined; onChange: (assetId: string | undefined) => void }) {
  const uploadFile = useMediaStore((s) => s.uploadFile);
  const asset = useMediaStore((s) => (assetId ? s.assets.find((a) => a.id === assetId) : undefined));
  const progress = useMediaStore((s) => (assetId ? s.progress[assetId] : undefined));
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError('');
    const detected = detectKind(file);
    if (detected && detected !== kind) {
      setLocalError(`That's ${detected} — this field needs ${kind}.`);
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setLocalError(`File is too large (max ${formatBytes(MAX_MEDIA_BYTES)}).`);
      return;
    }
    const id = uploadFile(file);
    onChange(id);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  // Detaching a reference never deletes the shared asset — only the Media
  // Library's own delete action does that, with a reference-count check.
  function handleRemove() {
    onChange(undefined);
  }

  function handleReplace() {
    inputRef.current?.click();
  }

  if (assetId) {
    return (
      <div>
        <MediaPreview asset={asset} progress={progress} onRemove={handleRemove} onReplace={handleReplace} />
        <input ref={inputRef} type="file" accept={ACCEPT_FOR[kind]} className={styles.hiddenInput} onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <span className={styles.dropzoneIcon}>{kind === 'image' ? '🖼' : kind === 'audio' ? '♪' : '▶'}</span>
      <span>{PROMPT[kind]}</span>
      <span className={styles.stateHint}>or click to choose a file · max {formatBytes(MAX_MEDIA_BYTES)}</span>
      {localError && <span className={styles.errorText}>{localError}</span>}
      <input ref={inputRef} type="file" accept={ACCEPT_FOR[kind]} className={styles.hiddenInput} onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}
