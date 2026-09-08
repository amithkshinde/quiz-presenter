import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../state/quizStore';
import { getActiveSessionId, getLastResultsSessionId } from '../state/activeSessions';
import { createSyncAdapter } from '../state/sync';
import { isQuizReady, type Quiz } from '../types/quiz';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastProvider';
import styles from './LibraryPage.module.css';

function sessionProgressLabel(sessionId: string): string | null {
  const snapshot = createSyncAdapter(sessionId).loadLast();
  if (!snapshot) return null;
  return `Q${snapshot.currentQuestionIndex + 1} of ${snapshot.questionIds.length}`;
}

export function LibraryPage() {
  const allQuizzes = useQuizStore((s) => s.quizzes);
  const quizzes = useMemo(() => allQuizzes.filter((q) => q.status !== 'archived'), [allQuizzes]);
  const createQuiz = useQuizStore((s) => s.createQuiz);
  const duplicateQuiz = useQuizStore((s) => s.duplicateQuiz);
  const archiveQuiz = useQuizStore((s) => s.archiveQuiz);
  const navigate = useNavigate();
  const showToast = useToast();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  function handleCreate() {
    const quiz = createQuiz(title);
    setCreating(false);
    setTitle('');
    navigate(`/quizzes/${quiz.id}/edit`);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Quiz Library</h1>
          <p className={styles.sub}>Every quiz you've built, ready to edit or run again.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>+ Create Quiz</Button>
      </header>

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes yet"
          description="Create your first quiz to start adding questions, teams, and points."
          action={<Button variant="primary" onClick={() => setCreating(true)}>+ Create Quiz</Button>}
        />
      ) : (
        <div className={styles.grid}>
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onEdit={() => navigate(`/quizzes/${quiz.id}/edit`)}
              onLaunch={() => navigate(`/quizzes/${quiz.id}/launch`)}
              onResume={(sessionId) => navigate(`/session/${sessionId}/present`)}
              onViewResults={(sessionId) => navigate(`/quizzes/${quiz.id}/results/${sessionId}`)}
              onDuplicate={() => {
                const copy = duplicateQuiz(quiz.id);
                if (copy) showToast('Quiz duplicated');
              }}
              onArchive={() => setArchiveTarget(quiz.id)}
            />
          ))}
        </div>
      )}

      {creating && (
        <div className={styles.createOverlay} onClick={() => setCreating(false)}>
          <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.cardTitle}>Name your quiz</h3>
            <input
              autoFocus
              className={styles.input}
              placeholder="e.g. Friday Trivia Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className={styles.createActions}>
              <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Create &amp; edit</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive this quiz?"
        description="It will be hidden from the library. You can restore archived quizzes later from settings."
        confirmLabel="Archive"
        danger
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) archiveQuiz(archiveTarget);
          setArchiveTarget(null);
          showToast('Quiz archived');
        }}
      />
    </div>
  );
}

function QuizCard({
  quiz,
  onEdit,
  onLaunch,
  onResume,
  onViewResults,
  onDuplicate,
  onArchive,
}: {
  quiz: Quiz;
  onEdit: () => void;
  onLaunch: () => void;
  onResume: (sessionId: string) => void;
  onViewResults: (sessionId: string) => void;
  onDuplicate: () => void;
  onArchive: () => void;
}) {
  const { ready, reasons } = isQuizReady(quiz);
  // Read fresh on every render (not memoized) — another tab may have started,
  // paused, or ended this quiz's session since the library last rendered.
  const activeSessionId = getActiveSessionId(quiz.id);
  const lastResultsSessionId = getLastResultsSessionId(quiz.id);
  const progress = activeSessionId ? sessionProgressLabel(activeSessionId) : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>{quiz.title}</h3>
        <Badge tone={ready ? 'success' : 'neutral'}>{ready ? 'Ready' : 'Draft'}</Badge>
      </div>
      <p className={styles.meta}>
        {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''} · {quiz.teams.length} team{quiz.teams.length !== 1 ? 's' : ''}
      </p>
      {!ready && <p className={styles.reason}>{reasons.join(' · ')}</p>}

      {(activeSessionId || lastResultsSessionId) && (
        <div className={styles.demoActions}>
          {activeSessionId && (
            <Button size="sm" variant="primary" onClick={() => onResume(activeSessionId)}>
              ▶ Resume live session{progress ? ` (${progress})` : ''}
            </Button>
          )}
          {lastResultsSessionId && (
            <Button size="sm" variant="ghost" onClick={() => onViewResults(lastResultsSessionId)}>
              View last results
            </Button>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Button size="sm" onClick={onEdit}>Edit</Button>
        <Button size="sm" onClick={onLaunch} disabled={!ready}>
          {activeSessionId ? 'Rejoin' : 'Launch'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDuplicate}>Duplicate</Button>
        <Button size="sm" variant="danger" onClick={onArchive}>Archive</Button>
      </div>
    </div>
  );
}
