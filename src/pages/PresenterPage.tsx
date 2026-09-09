import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSessionStore } from '../state/sessionStore';
import { useQuizStore } from '../state/quizStore';
import { createPresenceChannel, createPresenterPresenceChannel } from '../state/sync';
import { getCurrentQuestion, getRuntimeState, isLastQuestion, questionProgress, remainingSummary } from '../state/derive';
import { getRoundInfo } from '../utils/rounds';
import { useTimedOut } from '../hooks/useTimedOut';
import { makeId } from '../utils/id';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { QuestionNavRail } from '../components/presenter/QuestionNavRail';
import { QuestionPanel } from '../components/presenter/QuestionPanel';
import { AnswerCard, type AnswerCardHandle } from '../components/presenter/AnswerCard';
import { HintCard } from '../components/presenter/HintCard';
import { PresenterNotesCard } from '../components/presenter/PresenterNotesCard';
import { TimerControl } from '../components/presenter/TimerControl';
import { ScoreboardRail } from '../components/presenter/ScoreboardRail';
import { ScoringPanel } from '../components/presenter/ScoringPanel';
import styles from './PresenterPage.module.css';

const PRESENCE_TIMEOUT_MS = 5000;

export function PresenterPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = useSessionStore((s) => s.session);
  const attachAsReader = useSessionStore((s) => s.attachAsReader);
  const goLive = useSessionStore((s) => s.goLive);
  const nextQuestion = useSessionStore((s) => s.nextQuestion);
  const prevQuestion = useSessionStore((s) => s.prevQuestion);
  const jumpToQuestion = useSessionStore((s) => s.jumpToQuestion);
  const skipQuestion = useSessionStore((s) => s.skipQuestion);
  const startTimer = useSessionStore((s) => s.startTimer);
  const pauseTimer = useSessionStore((s) => s.pauseTimer);
  const resumeTimer = useSessionStore((s) => s.resumeTimer);
  const resetTimer = useSessionStore((s) => s.resetTimer);
  const tick = useSessionStore((s) => s.tick);
  const revealHint = useSessionStore((s) => s.revealHint);
  const revealAnswer = useSessionStore((s) => s.revealAnswer);
  const adjustScore = useSessionStore((s) => s.adjustScore);
  const undoScoreEvent = useSessionStore((s) => s.undoScoreEvent);
  const applyScores = useSessionStore((s) => s.applyScores);
  const undoScoreBatch = useSessionStore((s) => s.undoScoreBatch);
  const toggleLeaderboard = useSessionStore((s) => s.toggleLeaderboard);
  const setRoundBanner = useSessionStore((s) => s.setRoundBanner);
  const pauseQuiz = useSessionStore((s) => s.pauseQuiz);
  const resumeQuiz = useSessionStore((s) => s.resumeQuiz);
  const endQuiz = useSessionStore((s) => s.endQuiz);

  const quiz = useQuizStore((s) => (session ? s.quizzes.find((q) => q.id === session.quizId) : undefined));
  const sessionTimedOut = useTimedOut(!!session, sessionId ?? '');
  const quizTimedOut = useTimedOut(!!quiz, session?.quizId ?? '');

  const [displayConnected, setDisplayConnected] = useState(false);
  const [otherPresenterOpen, setOtherPresenterOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [hasPendingScores, setHasPendingScores] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const answerCardRef = useRef<AnswerCardHandle>(null);
  const presenterInstanceId = useRef(makeId('presenter'));

  // A navigation action the presenter took while a scoring row was half-filled
  // (typed but not applied) goes through this guard instead of running
  // immediately — silently discarding an in-progress score is exactly the
  // "accidental navigation" a live host can't recover from mid-show.
  function guardedNav(action: () => void) {
    if (hasPendingScores) setPendingNav(() => action);
    else action();
  }

  useEffect(() => {
    if (sessionId) attachAsReader(sessionId);
  }, [sessionId, attachAsReader]);

  // Presence: Display announces itself; if we don't hear from it for a while, flag it disconnected.
  useEffect(() => {
    if (!sessionId) return;
    const presence = createPresenceChannel(sessionId);
    let timeout: number;
    const resetTimeout = () => {
      setDisplayConnected(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setDisplayConnected(false), PRESENCE_TIMEOUT_MS);
    };
    const unsubscribe = presence.subscribeToPresence(resetTimeout);
    return () => {
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [sessionId]);

  // A second Presenter Console for the same session (a duplicated tab, or
  // another device) can issue the same commands with no coordination between
  // them — whichever one publishes last quietly wins. Both tabs announce
  // themselves and flag it the moment they hear a different instance.
  useEffect(() => {
    if (!sessionId) return;
    const presence = createPresenterPresenceChannel(sessionId);
    const instanceId = presenterInstanceId.current;
    let timeout: number;
    const onOther = () => {
      setOtherPresenterOpen(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setOtherPresenterOpen(false), PRESENCE_TIMEOUT_MS);
    };
    const unsubscribe = presence.subscribeToOthers(instanceId, onOther);
    presence.announce(instanceId);
    const interval = window.setInterval(() => presence.announce(instanceId), 2000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [sessionId]);

  const question = quiz && session ? getCurrentQuestion(quiz, session) : null;
  const runtimeState = question && session ? getRuntimeState(session, question.id) : null;
  const roundInfo = quiz && session ? getRoundInfo(quiz.questions, session.currentQuestionIndex) : null;

  useEffect(() => setHasPendingScores(false), [question?.id]);

  // Timer ticking — only the writer (this console) drives time forward.
  useEffect(() => {
    if (!runtimeState || runtimeState.timerStatus !== 'running') return;
    const interval = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(interval);
  }, [runtimeState?.timerStatus, tick]);

  // Keyboard shortcuts — inert while a text field has focus.
  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement;
      return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
    }
    function onKeyDown(e: KeyboardEvent) {
      if (isTyping(e.target) || !session || session.phase !== 'live') return;
      if (e.key === 'ArrowRight') guardedNav(nextQuestion);
      else if (e.key === 'ArrowLeft') guardedNav(prevQuestion);
      else if (e.key === ' ') {
        e.preventDefault();
        if (!runtimeState) return;
        if (runtimeState.timerStatus === 'running') pauseTimer();
        else if (runtimeState.timerStatus === 'paused') resumeTimer();
        else if (runtimeState.timerStatus === 'idle') startTimer();
      } else if (e.key === 'h' || e.key === 'H') revealHint();
      else if (e.key === 'a' || e.key === 'A') answerCardRef.current?.triggerFromKeyboard();
      else if (e.key === 'Escape') answerCardRef.current?.cancelArm();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, runtimeState, nextQuestion, prevQuestion, pauseTimer, resumeTimer, startTimer, revealHint, hasPendingScores]);

  if (!session) {
    if (sessionTimedOut) {
      return (
        <div className={`console-scope ${styles.notFound}`}>
          <h1>Session not found</h1>
          <p>This link doesn't point at a quiz session — it may have already ended, or the link is wrong.</p>
          <Link to="/" className={styles.notFoundLink}>← Back to Quiz Library</Link>
        </div>
      );
    }
    return (
      <div className={`console-scope ${styles.loading}`}>
        <span className={styles.dots}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></span>
        Loading session…
      </div>
    );
  }
  if (!quiz) {
    if (quizTimedOut) {
      return (
        <div className={`console-scope ${styles.notFound}`}>
          <h1>Quiz not found</h1>
          <p>This session belongs to a quiz that's no longer on this device.</p>
          <Link to="/" className={styles.notFoundLink}>← Back to Quiz Library</Link>
        </div>
      );
    }
    return (
      <div className={`console-scope ${styles.loading}`}>
        <span className={styles.dots}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /></span>
        Loading quiz…
      </div>
    );
  }

  const progress = questionProgress(session);
  const remaining = remainingSummary(quiz, session);

  return (
    <div className={`console-scope ${styles.shell}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.brandLink}>{quiz.title}</Link>
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.progress}>
            Question {progress.current} of {progress.total}
            {roundInfo && <> · Round {roundInfo.roundNumber} of {roundInfo.totalRounds} — {roundInfo.category}</>}
            <span className={styles.progressDetail}> · {remaining.questionsLeft} left · {remaining.pointsLeft} pts on the board</span>
          </span>
          <div className={styles.progressBar}><span style={{ width: `${(progress.current / progress.total) * 100}%` }} /></div>
        </div>
        <div className={styles.headerRight}>
          {roundInfo && (roundInfo.isFirstOfRound || roundInfo.isLastOfRound) && (
            <Button
              size="sm"
              variant={(session.roundBanner ?? 'none') !== 'none' ? 'primary' : 'secondary'}
              onClick={() => setRoundBanner((session.roundBanner ?? 'none') !== 'none' ? 'none' : roundInfo.isLastOfRound ? 'complete' : 'intro')}
            >
              {(session.roundBanner ?? 'none') !== 'none' ? 'Showing round banner ●' : roundInfo.isLastOfRound ? 'Show Round Complete' : 'Show Round Intro'}
            </Button>
          )}
          <span className={styles.presence}>
            <span className={`${styles.presenceDot} ${displayConnected ? styles.presenceOk : styles.presenceWarn}`} />
            {displayConnected ? 'Display connected' : 'Display reconnecting…'}
          </span>
          {session.phase === 'live' && <Button size="sm" onClick={pauseQuiz}>Pause</Button>}
          {session.phase === 'paused' && <Button size="sm" variant="primary" onClick={resumeQuiz}>Resume</Button>}
          <Button size="sm" variant="danger" onClick={() => setEndConfirmOpen(true)}>End Quiz</Button>
        </div>
      </header>

      {otherPresenterOpen && (
        <div className={styles.duplicateWarning}>
          ⚠ Another Presenter Console is open for this session — actions from both may conflict. Close the other tab if this one isn't it.
        </div>
      )}

      {session.phase === 'not-started' && (
        <div className={styles.goLiveWrap}>
          <div className={styles.goLiveCard}>
            <h2>Ready — not yet live</h2>
            <p>The Presentation Display is showing the welcome screen. Go live when the room is ready.</p>
            <Button variant="primary" onClick={goLive}>Go Live →</Button>
          </div>
        </div>
      )}

      {session.phase === 'paused' && (
        <div className={styles.pausedBanner}>Quiz paused — participants see a calm "Quiz Paused" screen. Your console stays fully usable.</div>
      )}

      {(session.phase === 'live' || session.phase === 'paused') && (
        <>
          <div className={styles.body}>
            <nav className={styles.navRail}>
              <QuestionNavRail questions={quiz.questions} session={session} onJump={(i) => guardedNav(() => jumpToQuestion(i))} />
            </nav>

            <main className={styles.stage}>
              {question && runtimeState ? (
                <>
                  <QuestionPanel
                    question={question}
                    runtimeState={runtimeState}
                    onRequestReveal={() => answerCardRef.current?.triggerFromKeyboard()}
                  />
                  <TimerControl
                    runtimeState={runtimeState}
                    totalSeconds={question.timerSeconds}
                    onStart={startTimer}
                    onPause={pauseTimer}
                    onResume={resumeTimer}
                    onReset={() => resetTimer(question.timerSeconds)}
                  />
                  <div className={styles.cards}>
                    <AnswerCard ref={answerCardRef} question={question} revealed={runtimeState.answerRevealed} onReveal={revealAnswer} />
                    <HintCard hint={question.hint} revealed={runtimeState.hintRevealed} onReveal={revealHint} />
                    <PresenterNotesCard notes={question.presenterNotes} />
                  </div>
                  {runtimeState.answerRevealed && (
                    <ScoringPanel
                      quiz={quiz}
                      question={question}
                      scoreEvents={session.scoreEvents}
                      questionNumber={progress.current}
                      onApply={applyScores}
                      onUndoBatch={undoScoreBatch}
                      onPendingChange={setHasPendingScores}
                    />
                  )}
                </>
              ) : (
                <div className={styles.stageError}>
                  <p>This question couldn't be loaded.</p>
                  <p className={styles.stageErrorHint}>Try another question from the list on the left, or check the quiz in the editor.</p>
                </div>
              )}
            </main>

            <aside className={styles.scoreRail}>
              <ScoreboardRail
                quizId={quiz.id}
                teams={quiz.teams}
                scoreEvents={session.scoreEvents}
                currentQuestionIndex={session.currentQuestionIndex}
                round={question?.category || 'Round'}
                onAdjust={adjustScore}
                onUndo={undoScoreEvent}
                showLeaderboard={session.showLeaderboard}
                onToggleLeaderboard={() => toggleLeaderboard()}
              />
            </aside>
          </div>

          {/* Previous and Next bookend the row as the one pair that matters most;
              Skip sits quietly beside Next — related to it, never mistaken for it. */}
          <footer className={styles.transport}>
            <Button onClick={() => guardedNav(prevQuestion)} disabled={session.currentQuestionIndex === 0}>← Previous</Button>
            <span className={styles.transportSpacer} />
            <span className={styles.kbdHint}>→ next · space timer · h hint · a answer</span>
            <Button variant="ghost" size="sm" onClick={() => guardedNav(skipQuestion)}>Skip (unscored)</Button>
            <Button variant="primary" onClick={() => guardedNav(nextQuestion)}>
              {isLastQuestion(session) ? 'Finish Quiz →' : 'Next →'}
            </Button>
          </footer>
        </>
      )}

      {session.phase === 'ended' && (
        <div className={styles.goLiveWrap}>
          <div className={styles.goLiveCard}>
            <h2>Quiz complete</h2>
            <p>Final results are showing on the Presentation Display.</p>
            <Link to={`/quizzes/${quiz.id}/results/${session.id}`}><Button variant="primary">View results →</Button></Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={endConfirmOpen}
        title="End quiz now?"
        description="Final scores will be shown on the Presentation Display. This can't be undone."
        confirmLabel="End Quiz"
        danger
        onCancel={() => setEndConfirmOpen(false)}
        onConfirm={() => {
          endQuiz();
          setEndConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!pendingNav}
        title="Leave without applying scores?"
        description="You've entered score changes for this question that haven't been applied yet. Moving on will discard them."
        confirmLabel="Discard & Continue"
        danger
        onCancel={() => setPendingNav(null)}
        onConfirm={() => {
          pendingNav?.();
          setHasPendingScores(false);
          setPendingNav(null);
        }}
      />
    </div>
  );
}
