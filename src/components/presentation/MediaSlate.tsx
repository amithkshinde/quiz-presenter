import { useMemo, useRef, useState } from 'react';
import type { Question } from '../../types/quiz';
import type { MediaPlaybackState } from '../../types/session';
import { useResolvedMediaUrl } from '../media/useResolvedMediaUrl';
import { useDisplayMediaSync } from '../media/useDisplayMediaSync';
import styles from './MediaSlate.module.css';

/** Participant-facing media — presenter-driven, minimal/no transport controls of its own. */
export function MediaSlate({ question, media }: { question: Question; media: MediaPlaybackState }) {
  const mediaUrl = useResolvedMediaUrl(question);
  const isVideo = question.type === 'video';
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { blockedByAutoplay, resumeAfterGesture } = useDisplayMediaSync(isVideo ? videoRef : audioRef, media);
  const [localTime, setLocalTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  if (media.skipped) return null;

  if (!mediaUrl || media.status === 'error') {
    return (
      <div className={styles.fallback}>
        <span className={styles.fallbackIcon}>{isVideo ? '🎬' : '♪'}</span>
        <span>Media unavailable</span>
      </div>
    );
  }

  const ratio = localDuration > 0 ? Math.min(1, localTime / localDuration) : 0;

  return (
    <div className={styles.wrap}>
      {isVideo ? (
        <video
          ref={videoRef}
          className={styles.video}
          src={mediaUrl}
          playsInline
          onTimeUpdate={(e) => setLocalTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setLocalDuration(e.currentTarget.duration || 0)}
        />
      ) : (
        <audio
          ref={audioRef}
          src={mediaUrl}
          onTimeUpdate={(e) => setLocalTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setLocalDuration(e.currentTarget.duration || 0)}
        />
      )}

      {isVideo ? (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${ratio * 100}%` }} />
        </div>
      ) : (
        <Waveform seed={question.mediaId ?? question.id} ratio={ratio} playing={media.status === 'playing'} />
      )}

      {media.status === 'loading' && <span className={styles.loadingTag}>Loading…</span>}
      {blockedByAutoplay && (
        <button className={styles.tapOverlay} onClick={resumeAfterGesture}>Tap to enable playback</button>
      )}
    </div>
  );
}

function makeBars(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(18 + ((h >>> 8) % 1000) / 1000 * 82);
  }
  return bars;
}

function Waveform({ seed, ratio, playing }: { seed: string; ratio: number; playing: boolean }) {
  const bars = useMemo(() => makeBars(seed, 56), [seed]);
  return (
    <div className={styles.waveform}>
      {bars.map((h, i) => (
        <span
          key={i}
          className={`${styles.bar} ${i / bars.length <= ratio ? styles.barPlayed : ''} ${playing ? styles.barPulse : ''}`}
          style={{ height: `${h}%`, animationDelay: `${(i % 12) * 60}ms` }}
        />
      ))}
    </div>
  );
}
