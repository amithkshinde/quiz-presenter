import { useState } from 'react';
import type { DragEvent } from 'react';
import { useQuizStore } from '../../state/quizStore';
import { useQuestionBankStore } from '../../state/questionBankStore';
import type { Question, Quiz, QuestionType } from '../../types/quiz';
import { getQuestionWarnings, isQuestionComplete } from '../../types/quiz';
import { makeId } from '../../utils/id';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../common/ToastProvider';
import { QuestionBankBrowser } from '../bank/QuestionBankBrowser';
import styles from './QuestionList.module.css';

const TYPE_LABEL: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple choice',
  text: 'Text answer',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
};
const TYPE_ICON: Record<QuestionType, string> = {
  'multiple-choice': '☰',
  text: 'Aa',
  image: '🖼',
  audio: '♪',
  video: '▶',
};

export function QuestionList({ quiz, onEdit }: { quiz: Quiz; onEdit: (id: string) => void }) {
  const addQuestion = useQuizStore((s) => s.addQuestion);
  const addQuestionFromTemplate = useQuizStore((s) => s.addQuestionFromTemplate);
  const deleteQuestion = useQuizStore((s) => s.deleteQuestion);
  const duplicateQuestion = useQuizStore((s) => s.duplicateQuestion);
  const moveQuestion = useQuizStore((s) => s.moveQuestion);
  const reorderQuestions = useQuizStore((s) => s.reorderQuestions);
  const addToBank = useQuestionBankStore((s) => s.addToBank);
  const showToast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [modal, setModal] = useState<'bank' | 'duplicate' | 'import' | null>(null);

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
          action={<AddMenu open={addMenuOpen} onToggle={setAddMenuOpen} onAdd={handleAdd} onPick={setModal} />}
        />
      ) : (
        <>
          <ul className={styles.list}>
            {quiz.questions.map((q, index) => {
              const complete = isQuestionComplete(q);
              const warnings = getQuestionWarnings(q);
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
                  <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                  <button className={styles.main} onClick={() => onEdit(q.id)}>
                    <span className={styles.qtext}>{q.text || <em className={styles.placeholder}>Untitled question</em>}</span>
                    <span className={styles.metaRow}>
                      <Badge tone="secondary">{TYPE_ICON[q.type]} {TYPE_LABEL[q.type]}</Badge>
                      {(q.mediaUrl || q.mediaId) && <Badge tone="neutral">📎 Media</Badge>}
                      {q.category && <Badge tone="neutral">{q.category}</Badge>}
                      <Badge tone="neutral">{q.points} pts</Badge>
                      <Badge tone="neutral">{q.timerSeconds} sec</Badge>
                      {!complete && <Badge tone="warning" title={warnings.join(' · ')}>Incomplete</Badge>}
                    </span>
                  </button>
                  <div className={styles.rowActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Save a copy to the Question Bank for reuse in other quizzes"
                      onClick={() => {
                        addToBank(q, { source: quiz.title });
                        showToast('Saved to Question Bank', { tone: 'success' });
                      }}
                    >
                      → Bank
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicateQuestion(quiz.id, q.id)}>Duplicate</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(q.id)}>Delete</Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <AddMenu open={addMenuOpen} onToggle={setAddMenuOpen} onAdd={handleAdd} onPick={setModal} />
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

      {modal === 'bank' && (
        <QuestionBankBrowser
          onAddSelected={(questions) => questions.forEach((q) => addQuestionFromTemplate(quiz.id, q))}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'duplicate' && (
        <PickerModal
          title="Duplicate a question"
          empty="This quiz has no questions yet."
          items={quiz.questions.map((q) => ({ q, sub: TYPE_LABEL[q.type] }))}
          onPick={(q) => duplicateQuestion(quiz.id, q.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'import' && (
        <ImportModal
          onImport={(qs) => qs.forEach((q) => addQuestionFromTemplate(quiz.id, q))}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function AddMenu({
  open,
  onToggle,
  onAdd,
  onPick,
}: {
  open: boolean;
  onToggle: (v: boolean) => void;
  onAdd: (t: QuestionType) => void;
  onPick: (m: 'bank' | 'duplicate' | 'import') => void;
}) {
  const [view, setView] = useState<'root' | 'create'>('root');

  function close() {
    onToggle(false);
    setView('root');
  }

  return (
    <div className={styles.addMenuWrap}>
      <Button variant="primary" onClick={() => onToggle(!open)}>+ Add Question</Button>
      {open && (
        <div className={styles.addMenu}>
          {view === 'root' ? (
            <>
              <button onClick={() => setView('create')}>Create Question ▸</button>
              <button onClick={() => { onPick('bank'); close(); }}>Add from Question Bank</button>
              <button onClick={() => { onPick('duplicate'); close(); }}>Duplicate Question</button>
              <button onClick={() => { onPick('import'); close(); }}>Import Questions</button>
            </>
          ) : (
            <>
              <button className={styles.backBtn} onClick={() => setView('root')}>← Back</button>
              <button onClick={() => onAdd('multiple-choice')}>Multiple choice</button>
              <button onClick={() => onAdd('text')}>Text answer</button>
              <button onClick={() => onAdd('image')}>Image question</button>
              <button onClick={() => onAdd('audio')}>Audio question</button>
              <button onClick={() => onAdd('video')}>Video question</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PickerModal({
  title,
  empty,
  items,
  onPick,
  onClose,
}: {
  title: string;
  empty: string;
  items: { q: Question; sub: string }[];
  onPick: (q: Question) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.modalBody}>
          {items.length === 0 ? (
            <p className={styles.placeholder}>{empty}</p>
          ) : (
            items.map(({ q, sub }) => (
              <button key={q.id} className={styles.pickerRow} onClick={() => { onPick(q); onClose(); }}>
                <span>{q.text || <em>Untitled question</em>}</span>
                <span className={styles.pickerSub}>{sub} · {TYPE_LABEL[q.type]}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onImport, onClose }: { onImport: (qs: Question[]) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function handleImport() {
    try {
      const raw = JSON.parse(text);
      const list = Array.isArray(raw) ? raw : [raw];
      const questions = list.map(normalizeImported);
      onImport(questions);
      onClose();
    } catch {
      setError('Could not parse that as JSON — check the format and try again.');
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Import questions</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.placeholder}>Paste a JSON array of questions, e.g. {'[{"text":"...","type":"text","correctText":"..."}]'}</p>
          <textarea className={styles.importArea} rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="[ … ]" />
          {error && <p className={styles.importError}>{error}</p>}
          <Button variant="primary" onClick={handleImport} disabled={!text.trim()}>Import</Button>
        </div>
      </div>
    </div>
  );
}

function normalizeImported(raw: unknown): Question {
  const r = (raw ?? {}) as Partial<Question>;
  const type: QuestionType = r.type && TYPE_LABEL[r.type] ? r.type : 'text';
  return {
    id: makeId('q'),
    type,
    text: r.text ?? '',
    category: r.category ?? '',
    points: r.points ?? 10,
    hint: r.hint ?? '',
    timerSeconds: r.timerSeconds ?? 30,
    mediaUrl: r.mediaUrl,
    correctText: r.correctText,
    explanation: r.explanation,
    presenterNotes: r.presenterNotes,
    alternativeAnswers: r.alternativeAnswers,
    caseSensitive: r.caseSensitive,
    durationSeconds: r.durationSeconds,
    options: r.options?.map((o) => ({ id: makeId('opt'), text: o.text, isCorrect: !!o.isCorrect })),
  };
}
