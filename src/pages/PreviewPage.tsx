import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuizStore } from '../state/quizStore';
import { standings as computeStandings } from '../utils/scoring';
import { PresentationStage, type PresentationViewModel } from '../components/presentation/PresentationStage';
import { Button } from '../components/common/Button';
import type { QuestionRuntimeState } from '../types/session';
import styles from './PreviewPage.module.css';

type Mode = 'welcome' | 'question' | 'leaderboard' | 'final';

export function PreviewPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const quiz = useQuizStore((s) => s.quizzes.find((q) => q.id === quizId));

  const [mode, setMode] = useState<Mode>('welcome');
  const [index, setIndex] = useState(0);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  const sampleStandings = useMemo(
    () => (quiz ? computeStandings(quiz.teams, [
      ...quiz.teams.map((t, i) => ({ id: `s${i}`, teamId: t.id, questionIndex: null, delta: (quiz.teams.length - i) * 15, timestamp: '' })),
    ]) : []),
    [quiz]
  );

  if (!quiz) {
    return (
      <div className={styles.page}>
        <p>Quiz not found. <Link to="/">Back to library</Link></p>
      </div>
    );
  }

  const question = quiz.questions[index] ?? null;

  function goTo(newIndex: number) {
    setIndex(newIndex);
    setHintRevealed(false);
    setAnswerRevealed(false);
    setTimerRunning(false);
    setMode('question');
  }

  const runtimeState: QuestionRuntimeState | null = question
    ? {
        timerStatus: timerRunning ? 'running' : 'idle',
        timerRemaining: question.timerSeconds,
        hintRevealed,
        answerRevealed,
        skipped: false,
      }
    : null;

  const vm: PresentationViewModel = {
    quizTitle: quiz.title,
    teamNames: quiz.teams.map((t) => t.name),
    phase: mode === 'final' ? 'ended' : mode === 'welcome' ? 'not-started' : 'live',
    question,
    runtimeState,
    showLeaderboard: mode === 'leaderboard',
    standings: sampleStandings,
    progress: { current: index + 1, total: quiz.questions.length || 1 },
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={`/quizzes/${quiz.id}/edit`} className={styles.back}>← Back to editor</Link>
        <h1 className={styles.h1}>Preview — {quiz.title}</h1>
      </header>

      {quiz.questions.length === 0 ? (
        <p className={styles.empty}>Add a question to preview how it will look on stage.</p>
      ) : (
        <>
          <div className={styles.stageBox}>
            <PresentationStage vm={vm} isPreview />
          </div>

          <div className={styles.controls}>
            <div className={styles.group}>
              <Button size="sm" onClick={() => setMode('welcome')}>Welcome</Button>
              <Button size="sm" onClick={() => goTo(Math.max(0, index - 1))} disabled={mode === 'question' && index === 0}>← Prev question</Button>
              <span className={styles.count}>{index + 1} / {quiz.questions.length}</span>
              <Button size="sm" onClick={() => goTo(Math.min(quiz.questions.length - 1, index + 1))}>Next question →</Button>
              <Button size="sm" onClick={() => setMode('leaderboard')}>Standings</Button>
              <Button size="sm" onClick={() => setMode('final')}>Final results</Button>
            </div>
            {mode === 'question' && (
              <div className={styles.group}>
                <Button size="sm" variant={timerRunning ? 'primary' : 'secondary'} onClick={() => setTimerRunning((v) => !v)}>
                  {timerRunning ? 'Timer running' : 'Start timer'}
                </Button>
                <Button size="sm" variant={hintRevealed ? 'primary' : 'secondary'} onClick={() => setHintRevealed((v) => !v)} disabled={!question?.hint}>
                  {hintRevealed ? 'Hint shown' : 'Show hint'}
                </Button>
                <Button size="sm" variant={answerRevealed ? 'primary' : 'secondary'} onClick={() => setAnswerRevealed((v) => !v)}>
                  {answerRevealed ? 'Answer shown' : 'Reveal answer'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
