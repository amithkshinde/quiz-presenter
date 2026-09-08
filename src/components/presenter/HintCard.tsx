import styles from './HintCard.module.css';

export function HintCard({ hint, revealed, onReveal }: { hint: string; revealed: boolean; onReveal: () => void }) {
  const hasHint = hint.trim().length > 0;

  if (!hasHint) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <div className={styles.head}>
          <span className={styles.label}>Hint</span>
        </div>
        <p className={styles.emptyText}>No hint for this question</p>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${revealed ? styles.live : ''}`}>
      <div className={styles.head}>
        <span className={styles.label}>Hint</span>
        <span className={`${styles.led} ${revealed ? styles.ledLive : styles.ledStandby}`} />
      </div>
      <p className={styles.body}>{hint}</p>
      {revealed ? (
        <span className={styles.status}>Shown to participants</span>
      ) : (
        <button className={styles.reveal} onClick={onReveal}>Reveal hint</button>
      )}
    </div>
  );
}
