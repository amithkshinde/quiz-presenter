import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuizStore } from '../state/quizStore';
import { useSessionStore } from '../state/sessionStore';
import { getActiveSessionId } from '../state/activeSessions';
import { isQuizReady } from '../types/quiz';
import { Button } from '../components/common/Button';
import styles from './LaunchPage.module.css';

export function LaunchPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === quizId));
  const startSession = useSessionStore((s) => s.startSession);
  const navigate = useNavigate();
  const [displayOpened, setDisplayOpened] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  if (!quiz) {
    return (
      <div className={styles.page}>
        <p>Quiz not found. <Link to="/">Back to library</Link></p>
      </div>
    );
  }

  const { ready, reasons } = isQuizReady(quiz);
  // A session already running for this quiz (e.g. the host left this page and
  // came back) takes priority over minting a new one — otherwise the original
  // keeps running with nothing pointing back at it. See: senior product
  // review — "no way to recover an active session."
  const existingSessionId = sessionId ?? getActiveSessionId(quiz.id);
  const resuming = !!existingSessionId;

  function ensureSession(): string {
    if (existingSessionId) return existingSessionId;
    const session = startSession(quiz!);
    setSessionId(session.id);
    return session.id;
  }

  function openDisplay() {
    const id = ensureSession();
    window.open(`/session/${id}/display`, 'quiz-presentation-display');
    setDisplayOpened(true);
  }

  function enterConsole() {
    const id = ensureSession();
    navigate(`/session/${id}/present`);
  }

  return (
    <div className={styles.page}>
      <Link to={`/quizzes/${quiz.id}/edit`} className={styles.back}>← Back to editor</Link>
      <h1 className={styles.h1}>Launch — {quiz.title}</h1>
      <p className={styles.sub}>
        {resuming ? 'A session for this quiz is already running — you\'ll rejoin it, not start a new one.' : 'Last checkpoint before you go live in front of the room.'}
      </p>

      <div className={styles.checklist}>
        <ChecklistItem ok={quiz.teams.length > 0} label={`${quiz.teams.length} team${quiz.teams.length !== 1 ? 's' : ''} added`} />
        <ChecklistItem ok={quiz.questions.length > 0 && ready} label={`${quiz.questions.length} question${quiz.questions.length !== 1 ? 's' : ''} ready`} />
        <ChecklistItem ok={displayOpened} label={displayOpened ? 'Presentation Display connected' : 'Presentation Display not yet opened'} optional />
      </div>

      {!ready && <p className={styles.blocked}>Not ready: {reasons.join(' · ')} — <Link to={`/quizzes/${quiz.id}/edit`}>fix in editor</Link></p>}

      <div className={styles.actions}>
        <Button onClick={openDisplay} disabled={!ready}>
          {displayOpened ? 'Reopen Presentation Display' : 'Open Presentation Display'}
        </Button>
        <Button variant="primary" onClick={enterConsole} disabled={!ready}>
          {resuming ? 'Rejoin Presenter Console →' : 'Enter Presenter Console →'}
        </Button>
      </div>
      <p className={styles.hint}>Drag the Presentation Display window to your projector or TV, then enter the Presenter Console to go live.</p>
    </div>
  );
}

function ChecklistItem({ ok, label, optional }: { ok: boolean; label: string; optional?: boolean }) {
  return (
    <div className={styles.item}>
      <span className={`${styles.dot} ${ok ? styles.dotOk : optional ? styles.dotOptional : styles.dotMissing}`} />
      <span>{label}</span>
    </div>
  );
}
