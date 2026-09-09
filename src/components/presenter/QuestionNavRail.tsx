import type { Question } from '../../types/quiz';
import type { QuizSession } from '../../types/session';
import styles from './QuestionNavRail.module.css';

export function QuestionNavRail({
  questions,
  session,
  onJump,
}: {
  questions: Question[];
  session: QuizSession;
  onJump: (index: number) => void;
}) {
  return (
    <ul className={styles.list}>
      {questions.map((q, i) => {
        const state = session.questionStates[q.id];
        const isCurrent = i === session.currentQuestionIndex;
        const isScored = session.scoreEvents.some((e) => e.questionIndex === i);
        const isAnsweredUnscored = !!state?.answerRevealed && !isScored && !state?.skipped;
        const isSkipped = !!state?.skipped;
        const prevCategory = i > 0 ? questions[i - 1].category || 'Uncategorized' : null;
        const startsNewRound = (q.category || 'Uncategorized') !== prevCategory;
        let dotClass = '';
        if (isCurrent) dotClass = styles.dotCurrent;
        else if (isSkipped) dotClass = styles.dotSkipped;
        else if (isScored) dotClass = styles.dotDone;
        else if (isAnsweredUnscored) dotClass = styles.dotUnscored;
        return (
          <li key={q.id}>
            {startsNewRound && <div className={styles.roundDivider}>{q.category || 'Uncategorized'}</div>}
            <button
              className={`${styles.row} ${isCurrent ? styles.current : ''}`}
              onClick={() => onJump(i)}
              aria-current={isCurrent ? 'true' : undefined}
              title={isAnsweredUnscored ? 'Answered — not yet scored' : isSkipped ? 'Skipped, unscored' : isScored ? 'Scored' : undefined}
            >
              <span className={`${styles.dot} ${dotClass}`} />
              <span className={styles.label}>Q{i + 1} · {q.category || 'Uncategorized'}</span>
              {isAnsweredUnscored && <span className={styles.unscoredBadge}>●</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
