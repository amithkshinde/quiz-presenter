import { useState } from 'react';
import type { MediaKind } from '../../types/media';
import { Button } from '../common/Button';
import { MediaUploader } from './MediaUploader';
import { MediaLibraryModal } from './MediaLibraryModal';
import styles from './media.module.css';

/** Generic "Add Media" entry point: Upload New or Choose from Library. Reusable beyond questions (round intros, quiz covers, etc). */
export function AddMediaControl({ kind, mediaId, onChange }: { kind: MediaKind; mediaId: string | undefined; onChange: (mediaId: string | undefined) => void }) {
  const [choosing, setChoosing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  if (mediaId || choosing) {
    return (
      <div>
        {!mediaId && (
          <div className={styles.pickerToggle}>
            <Button size="sm" variant="ghost" onClick={() => setLibraryOpen(true)}>Choose from Media Library</Button>
            <Button size="sm" variant="ghost" onClick={() => setChoosing(false)}>Cancel</Button>
          </div>
        )}
        <MediaUploader kind={kind} assetId={mediaId} onChange={onChange} />
        {mediaId && (
          <div className={styles.pickerToggle} style={{ marginTop: 6 }}>
            <Button size="sm" variant="ghost" onClick={() => setLibraryOpen(true)}>Choose from Media Library instead</Button>
          </div>
        )}
        {libraryOpen && (
          <MediaLibraryModal
            filterKind={kind}
            onUse={(id) => onChange(id)}
            onClose={() => setLibraryOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.pickerToggle}>
      <Button size="sm" variant="secondary" onClick={() => setChoosing(true)}>+ Add Media</Button>
      <Button size="sm" variant="ghost" onClick={() => setLibraryOpen(true)}>Choose from Media Library</Button>
      {libraryOpen && (
        <MediaLibraryModal
          filterKind={kind}
          onUse={(id) => onChange(id)}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}
