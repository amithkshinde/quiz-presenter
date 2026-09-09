import { useEffect, useRef, useState } from 'react';
import { useQuizStore } from '../../state/quizStore';
import type { Question, Quiz } from '../../types/quiz';
import { getQuestionWarnings } from '../../types/quiz';
import type { MediaKind } from '../../types/media';
import { AddMediaControl } from '../media/AddMediaControl';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './QuestionEditorDrawer.module.css';

export function QuestionEditorDrawer({
  quiz,
  questionId,
  onClose,
  onSwitchTo,
}: {
  quiz: Quiz;
  questionId: string | null;
  onClose: () => void;
  onSwitchTo: (id: string) => void;
}) {
  const updateQuestion = useQuizStore((s) => s.updateQuestion);
  const addQuestion = useQuizStore((s) => s.addQuestion);
  const duplicateQuestion = useQuizStore((s) => s.duplicateQuestion);
  const deleteQuestion = useQuizStore((s) => s.deleteQuestion);
  const addOption = useQuizStore((s) => s.addOption);
  const updateOption = useQuizStore((s) => s.updateOption);
  const setCorrectOption = useQuizStore((s) => s.setCorrectOption);
  const removeOption = useQuizStore((s) => s.removeOption);
  const moveOption = useQuizStore((s) => s.moveOption);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const snapshotRef = useRef<Question | null>(null);

  const question = quiz.questions.find((q) => q.id === questionId) ?? null;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (question) {
      snapshotRef.current = question;
      setAdvancedOpen(false);
      closeBtnRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, onClose]);

  if (!question) return null;

  function patch(p: Partial<Question>) {
    updateQuestion(quiz.id, question!.id, p);
  }

  function handleCancel() {
    if (snapshotRef.current) updateQuestion(quiz.id, question!.id, snapshotRef.current);
    onClose();
  }

  function handleSaveAndAddAnother() {
    const next = addQuestion(quiz.id, question!.type);
    if (next) onSwitchTo(next.id);
  }

  const currentIndex = quiz.questions.findIndex((q) => q.id === question.id);
  const nextQuestion = currentIndex >= 0 ? quiz.questions[currentIndex + 1] : undefined;

  function handleSaveAndNext() {
    if (nextQuestion) onSwitchTo(nextQuestion.id);
  }

  const warnings = getQuestionWarnings(question);
  const isMedia = question.type === 'image' || question.type === 'audio' || question.type === 'video';
  const altAnswers = question.alternativeAnswers ?? [];

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
              onChange={(e) => patch({ text: e.target.value })}
              placeholder="What are we asking?"
            />
          </label>

          {warnings.length > 0 && <p className={styles.warnings}>⚠ {warnings.join(' · ')}</p>}

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Category</span>
              <input
                className={styles.input}
                value={question.category}
                onChange={(e) => patch({ category: e.target.value })}
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
                onChange={(e) => patch({ points: Math.max(1, Number(e.target.value) || 0) })}
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
                onChange={(e) => patch({ timerSeconds: Math.max(5, Number(e.target.value) || 0) })}
              />
            </label>
          </div>

          {isMedia && (
            <div className={styles.field}>
              <span className={styles.label}>Media</span>
              <AddMediaControl kind={question.type as MediaKind} mediaId={question.mediaId} onChange={(mediaId) => patch({ mediaId, mediaUrl: undefined })} />
            </div>
          )}

          {(question.type === 'audio' || question.type === 'video') && (
            <label className={styles.field}>
              <span className={styles.label}>Duration (sec) <span className={styles.optional}>(optional)</span></span>
              <input
                type="number"
                min={1}
                className={styles.input}
                value={question.durationSeconds ?? ''}
                onChange={(e) => patch({ durationSeconds: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })}
              />
            </label>
          )}

          {question.type === 'multiple-choice' ? (
            <div className={styles.field}>
              <span className={styles.label}>Answer options — select the correct one</span>
              <div className={styles.options}>
                {(question.options ?? []).map((opt, i, arr) => (
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
                    <button className={styles.reorderOpt} aria-label="Move up" disabled={i === 0} onClick={() => moveOption(quiz.id, question.id, i, -1)}>↑</button>
                    <button className={styles.reorderOpt} aria-label="Move down" disabled={i === arr.length - 1} onClick={() => moveOption(quiz.id, question.id, i, 1)}>↓</button>
                    <button
                      className={styles.removeOpt}
                      onClick={() => removeOption(quiz.id, question.id, opt.id)}
                      disabled={arr.length <= 2}
                      aria-label="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={() => addOption(quiz.id, question.id)} disabled={(question.options ?? []).length >= 6}>
                + Add option
              </Button>
            </div>
          ) : question.type === 'text' ? (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Correct answer</span>
                <input
                  className={styles.input}
                  value={question.correctText ?? ''}
                  onChange={(e) => patch({ correctText: e.target.value })}
                  placeholder="Shown only to the host until revealed"
                />
              </label>
              <div className={styles.field}>
                <span className={styles.label}>Alternative answers <span className={styles.optional}>(optional)</span></span>
                {altAnswers.map((a, i) => (
                  <div key={i} className={styles.optionRow}>
                    <input
                      className={styles.input}
                      value={a}
                      onChange={(e) => {
                        const next = [...altAnswers];
                        next[i] = e.target.value;
                        patch({ alternativeAnswers: next });
                      }}
                      placeholder="Another accepted answer"
                    />
                    <button
                      className={styles.removeOpt}
                      aria-label="Remove alternative answer"
                      onClick={() => patch({ alternativeAnswers: altAnswers.filter((_, idx) => idx !== i) })}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => patch({ alternativeAnswers: [...altAnswers, ''] })}>+ Add alternative</Button>
              </div>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={!!question.caseSensitive} onChange={(e) => patch({ caseSensitive: e.target.checked })} />
                <span>Case-sensitive matching <span className={styles.optional}>(for future automatic evaluation)</span></span>
              </label>
            </>
          ) : (
            <label className={styles.field}>
              <span className={styles.label}>Answer</span>
              <input
                className={styles.input}
                value={question.correctText ?? ''}
                onChange={(e) => patch({ correctText: e.target.value })}
                placeholder="Shown only to the host until revealed"
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.label}>Hint <span className={styles.optional}>(optional)</span></span>
            <input
              className={styles.input}
              value={question.hint}
              onChange={(e) => patch({ hint: e.target.value })}
              placeholder="Leave blank if this question has no hint"
            />
          </label>

          <button className={styles.advancedToggle} onClick={() => setAdvancedOpen((v) => !v)}>
            {advancedOpen ? '▾ Fewer options' : '▸ More options (explanation, presenter notes)'}
          </button>
          {advancedOpen && (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Explanation <span className={styles.optional}>(shown after the answer is revealed)</span></span>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={question.explanation ?? ''}
                  onChange={(e) => patch({ explanation: e.target.value })}
                  placeholder="Add context participants see after the reveal"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Presenter notes <span className={styles.optional}>(host-only, never shown to participants)</span></span>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={question.presenterNotes ?? ''}
                  onChange={(e) => patch({ presenterNotes: e.target.value })}
                  placeholder="Reminders for yourself while presenting"
                />
              </label>
              <div className={styles.field}>
                <span className={styles.label}>Scoring override <span className={styles.optional}>(overrides the quiz's live-scoring defaults for this question only)</span></span>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.label}>Correct</span>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="quiz default"
                      value={question.scoreOverride?.correctPoints ?? ''}
                      onChange={(e) =>
                        patch({ scoreOverride: { ...question.scoreOverride, correctPoints: e.target.value === '' ? undefined : Number(e.target.value) } })
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Incorrect</span>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="0"
                      value={question.scoreOverride?.incorrectPoints ?? ''}
                      onChange={(e) =>
                        patch({ scoreOverride: { ...question.scoreOverride, incorrectPoints: e.target.value === '' ? undefined : Number(e.target.value) } })
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Penalty</span>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="-5"
                      value={question.scoreOverride?.penaltyPoints ?? ''}
                      onChange={(e) =>
                        patch({ scoreOverride: { ...question.scoreOverride, penaltyPoints: e.target.value === '' ? undefined : Number(e.target.value) } })
                      }
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <Button size="sm" variant="ghost" onClick={() => duplicateQuestion(quiz.id, question.id)}>Duplicate</Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>Delete</Button>
          </div>
          <div className={styles.footerRight}>
            <Button size="sm" variant="secondary" onClick={handleCancel}>Cancel</Button>
            {nextQuestion && <Button size="sm" variant="secondary" onClick={handleSaveAndNext}>Save &amp; Next →</Button>}
            <Button size="sm" variant="primary" onClick={handleSaveAndAddAnother}>Save &amp; Add Another</Button>
            <Button size="sm" onClick={onClose}>Save</Button>
          </div>
        </footer>
        <p className={styles.autosave}>Autosaved</p>
      </aside>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this question?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteQuestion(quiz.id, question.id);
          setDeleteOpen(false);
          onClose();
        }}
      />
    </div>
  );
}
