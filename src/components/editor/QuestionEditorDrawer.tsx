import { useEffect, useRef } from 'react';
import { useQuizStore } from '../../state/quizStore';
import type { Quiz } from '../../types/quiz';
import { Button } from '../common/Button';
import styles from './QuestionEditorDrawer.module.css';

export function QuestionEditorDrawer({ quiz, questionId, onClose }: { quiz: Quiz; questionId: string | null; onClose: () => void }) {
  const updateQuestion = useQuizStore((s) => s.updateQuestion);
  const addOption = useQuizStore((s) => s.addOption);
  const updateOption = useQuizStore((s) => s.updateOption);
  const setCorrectOption = useQuizStore((s) => s.setCorrectOption);
  const removeOption = useQuizStore((s) => s.removeOption);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const question = quiz.questions.find((q) => q.id === questionId) ?? null;

  useEffect(() => {
    if (question) closeBtnRef.current?.focus();
  }, [question?.id]);

  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, onClose]);

  if (!question) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} role="dialog" aria-label="Edit question" onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3>Edit question</h3>
          <button ref={closeBtnRef} className={styles.close} onClick={onClose} aria-label="Close">Done</button>
        </header>

        <div className={styles.body}>
          <label className={styles.field}>
            <span className={styles.label}>Question text</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={question.text}
              onChange={(e) => updateQuestion(quiz.id, question.id, { text: e.target.value })}
              placeholder="What are we asking?"
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Category</span>
              <input
                className={styles.input}
                value={question.category}
                onChange={(e) => updateQuestion(quiz.id, question.id, { category: e.target.value })}
                placeholder="e.g. Science"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Points</span>
              <input
                type="number"
                min={1}
                step={5}
                className={styles.input}
                value={question.points}
                onChange={(e) => updateQuestion(quiz.id, question.id, { points: Math.max(1, Number(e.target.value) || 0) })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Timer (sec)</span>
              <input
                type="number"
                min={5}
                step={5}
                className={styles.input}
                value={question.timerSeconds}
                onChange={(e) => updateQuestion(quiz.id, question.id, { timerSeconds: Math.max(5, Number(e.target.value) || 0) })}
              />
            </label>
          </div>

          {question.type === 'image' && (
            <label className={styles.field}>
              <span className={styles.label}>Image URL</span>
              <input
                className={styles.input}
                value={question.mediaUrl ?? ''}
                onChange={(e) => updateQuestion(quiz.id, question.id, { mediaUrl: e.target.value })}
                placeholder="https://…"
              />
              {question.mediaUrl && <img className={styles.preview} src={question.mediaUrl} alt="" />}
            </label>
          )}

          {question.type === 'multiple-choice' ? (
            <div className={styles.field}>
              <span className={styles.label}>Answer options — select the correct one</span>
              <div className={styles.options}>
                {(question.options ?? []).map((opt, i) => (
                  <div key={opt.id} className={styles.optionRow}>
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(quiz.id, question.id, opt.id)}
                      aria-label={`Mark option ${i + 1} correct`}
                    />
                    <input
                      className={styles.input}
                      value={opt.text}
                      onChange={(e) => updateOption(quiz.id, question.id, opt.id, { text: e.target.value })}
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      className={styles.removeOpt}
                      onClick={() => removeOption(quiz.id, question.id, opt.id)}
                      disabled={(question.options ?? []).length <= 2}
                      aria-label="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={() => addOption(quiz.id, question.id)}>+ Add option</Button>
            </div>
          ) : (
            <label className={styles.field}>
              <span className={styles.label}>Correct answer</span>
              <input
                className={styles.input}
                value={question.correctText ?? ''}
                onChange={(e) => updateQuestion(quiz.id, question.id, { correctText: e.target.value })}
                placeholder="Shown only to the host until revealed"
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.label}>Hint <span className={styles.optional}>(optional)</span></span>
            <input
              className={styles.input}
              value={question.hint}
              onChange={(e) => updateQuestion(quiz.id, question.id, { hint: e.target.value })}
              placeholder="Leave blank if this question has no hint"
            />
          </label>
        </div>
        <p className={styles.autosave}>Autosaved</p>
      </aside>
    </div>
  );
}
