import { useQuizStore } from '../../state/quizStore';
import type { Quiz } from '../../types/quiz';
import styles from './ScoreConfigPanel.module.css';

/** Quiz-level defaults for the presenter's live-scoring quick actions. Any question can override these individually. */
export function ScoreConfigPanel({ quiz }: { quiz: Quiz }) {
  const updateScoreConfig = useQuizStore((s) => s.updateScoreConfig);
  const cfg = quiz.scoreConfig;

  function num(v: string): number | undefined {
    return v.trim() === '' ? undefined : Number(v);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        These set the presenter's quick-scoring buttons for every question in this quiz. Any question can override them individually.
      </p>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Default points</span>
          <input
            className={styles.input}
            type="number"
            value={cfg?.defaultPoints ?? 10}
            onChange={(e) => updateScoreConfig(quiz.id, { defaultPoints: Number(e.target.value) || 0 })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Correct answer <span className={styles.optional}>(optional)</span></span>
          <input
            className={styles.input}
            type="number"
            placeholder={String(cfg?.defaultPoints ?? 10)}
            value={cfg?.correctPoints ?? ''}
            onChange={(e) => updateScoreConfig(quiz.id, { correctPoints: num(e.target.value) })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Incorrect answer <span className={styles.optional}>(optional)</span></span>
          <input
            className={styles.input}
            type="number"
            placeholder="0"
            value={cfg?.incorrectPoints ?? ''}
            onChange={(e) => updateScoreConfig(quiz.id, { incorrectPoints: num(e.target.value) })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Penalty <span className={styles.optional}>(optional)</span></span>
          <input
            className={styles.input}
            type="number"
            placeholder="-5"
            value={cfg?.penaltyPoints ?? ''}
            onChange={(e) => updateScoreConfig(quiz.id, { penaltyPoints: num(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}
