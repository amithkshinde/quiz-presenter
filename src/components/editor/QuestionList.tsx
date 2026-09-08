import { useState } from 'react';
import type { DragEvent } from 'react';
import { useQuizStore } from '../../state/quizStore';
import type { Quiz, QuestionType } from '../../types/quiz';
import { isQuestionComplete } from '../../types/quiz';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './QuestionList.module.css';

const TYPE_LABEL: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple choice',
  text: 'Text answer',
  image: 'Image',
};

export function QuestionList({ quiz, onEdit }: { quiz: Quiz; onEdit: (id: string) => void }) {
  const addQuestion = useQuizStore((s) => s.addQuestion);
  const deleteQuestion = useQuizStore((s) => s.deleteQuestion);
  const duplicateQuestion = useQuizStore((s) => s.duplicateQuestion);
  const moveQuestion = useQuizStore((s) => s.moveQuestion);
  const reorderQuestions = useQuizStore((s) => s.reorderQuestions);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  function handleAdd(type: QuestionType) {
    const q = addQuestion(quiz.id, type);
    setAddMenuOpen(false);
    if (q) onEdit(q.id);
  }

  function onDragStart(index: number) {
    return (e: DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    };
  }

  function onDrop(index: number) {
    return (e: DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null) reorderQuestions(quiz.id, dragIndex, index);
      setDragIndex(null);
    };
  }

  return (
    <div>
      {quiz.questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add your first question to get this quiz ready to run."
          action={<AddMenu open={addMenuOpen} onToggle={setAddMenuOpen} onAdd={handleAdd} />}
        />
      ) : (
        <>
          <ul className={styles.list}>
            {quiz.questions.map((q, index) => {
              const complete = isQuestionComplete(q);
              return (
                <li
                  key={q.id}
                  className={styles.row}
                  draggable
                  onDragStart={onDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop(index)}
                >
                  <span className={styles.handle} aria-hidden>⠿</span>
                  <button className={styles.reorderBtn} aria-label="Move up" disabled={index === 0} onClick={() => moveQuestion(quiz.id, index, -1)}>↑</button>
                  <button className={styles.reorderBtn} aria-label="Move down" disabled={index === quiz.questions.length - 1} onClick={() => moveQuestion(quiz.id, index, 1)}>↓</button>
                  <span className={styles.index}>{index + 1}</span>
                  <button className={styles.main} onClick={() => onEdit(q.id)}>
                    <span className={styles.qtext}>{q.text || <em className={styles.placeholder}>Untitled question</em>}</span>
                    <span className={styles.metaRow}>
                      <Badge tone="secondary">{TYPE_LABEL[q.type]}</Badge>
                      {q.category && <Badge tone="neutral">{q.category}</Badge>}
                      <Badge tone="neutral">{q.points} pts</Badge>
                      {!complete && <Badge tone="warning">Incomplete</Badge>}
                    </span>
                  </button>
                  <div className={styles.rowActions}>
                    <Button size="sm" variant="ghost" onClick={() => duplicateQuestion(quiz.id, q.id)}>Duplicate</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(q.id)}>Delete</Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <AddMenu open={addMenuOpen} onToggle={setAddMenuOpen} onAdd={handleAdd} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this question?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteQuestion(quiz.id, deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function AddMenu({ open, onToggle, onAdd }: { open: boolean; onToggle: (v: boolean) => void; onAdd: (t: QuestionType) => void }) {
  return (
    <div className={styles.addMenuWrap}>
      <Button variant="primary" onClick={() => onToggle(!open)}>+ Add Question</Button>
      {open && (
        <div className={styles.addMenu}>
          <button onClick={() => onAdd('multiple-choice')}>Multiple choice</button>
          <button onClick={() => onAdd('text')}>Text answer</button>
          <button onClick={() => onAdd('image')}>Image-based</button>
        </div>
      )}
    </div>
  );
}
