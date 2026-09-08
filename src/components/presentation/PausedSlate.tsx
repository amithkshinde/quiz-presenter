import styles from './PausedSlate.module.css';

export function PausedSlate() {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon} aria-hidden>❚❚</span>
      <h2 className={styles.title}>Quiz Paused</h2>
      <p className={styles.sub}>We'll be right back</p>
    </div>
  );
}
