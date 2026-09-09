import type { Question, Quiz } from '../../types/quiz';
import type { QuestionRuntimeState } from '../../types/session';
import { useResolvedMediaUrl } from '../media/useResolvedMediaUrl';
import { resolveScoreDeltas } from '../../utils/scoring';
import styles from './PresenterPreviewPanel.module.css';

/**
 * A read-only stand-in for the Presenter Console, driven by Quiz Preview's own
 * local stepping state — never touches sessionStore/quizStore, so it's safe
 * to explore before any live session exists. Shows exactly what a host would
 * rely on: the answer, hint, presenter-only notes, scoring, and the controls
 * available at this point in the flow.
 */
export function PresenterPreviewPanel({
  quiz,
  question,
  runtimeState,
  onToggleTimer,
  onToggleHint,
  onToggleAnswer,
}: {
  quiz: Quiz;
  question: Question;
  runtimeState: QuestionRuntimeState;
  onToggleTimer: () => void;
  onToggleHint: () => void;
  onToggleAnswer: () => void;
}) {
  const mediaUrl = useResolvedMediaUrl(question);
  const deltas = resolveScoreDeltas(quiz, question);
  const correctAnswer = question.type === 'multiple-choice' ? question.options?.find((o) => o.isCorrect)?.text : question.correctText;

  return (
    <div className={`console-scope ${styles.wrap}`}>
      <span className={styles.previewBadge}>PRESENTER PREVIEW</span>

      <div className={styles.meta}>
        <span className={styles.tag}>{question.category || 'Uncategorized'}</span>
        <span className={styles.tag}>{question.points} PTS</span>
        <span className={styles.tag}>{question.timerSeconds} SEC</span>
      </div>

      {mediaUrl && question.type === 'image' && <img className={styles.media} src={mediaUrl} alt="" />}
      {mediaUrl && question.type === 'audio' && <audio className={styles.media} controls src={mediaUrl} />}
      {mediaUrl && question.type === 'video' && <video className={styles.media} controls src={mediaUrl} />}

      <p className={styles.qtext}>{question.text || <em>Untitled question</em>}</p>

      {question.type === 'multiple-choice' && question.options && (
        <div className={styles.options}>
          {question.options.map((o) => (
            <span key={o.id} className={`${styles.option} ${o.isCorrect ? styles.correctOpt : ''}`}>{o.text}{o.isCorrect ? ' ✓' : ''}</span>
          ))}
        </div>
      )}

      <div className={styles.cardRow}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span>Answer</span>
            <button className={styles.miniBtn} onClick={onToggleAnswer}>{runtimeState.answerRevealed ? 'Hide' : 'Reveal'}</button>
          </div>
          <p className={styles.cardBody}>{correctAnswer || '—'}</p>
          <span className={styles.led}>{runtimeState.answerRevealed ? 'LIVE — shown to participants' : 'Not shown yet'}</span>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span>Hint</span>
            <button className={styles.miniBtn} onClick={onToggleHint} disabled={!question.hint}>{runtimeState.hintRevealed ? 'Hide' : 'Reveal'}</button>
          </div>
          <p className={styles.cardBody}>{question.hint || <em>No hint for this question</em>}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}><span>Presenter notes</span></div>
        <p className={styles.cardBody}>{question.presenterNotes || <em>No notes</em>}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}><span>Scoring</span></div>
        <p className={styles.cardBody}>Correct +{deltas.correct} · Incorrect {deltas.incorrect} · Penalty {deltas.penalty}</p>
      </div>

      <div className={styles.timerRow}>
        <span>Timer: {runtimeState.timerStatus === 'running' ? 'Running' : 'Idle'}</span>
        <button className={styles.miniBtn} onClick={onToggleTimer}>{runtimeState.timerStatus === 'running' ? 'Pause' : 'Start'}</button>
      </div>
    </div>
  );
}
