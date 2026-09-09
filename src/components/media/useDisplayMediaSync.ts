import { useEffect, useState, type RefObject } from 'react';
import type { MediaPlaybackState } from '../../types/session';

const DRIFT_TOLERANCE_S = 1.5;

/**
 * Drives a read-only <audio>/<video> element from the presenter's synced
 * playback state. The presenter is the sole source of truth; this only ever
 * reacts to `media`, never writes back to the session.
 */
export function useDisplayMediaSync(ref: RefObject<HTMLMediaElement | null>, media: MediaPlaybackState) {
  const [blockedByAutoplay, setBlockedByAutoplay] = useState(false);

  // Explicit commands — status changes and every seek/restart — always apply immediately.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (media.status === 'playing') {
      if (Math.abs(el.currentTime - media.position) > DRIFT_TOLERANCE_S) el.currentTime = media.position;
      el.play().then(() => setBlockedByAutoplay(false)).catch(() => setBlockedByAutoplay(true));
    } else if (media.status === 'ended') {
      el.pause();
    } else {
      el.pause();
      if (Math.abs(el.currentTime - media.position) > 0.35) el.currentTime = media.position;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.status, media.seekToken]);

  // Periodic drift correction while already playing (position updates ~1x/sec from the presenter).
  useEffect(() => {
    const el = ref.current;
    if (!el || media.status !== 'playing') return;
    if (Math.abs(el.currentTime - media.position) > DRIFT_TOLERANCE_S) el.currentTime = media.position;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.position]);

  function resumeAfterGesture() {
    ref.current?.play().then(() => setBlockedByAutoplay(false)).catch(() => {});
  }

  return { blockedByAutoplay, resumeAfterGesture };
}
