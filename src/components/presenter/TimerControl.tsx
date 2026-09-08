import type { QuestionRuntimeState } from '../../types/session';
import styles from './TimerControl.module.css';

interface Props {
  runtimeState: QuestionRuntimeState;
  totalSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export function TimerControl({ runtimeState, totalSeconds, onStart, onPause, onResume, onReset }: Props) {
  const { timerStatus, timerRemaining } = runtimeState;
  const minutes = Math.floor(timerRemaining / 60);
  const seconds = timerRemaining % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const ratio = totalSeconds > 0 ? Math.max(0, timerRemaining / totalSeconds) : 0;
  const running = timerStatus === 'running';
  const isActive = timerStatus === 'running' || timerStatus === 'paused';
  // Urgency reflects remaining time whether ticking or paused — a host who
  // pauses with 3 seconds left is still "nearly expired," just frozen there.
  const warning = isActive && timerRemaining <= 10 && timerRemaining > 5;
  const critical = isActive && timerRemaining <= 5 && timerRemaining > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.readout}>
        <span
          key={running ? timerRemaining : 'static'}
          className={[
            styles.time,
            timerStatus === 'expired' ? styles.expired : '',
            warning ? styles.warning : '',
            critical ? styles.critical : '',
            running && (warning || critical) ? styles.ticking : '',
            timerStatus === 'paused' ? styles.paused : '',
          ].join(' ')}
        >
          {timerStatus === 'expired' ? "Time's up" : label}
        </span>
        {timerStatus !== 'idle' && timerStatus !== 'expired' && (
          <div className={styles.track}>
            <div
              className={[styles.fill, warning ? styles.fillWarning : '', critical ? styles.fillCritical : ''].join(' ')}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        )}
      </div>
      <div className={styles.controls}>
        {timerStatus === 'idle' && <button className={styles.btn} onClick={onStart} aria-label="Start timer">▶</button>}
        {timerStatus === 'running' && <button className={styles.btn} onClick={onPause} aria-label="Pause timer">❚❚</button>}
        {timerStatus === 'paused' && <button className={styles.btn} onClick={onResume} aria-label="Resume timer">▶</button>}
        {timerStatus !== 'idle' && <button className={styles.btnGhost} onClick={onReset} aria-label="Reset timer">↺</button>}
      </div>
    </div>
  );
}
