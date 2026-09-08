import type { Question } from '../../types/quiz';
import type { QuestionRuntimeState } from '../../types/session';
import { TimerReadout } from './TimerReadout';
import styles from './QuestionSlate.module.css';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuestionSlate({
  question,
  runtimeState,
  progress,
}: {
  question: Question;
  runtimeState: QuestionRuntimeState;
  progress: { current: number; total: number };
}) {
  const { hintRevealed, answerRevealed } = runtimeState;
  const showHint = hintRevealed && question.hint.trim().length > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.meta}>
          <span className={`${styles.tag} ${styles.tagStrong}`}>Q{progress.current} / {progress.total}</span>
          {question.category && <span className={styles.tag}>{question.category}</span>}
          <span className={styles.tag}>{question.points} PTS</span>
        </div>
        {runtimeState.timerStatus !== 'idle' && (
          <div className={answerRevealed ? styles.timerResolved : undefined}>
            <TimerReadout runtimeState={runtimeState} totalSeconds={question.timerSeconds} />
          </div>
        )}
      </div>

      {question.mediaUrl && (
        <div className={styles.mediaWrap}>
          <img className={styles.media} src={question.mediaUrl} alt={`Photo accompanying question ${progress.current}`} />
        </div>
      )}

      <h2 className={styles.question}>{question.text}</h2>

      {question.type === 'multiple-choice' && question.options && (
        <div className={styles.options}>
          {question.options.map((opt, i) => (
            <div
              key={opt.id}
              className={[
                styles.option,
                answerRevealed && opt.isCorrect ? styles.correct : '',
                answerRevealed && !opt.isCorrect ? styles.dim : '',
              ].join(' ')}
            >
              <span className={styles.letter}>{LETTERS[i]}</span>
              <span className={styles.optText}>{opt.text}</span>
              {answerRevealed && opt.isCorrect && <span className={styles.check}>✓ Correct</span>}
            </div>
          ))}
        </div>
      )}

      {question.type !== 'multiple-choice' && answerRevealed && (
        <div className={styles.answerPanel}>
          <span className={styles.answerLabel}>Correct answer</span>
          <span className={styles.answerText}>{question.correctText}</span>
        </div>
      )}

      {showHint && (
        <div className={styles.hint}>
          <span className={styles.hintLabel}>Hint</span>
          <span className={styles.hintText}>{question.hint}</span>
        </div>
      )}
    </div>
  );
}
