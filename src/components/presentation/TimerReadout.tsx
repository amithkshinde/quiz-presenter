import type { QuestionRuntimeState } from '../../types/session';
import styles from './TimerReadout.module.css';

type Urgency = 'normal' | 'warning' | 'critical';

function urgencyOf(remaining: number): Urgency {
  if (remaining <= 5) return 'critical';
  if (remaining <= 10) return 'warning';
  return 'normal';
}

export function TimerReadout({ runtimeState, totalSeconds }: { runtimeState: QuestionRuntimeState; totalSeconds: number }) {
  const { timerStatus, timerRemaining } = runtimeState;
  const isExpired = timerStatus === 'expired';
  const isPaused = timerStatus === 'paused';
  const urgency = urgencyOf(timerRemaining);
  const ratio = totalSeconds > 0 ? Math.max(0, timerRemaining / totalSeconds) : 0;

  const minutes = Math.floor(timerRemaining / 60);
  const seconds = timerRemaining % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Urgency colour reflects remaining time regardless of running/paused — a
  // host who pauses with 3 seconds left is still "nearly expired," just
  // frozen there. Only the beat animation is gated to actually running.
  return (
    <div
      className={[
        styles.wrap,
        !isExpired && urgency === 'warning' ? styles.warning : '',
        !isExpired && urgency === 'critical' ? styles.critical : '',
        !isExpired && timerStatus === 'running' ? styles.ticking : '',
        isExpired ? styles.expired : '',
        isPaused ? styles.paused : '',
      ].join(' ')}
      role="timer"
      aria-live="polite"
    >
      {isExpired ? (
        <span className={styles.expiredLabel}>TIME'S UP</span>
      ) : (
        // Remounting the numeral on every second (via key) lets the "beat" animation
        // restart cleanly each tick without a JS animation loop.
        <span key={timerStatus === 'running' ? timerRemaining : 'static'} className={styles.num}>{label}</span>
      )}
      {!isExpired && (
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
        </div>
      )}
    </div>
  );
}
