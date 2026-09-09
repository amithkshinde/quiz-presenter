import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuizStore } from '../state/quizStore';
import { getActiveSessionId } from '../state/activeSessions';
import { isQuizReady } from '../types/quiz';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { QuestionList } from '../components/editor/QuestionList';
import { QuestionEditorDrawer } from '../components/editor/QuestionEditorDrawer';
import { TeamsPanel } from '../components/editor/TeamsPanel';
import { ScoreConfigPanel } from '../components/editor/ScoreConfigPanel';
import styles from './EditorPage.module.css';

type Tab = 'questions' | 'teams' | 'scoring';

export function EditorPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === quizId));
  const renameQuiz = useQuizStore((s) => s.renameQuiz);
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('questions');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  if (!quiz) {
    return (
      <div className={styles.page}>
        <p>Quiz not found. <Link to="/">Back to library</Link></p>
      </div>
    );
  }

  const { ready, reasons } = isQuizReady(quiz);
  const activeSessionId = getActiveSessionId(quiz.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.back}>← Library</Link>
          <input
            className={styles.titleInput}
            value={quiz.title}
            onChange={(e) => renameQuiz(quiz.id, e.target.value)}
            aria-label="Quiz title"
          />
        </div>
        <div className={styles.headerRight}>
          <Badge tone={ready ? 'success' : 'neutral'}>{ready ? 'Ready to launch' : 'Draft'}</Badge>
          <Button onClick={() => navigate(`/quizzes/${quiz.id}/preview`)}>Preview</Button>
          <Button variant="primary" disabled={!ready} onClick={() => navigate(`/quizzes/${quiz.id}/launch`)}>
            {activeSessionId ? 'Rejoin live session →' : 'Launch →'}
          </Button>
        </div>
      </header>

      {activeSessionId && (
        <p className={styles.liveWarning}>
          ● A session for this quiz is live right now. Edits here reach it immediately — that's fine for fixing a typo or adding a team, but <b>deleting or reordering questions can break the question the room is currently looking at.</b>
        </p>
      )}

      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'questions' ? styles.tabActive : ''}`} onClick={() => setTab('questions')}>
          Questions ({quiz.questions.length})
        </button>
        <button className={`${styles.tab} ${tab === 'teams' ? styles.tabActive : ''}`} onClick={() => setTab('teams')}>
          Teams ({quiz.teams.length})
        </button>
        <button className={`${styles.tab} ${tab === 'scoring' ? styles.tabActive : ''}`} onClick={() => setTab('scoring')}>
          Scoring
        </button>
      </nav>

      {!ready && (
        <p className={styles.readiness}>Not ready yet: {reasons.join(' · ')}</p>
      )}

      {tab === 'questions' ? (
        <QuestionList quiz={quiz} onEdit={setActiveQuestionId} />
      ) : tab === 'teams' ? (
        <TeamsPanel quiz={quiz} />
      ) : (
        <ScoreConfigPanel quiz={quiz} />
      )}

      <QuestionEditorDrawer
        quiz={quiz}
        questionId={activeQuestionId}
        onSwitchTo={setActiveQuestionId}
        onClose={() => setActiveQuestionId(null)}
      />
    </div>
  );
}
