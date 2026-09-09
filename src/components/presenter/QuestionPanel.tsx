import type { Question } from '../../types/quiz';
import type { QuestionRuntimeState } from '../../types/session';
import { useResolvedMediaUrl } from '../media/useResolvedMediaUrl';
import { MediaControl } from './MediaControl';
import styles from './QuestionPanel.module.css';

export function QuestionPanel({
  question,
  runtimeState,
  onRequestReveal,
}: {
  question: Question;
  runtimeState: QuestionRuntimeState;
  onRequestReveal: () => void;
}) {
  const mediaUrl = useResolvedMediaUrl(question);
  const isAv = question.type === 'audio' || question.type === 'video';
  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.tag}>{question.category || 'Uncategorized'}</span>
        <span className={styles.tag}>{question.points} PTS</span>
        <span className={styles.tag}>{typeLabel(question.type)}</span>
      </div>
      {isAv && <MediaControl question={question} runtimeState={runtimeState} onRequestReveal={onRequestReveal} />}
      {question.type === 'image' && (
        mediaUrl ? (
          <img className={styles.media} src={mediaUrl} alt={question.correctText ? `Answer: ${question.correctText}` : question.text} />
        ) : (
          <p className={styles.mediaMissing}>⚠ Image unavailable</p>
        )
      )}
      <p className={styles.text}>{question.text || <em className={styles.placeholder}>No question text</em>}</p>
      {question.type === 'multiple-choice' && question.options && (
        <div className={styles.options}>
          {question.options.map((opt, i) => (
            <div key={opt.id} className={`${styles.option} ${opt.isCorrect ? styles.correct : ''}`}>
              <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
              <span>{opt.text}</span>
              {opt.isCorrect && <span className={styles.correctTag}>Correct</span>}
            </div>
          ))}
        </div>
      )}
      {runtimeState.answerRevealed && <span className={styles.liveNote}>Live on the Presentation Display</span>}
    </div>
  );
}

function typeLabel(type: Question['type']) {
  if (type === 'multiple-choice') return 'Multiple choice';
  if (type === 'text') return 'Text answer';
  if (type === 'audio') return 'Audio';
  if (type === 'video') return 'Video';
  return 'Image';
}
