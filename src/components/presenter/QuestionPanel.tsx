import type { Question } from '../../types/quiz';
import styles from './QuestionPanel.module.css';

export function QuestionPanel({ question, answerRevealed }: { question: Question; answerRevealed: boolean }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.tag}>{question.category || 'Uncategorized'}</span>
        <span className={styles.tag}>{question.points} PTS</span>
        <span className={styles.tag}>{typeLabel(question.type)}</span>
      </div>
      {question.mediaUrl && <img className={styles.media} src={question.mediaUrl} alt={question.correctText ? `Answer: ${question.correctText}` : question.text} />}
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
      {answerRevealed && <span className={styles.liveNote}>Live on the Presentation Display</span>}
    </div>
  );
}

function typeLabel(type: Question['type']) {
  if (type === 'multiple-choice') return 'Multiple choice';
  if (type === 'text') return 'Text answer';
  return 'Image';
}
