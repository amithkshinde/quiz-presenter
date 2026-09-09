import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../types/quiz';
import type { QuestionRuntimeState } from '../../types/session';
import { useSessionStore } from '../../state/sessionStore';
import { useResolvedMediaUrl } from '../media/useResolvedMediaUrl';
import { formatDuration } from '../../utils/media';
import styles from './MediaControl.module.css';

/** Presenter-side audio/video control surface — the sole writer of playback state; Display only ever reflects it. */
export function MediaControl({
  question,
  runtimeState,
  onRequestReveal,
}: {
  question: Question;
  runtimeState: QuestionRuntimeState;
  onRequestReveal: () => void;
}) {
  const mediaUrl = useResolvedMediaUrl(question);
  const playMedia = useSessionStore((s) => s.playMedia);
  const pauseMedia = useSessionStore((s) => s.pauseMedia);
  const restartMedia = useSessionStore((s) => s.restartMedia);
  const seekMedia = useSessionStore((s) => s.seekMedia);
  const syncMediaPosition = useSessionStore((s) => s.syncMediaPosition);
  const mediaEnded = useSessionStore((s) => s.mediaEnded);
  const mediaError = useSessionStore((s) => s.mediaError);
  const retryMedia = useSessionStore((s) => s.retryMedia);
  const skipMedia = useSessionStore((s) => s.skipMedia);
  const dismissMediaEnded = useSessionStore((s) => s.dismissMediaEnded);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSyncRef = useRef(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const { media } = runtimeState;
  const isVideo = question.type === 'video';
  const isAudio = question.type === 'audio';
  const activeEl = (): HTMLMediaElement | null => (isVideo ? videoRef.current : audioRef.current);

  // A retry re-mounts the element fresh so a genuinely broken src gets a clean reload attempt.
  useEffect(() => {
    if (media.status === 'loading') setReloadKey((k) => k + 1);
  }, [media.status]);

  if (!isVideo && !isAudio) return null;

  if (media.skipped) {
    return <p className={styles.skippedNote}>Media skipped for this question — continuing without it.</p>;
  }

  if (!mediaUrl || media.status === 'error') {
    return (
      <div className={styles.errorBox}>
        <span className={styles.errorIcon}>⚠</span>
        <span>Media unavailable{media.error ? ` — ${media.error}` : ''}</span>
        <div className={styles.errorActions}>
          <button className={styles.pill} onClick={() => retryMedia()}>Retry</button>
          <button className={styles.pill} onClick={() => skipMedia()}>Skip Media</button>
          <button className={styles.pillGhost} onClick={() => skipMedia()}>Continue Without Media</button>
        </div>
      </div>
    );
  }

  function togglePlay() {
    const el = activeEl();
    if (!el) return;
    if (media.status === 'playing') {
      el.pause();
      pauseMedia();
    } else {
      el.play().catch(() => mediaError('Playback was blocked'));
      playMedia();
    }
  }

  function restart() {
    const el = activeEl();
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => mediaError('Playback was blocked'));
    restartMedia();
  }

  function onSeekInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setPosition(value);
    const el = activeEl();
    if (el) el.currentTime = value;
  }

  function commitSeek(e: React.PointerEvent<HTMLInputElement>) {
    seekMedia(Number((e.target as HTMLInputElement).value));
  }

  function onTimeUpdate() {
    const el = activeEl();
    if (!el) return;
    setPosition(el.currentTime);
    const now = Date.now();
    if (media.status === 'playing' && now - lastSyncRef.current > 900) {
      lastSyncRef.current = now;
      syncMediaPosition(el.currentTime);
    }
  }

  return (
    <div className={styles.wrap}>
      {isVideo ? (
        <video
          key={reloadKey}
          ref={videoRef}
          className={styles.videoEl}
          src={mediaUrl}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => mediaEnded()}
          onError={() => mediaError('The video file could not be loaded')}
        />
      ) : (
        <audio
          key={reloadKey}
          ref={audioRef}
          src={mediaUrl}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => mediaEnded()}
          onError={() => mediaError('The audio file could not be loaded')}
        />
      )}

      {media.status === 'ended' ? (
        <div className={styles.endedBox}>
          <span className={styles.endedTitle}>{isVideo ? 'Video ended' : 'Audio ended'}</span>
          <div className={styles.endedActions}>
            <button className={styles.pill} onClick={restart}>Replay</button>
            <button className={styles.pillPrimary} onClick={onRequestReveal}>Reveal Answer</button>
            <button className={styles.pillGhost} onClick={() => dismissMediaEnded()}>Continue</button>
          </div>
        </div>
      ) : (
        <div className={styles.controls}>
          <button className={styles.iconBtn} onClick={togglePlay} aria-label={media.status === 'playing' ? 'Pause' : 'Play'}>
            {media.status === 'playing' ? '❚❚' : '▶'}
          </button>
          <button className={styles.iconBtnGhost} onClick={restart} aria-label="Restart">↺</button>
          <span className={styles.time}>{formatDuration(position)}</span>
          <input
            className={styles.seek}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(position, duration || 0)}
            onChange={onSeekInput}
            onPointerUp={commitSeek}
            aria-label="Seek"
          />
          <span className={styles.time}>{formatDuration(duration)}</span>
          <span className={styles.volumeIcon}>🔊</span>
          <input
            className={styles.volume}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              const el = activeEl();
              if (el) el.volume = v;
            }}
            aria-label="Volume"
          />
          {isVideo && (
            <button className={styles.iconBtnGhost} onClick={() => videoRef.current?.requestFullscreen?.()} aria-label="Fullscreen">⛶</button>
          )}
        </div>
      )}
    </div>
  );
}
