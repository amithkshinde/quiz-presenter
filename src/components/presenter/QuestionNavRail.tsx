import type { Question } from '../../types/quiz';
import type { QuizSession } from '../../types/session';
import styles from './QuestionNavRail.module.css';

export function QuestionNavRail({ questions, session, onJump }: { questions: Question[]; session: QuizSession; onJump: (index: number) => void }) {
  return (
    <ul className={styles.list}>
      {questions.map((q, i) => {
        const state = session.questionStates[q.id];
        const isCurrent = i === session.currentQuestionIndex;
        const isDone = state?.answerRevealed || state?.skipped;
        return (
          <li key={q.id}>
            <button
              className={`${styles.row} ${isCurrent ? styles.current : ''}`}
              onClick={() => onJump(i)}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={`${styles.dot} ${isCurrent ? styles.dotCurrent : isDone ? styles.dotDone : ''}`} />
              <span className={styles.label}>Q{i + 1} · {q.category || 'Uncategorized'}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
