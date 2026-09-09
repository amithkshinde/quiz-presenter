import type { MediaAsset } from '../../types/media';
import { formatBytes, formatDuration } from '../../utils/media';
import { Button } from '../common/Button';
import styles from './media.module.css';

export function MediaPreview({
  asset,
  progress,
  onRemove,
  onReplace,
}: {
  asset: MediaAsset | undefined;
  progress?: number;
  onRemove: () => void;
  onReplace: () => void;
}) {
  if (!asset) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.stateIcon}>⚠</span>
        <span>Media unavailable — it may have been deleted from the library.</span>
        <Button size="sm" variant="secondary" onClick={onReplace}>Replace</Button>
      </div>
    );
  }

  if (asset.status === 'uploading') {
    return (
      <div className={styles.stateBox}>
        <span className={styles.filename}>{asset.name}</span>
        <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress ?? 0}%` }} /></div>
        <span className={styles.stateHint}>Uploading… {progress ?? 0}%</span>
      </div>
    );
  }

  if (asset.status === 'processing') {
    return (
      <div className={styles.stateBox}>
        <span className={styles.filename}>{asset.name}</span>
        <span className={styles.stateHint}>Processing…</span>
      </div>
    );
  }

  if (asset.status === 'failed') {
    return (
      <div className={`${styles.stateBox} ${styles.stateFailed}`}>
        <span className={styles.stateIcon}>✕</span>
        <span>{asset.error ?? 'Upload failed.'}</span>
        <Button size="sm" variant="secondary" onClick={onRemove}>Remove</Button>
      </div>
    );
  }

  return (
    <div className={styles.previewCard}>
      {asset.kind === 'image' && <img className={styles.thumb} src={asset.url} alt={asset.name} />}
      {asset.kind === 'audio' && <audio className={styles.player} controls src={asset.url} />}
      {asset.kind === 'video' && <video className={styles.player} controls src={asset.url} />}
      <div className={styles.previewMeta}>
        <span className={styles.filename}>{asset.name}</span>
        <span className={styles.metaSmall}>{formatBytes(asset.size)}{asset.durationSeconds !== undefined ? ` · ${formatDuration(asset.durationSeconds)}` : ''}</span>
      </div>
      <div className={styles.previewActions}>
        <Button size="sm" variant="secondary" onClick={onReplace}>Replace</Button>
        <Button size="sm" variant="danger" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}
