import styles from './RoundIntroSlate.module.css';

/** The round section-break slate — a presenter-triggered overlay (session.roundBanner), same idiom as the leaderboard toggle. Also reused by Quiz Preview. */
export function RoundIntroSlate({
  roundNumber,
  totalRounds,
  category,
  questionCount,
  complete = false,
}: {
  roundNumber: number;
  totalRounds: number;
  category: string;
  questionCount: number;
  complete?: boolean;
}) {
  return (
    <div className={styles.wrap}>
      <span className={styles.kicker}>{complete ? `Round ${roundNumber} complete` : `Round ${roundNumber} of ${totalRounds}`}</span>
      <h2 className={styles.title}>{complete ? 'Round Complete' : category || 'Round'}</h2>
      <p className={styles.sub}>
        {complete ? (roundNumber < totalRounds ? 'Up next: the next round' : 'Final round complete') : `${questionCount} question${questionCount !== 1 ? 's' : ''}`}
      </p>
    </div>
  );
}
