import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuizStore } from '../state/quizStore';
import { useSessionStore } from '../state/sessionStore';
import { getStandings } from '../state/derive';
import { Button } from '../components/common/Button';
import { PresentationStage, type PresentationViewModel } from '../components/presentation/PresentationStage';
import styles from './ResultsPage.module.css';

export function ResultsPage() {
  const { quizId, sessionId } = useParams<{ quizId: string; sessionId: string }>();
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === quizId));
  const session = useSessionStore((s) => s.session);
  const attachAsReader = useSessionStore((s) => s.attachAsReader);

  useEffect(() => {
    if (sessionId) attachAsReader(sessionId);
  }, [sessionId, attachAsReader]);

  if (!quiz) {
    return (
      <div className={styles.page}>
        <p>Quiz not found. <Link to="/">Back to library</Link></p>
      </div>
    );
  }

  if (!session || session.id !== sessionId) {
    return (
      <div className={styles.page}>
        <p>Loading results…</p>
      </div>
    );
  }

  const standings = getStandings(quiz, session);
  const skippedCount = Object.values(session.questionStates).filter((q) => q.skipped).length;

  const vm: PresentationViewModel = {
    quizTitle: quiz.title,
    teamNames: quiz.teams.map((t) => t.name),
    phase: 'ended',
    question: null,
    runtimeState: null,
    showLeaderboard: false,
    roundBanner: 'none',
    roundInfo: null,
    standings,
    progress: { current: session.questionIds.length, total: session.questionIds.length },
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Library</Link>
        <h1 className={styles.h1}>Results — {quiz.title}</h1>
      </header>

      <div className={styles.stageBox}>
        <PresentationStage vm={vm} />
      </div>

      <div className={styles.log}>
        <h3>Score log</h3>
        {session.scoreEvents.length === 0 ? (
          <p className={styles.empty}>No score adjustments were made.</p>
        ) : (
          <ul className={styles.logList}>
            {session.scoreEvents.map((e) => {
              const team = quiz.teams.find((t) => t.id === e.teamId);
              return (
                <li key={e.id} className={styles.logRow}>
                  <span>{team?.name ?? 'Unknown team'}</span>
                  <span className={e.delta > 0 ? styles.pos : styles.neg}>{e.delta > 0 ? `+${e.delta}` : e.delta}</span>
                  <span className={styles.qIndex}>{e.questionIndex !== null ? `Q${e.questionIndex + 1}` : '—'}</span>
                </li>
              );
            })}
          </ul>
        )}
        {skippedCount > 0 && <p className={styles.skipped}>{skippedCount} question{skippedCount > 1 ? 's were' : ' was'} skipped, unscored.</p>}
      </div>

      <Link to="/"><Button variant="primary">Back to library</Button></Link>
    </div>
  );
}
