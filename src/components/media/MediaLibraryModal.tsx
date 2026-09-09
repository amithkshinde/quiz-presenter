import { useMemo, useState } from 'react';
import { useMediaStore } from '../../state/mediaStore';
import { useQuizStore } from '../../state/quizStore';
import type { MediaAsset, MediaKind } from '../../types/media';
import { formatBytes, formatDuration } from '../../utils/media';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './media.module.css';

const TABS: { key: MediaKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
];

/** Reusable library browser. In picker mode (`onUse` provided) each item offers "Use"; always offers Preview/Rename/Delete. */
export function MediaLibraryModal({ filterKind, onUse, onClose }: { filterKind?: MediaKind; onUse?: (assetId: string) => void; onClose: () => void }) {
  const assets = useMediaStore((s) => s.assets);
  const removeAsset = useMediaStore((s) => s.removeAsset);
  const renameAsset = useMediaStore((s) => s.renameAsset);
  const quizzes = useQuizStore((s) => s.quizzes);

  const [tab, setTab] = useState<MediaKind | 'all'>(filterKind ?? 'all');
  const [query, setQuery] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [previewing, setPreviewing] = useState<MediaAsset | null>(null);

  function usageCount(assetId: string) {
    return quizzes.reduce((n, q) => n + q.questions.filter((qq) => qq.mediaId === assetId).length, 0);
  }

  const items = useMemo(
    () =>
      assets
        .filter((a) => tab === 'all' || a.kind === tab)
        .filter((a) => a.name.toLowerCase().includes(query.toLowerCase())),
    [assets, tab, query]
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.libraryModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Media Library</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.libraryToolbar}>
          <div className={styles.libraryTabs}>
            {TABS.map((t) => (
              <button key={t.key} className={`${styles.libraryTab} ${tab === t.key ? styles.libraryTabActive : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <input className={styles.searchInput} placeholder="Search media…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className={styles.libraryGrid}>
          {items.length === 0 ? (
            <p className={styles.emptyLibrary}>No media found.</p>
          ) : (
            items.map((a) => {
              const uses = usageCount(a.id);
              return (
                <div key={a.id} className={styles.libraryCard}>
                  <div className={styles.libraryThumb} onClick={() => setPreviewing(a)}>
                    {a.kind === 'image' && a.status === 'ready' ? <img src={a.url} alt={a.name} /> : <span>{a.kind === 'audio' ? '♪' : a.kind === 'video' ? '▶' : '🖼'}</span>}
                  </div>
                  {renaming === a.id ? (
                    <input
                      autoFocus
                      className={styles.searchInput}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => { renameAsset(a.id, renameValue.trim() || a.name); setRenaming(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                  ) : (
                    <span className={styles.filename} title={a.name}>{a.name}</span>
                  )}
                  <span className={styles.metaSmall}>
                    {a.kind} · {formatBytes(a.size)}{a.durationSeconds !== undefined ? ` · ${formatDuration(a.durationSeconds)}` : ''} · {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                  <div className={styles.libraryActions}>
                    {onUse && a.status === 'ready' && <Button size="sm" variant="primary" onClick={() => { onUse(a.id); onClose(); }}>Use</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setPreviewing(a)}>Preview</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRenaming(a.id); setRenameValue(a.name); }}>Rename</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>Delete</Button>
                  </div>
                  {uses > 0 && <span className={styles.usageBadge}>Used in {uses} question{uses > 1 ? 's' : ''}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {previewing && (
        <div className={styles.modalOverlay} onClick={() => setPreviewing(null)}>
          <div className={styles.previewOverlayCard} onClick={(e) => e.stopPropagation()}>
            {previewing.kind === 'image' && <img className={styles.thumb} src={previewing.url} alt={previewing.name} />}
            {previewing.kind === 'audio' && <audio className={styles.player} controls src={previewing.url} />}
            {previewing.kind === 'video' && <video className={styles.player} controls autoPlay src={previewing.url} />}
            <Button size="sm" onClick={() => setPreviewing(null)}>Close</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this media?"
        description={
          deleteTarget && usageCount(deleteTarget.id) > 0
            ? `This media is currently used in ${usageCount(deleteTarget.id)} question${usageCount(deleteTarget.id) > 1 ? 's' : ''}. Deleting it will leave those questions without media.`
            : "This can't be undone."
        }
        confirmLabel="Delete anyway"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeAsset(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
