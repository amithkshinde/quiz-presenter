import styles from './WelcomeSlate.module.css';

export function WelcomeSlate({ quizTitle, teamNames }: { quizTitle: string; teamNames: string[] }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.kicker}>Get ready</div>
      <h1 className={styles.title}>{quizTitle}</h1>
      <div className={styles.sub}>Starting shortly</div>
      {teamNames.length > 0 && (
        <div className={styles.teams}>
          {teamNames.map((name) => (
            <span key={name} className={styles.chip}>{name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
