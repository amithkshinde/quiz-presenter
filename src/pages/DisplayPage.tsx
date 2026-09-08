import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSessionStore } from '../state/sessionStore';
import { useQuizStore } from '../state/quizStore';
import { createPresenceChannel } from '../state/sync';
import { getCurrentQuestion, getRuntimeState, getStandings, questionProgress } from '../state/derive';
import { useTimedOut } from '../hooks/useTimedOut';
import { PresentationStage, type PresentationViewModel } from '../components/presentation/PresentationStage';
import styles from './DisplayPage.module.css';

export function DisplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = useSessionStore((s) => s.session);
  const attachAsReader = useSessionStore((s) => s.attachAsReader);
  const quiz = useQuizStore((s) => (session ? s.quizzes.find((q) => q.id === session.quizId) : undefined));
  const sessionTimedOut = useTimedOut(!!session, sessionId ?? '');
  const quizTimedOut = useTimedOut(!!quiz, session?.quizId ?? '');

  useEffect(() => {
    if (sessionId) attachAsReader(sessionId);
  }, [sessionId, attachAsReader]);

  useEffect(() => {
    if (!sessionId) return;
    const presence = createPresenceChannel(sessionId);
    presence.announcePresence();
    const interval = window.setInterval(() => presence.announcePresence(), 2000);
    return () => window.clearInterval(interval);
  }, [sessionId]);

  if (!session) {
    if (sessionTimedOut) {
      return (
        <div className={styles.page}>
          <div className={styles.notFound}>
            <h1>Nothing's playing here</h1>
            <p>This link doesn't point at a quiz session — it may have been closed, or the link is wrong.</p>
            <Link to="/" className={styles.notFoundLink}>Open the Quiz Library</Link>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.dots}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></span>
          Connecting to presenter…
        </div>
      </div>
    );
  }

  if (!quiz) {
    if (quizTimedOut) {
      return (
        <div className={styles.page}>
          <div className={styles.notFound}>
            <h1>Quiz data unavailable</h1>
            <p>The session found here belongs to a quiz that's no longer on this device.</p>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.dots}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></span>
          Waiting for quiz data…
        </div>
      </div>
    );
  }

  const question = getCurrentQuestion(quiz, session);
  const runtimeState = question ? getRuntimeState(session, question.id) : null;

  const vm: PresentationViewModel = {
    quizTitle: quiz.title,
    teamNames: quiz.teams.map((t) => t.name),
    phase: session.phase,
    question,
    runtimeState,
    showLeaderboard: session.showLeaderboard,
    standings: getStandings(quiz, session),
    progress: questionProgress(session),
  };

  return (
    <div className={styles.page}>
      <div className={styles.stageWrap}>
        <PresentationStage vm={vm} />
      </div>
    </div>
  );
}
