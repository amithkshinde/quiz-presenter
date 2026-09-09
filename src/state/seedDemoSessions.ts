import type { Quiz } from '../types/quiz';
import { initialMediaState, initialQuestionState, type QuestionRuntimeState, type QuizSession, type ScoreEvent } from '../types/session';
import { makeId } from '../utils/id';
import { setActiveSessionId, setLastResultsSessionId } from './activeSessions';

/**
 * Builds realistic score events from a compact per-question outcomes grid —
 * outcomes[questionIndex][teamIndex] is the point delta for that team on
 * that question (0 = no attempt / already accounted for). Timestamps are
 * spread out so the session reads like it actually happened over time.
 */
function buildScoreEvents(quiz: Quiz, outcomes: number[][], startedAtMs: number): ScoreEvent[] {
  const events: ScoreEvent[] = [];
  const running: Record<string, number> = {};
  let t = startedAtMs;
  outcomes.forEach((deltas, questionIndex) => {
    deltas.forEach((delta, teamIndex) => {
      if (delta === 0) return;
      const teamId = quiz.teams[teamIndex].id;
      const previousScore = running[teamId] ?? 0;
      const newScore = previousScore + delta;
      running[teamId] = newScore;
      events.push({
        id: makeId('score'),
        teamId,
        questionIndex,
        round: quiz.questions[questionIndex]?.category || 'Round',
        delta,
        previousScore,
        newScore,
        timestamp: new Date(t).toISOString(),
      });
      t += 12000 + Math.floor(Math.random() * 8000);
    });
  });
  return events;
}

// [Alpha, Bravo, Charlie, Delta] deltas per question. Positive = correct
// (worth that question's points), negative = an early wrong buzz-in penalty.
const LIVE_OUTCOMES: number[][] = [
  [10, 10, 10, 10],
  [10, -5, 10, 10],
  [10, 10, 10, 10],
  [10, 10, -5, 10],
  [10, 10, 10, 10],
  [15, 15, 15, -5],
  [15, -5, 15, 15],
  [15, 15, 15, 15],
];

const ENDED_OUTCOMES: number[][] = [
  ...LIVE_OUTCOMES,
  [20, 20, 20, -10],
  [20, 20, 20, 20],
  [20, -10, 20, 20],
  [20, 20, -10, 20],
  [25, 25, 25, 25],
  [25, -5, 25, -5],
  [25, 25, -5, 25],
  [-5, 25, 25, 25],
  [30, 30, 30, 30],
  [30, -10, 30, -10],
  [30, 30, -10, 30],
  [-10, 30, 30, -10],
];

function resolvedState(hintRevealed: boolean): QuestionRuntimeState {
  return { timerStatus: 'expired', timerRemaining: 0, hintRevealed, answerRevealed: true, skipped: false, media: initialMediaState() };
}

/** A quiz mid-way through: questions 1-8 already played, question 9 live with the hint out and the clock almost gone. */
export function buildLiveSession(quiz: Quiz): QuizSession {
  const startedAtMs = Date.now() - 24 * 60 * 1000; // "started 24 minutes ago"
  const questionStates: Record<string, QuestionRuntimeState> = {};

  quiz.questions.forEach((q, i) => {
    if (i < 5) questionStates[q.id] = resolvedState(false); // easy questions — no hint needed
    else if (i < 8) questionStates[q.id] = resolvedState(true); // medium questions — hint was used
    else if (i === 8) {
      // Paused rather than running: a live countdown would race to zero within
      // seconds of the page loading, giving nothing stable to inspect. Paused
      // at 4s keeps the "nearly expired" critical state on screen indefinitely
      // until the reviewer presses Resume themselves.
      questionStates[q.id] = { timerStatus: 'paused', timerRemaining: 4, hintRevealed: true, answerRevealed: false, skipped: false, media: initialMediaState() };
    }
    else questionStates[q.id] = initialQuestionState(q.timerSeconds); // untouched — "before hint" baseline
  });

  return {
    id: makeId('session'),
    quizId: quiz.id,
    phase: 'live',
    currentQuestionIndex: 8,
    questionIds: quiz.questions.map((q) => q.id),
    questionStates,
    scoreEvents: buildScoreEvents(quiz, LIVE_OUTCOMES, startedAtMs),
    showLeaderboard: false,
    roundBanner: 'none',
    displayConnected: true,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: null,
  };
}

/** The same quiz, played all the way through, for exercising the final leaderboard / results screens. */
export function buildEndedSession(quiz: Quiz): QuizSession {
  const startedAtMs = Date.now() - 58 * 60 * 1000; // "started 58 minutes ago"
  const endedAtMs = Date.now() - 3 * 60 * 1000; // "ended 3 minutes ago"
  const questionStates: Record<string, QuestionRuntimeState> = {};
  quiz.questions.forEach((q, i) => {
    questionStates[q.id] = resolvedState(i >= 5); // hint used from the medium questions onward
  });

  return {
    id: makeId('session'),
    quizId: quiz.id,
    phase: 'ended',
    currentQuestionIndex: quiz.questions.length - 1,
    questionIds: quiz.questions.map((q) => q.id),
    questionStates,
    scoreEvents: buildScoreEvents(quiz, ENDED_OUTCOMES, startedAtMs),
    showLeaderboard: true,
    roundBanner: 'none',
    displayConnected: true,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
  };
}

const SESSION_KEY = (id: string) => `quiz-presenter/session/${id}`;

/**
 * Writes both demo sessions directly to the same storage shape the sync
 * adapter reads (see state/sync.ts), and registers them through the same
 * active-session / last-results registry a real run uses — so the Library's
 * "Resume live session" / "View last results" affordances are one real
 * feature, not a demo-only special case. Runs once, on a cold start only.
 */
export function seedDemoSessions(quiz: Quiz): void {
  const live = buildLiveSession(quiz);
  const ended = buildEndedSession(quiz);
  localStorage.setItem(SESSION_KEY(live.id), JSON.stringify({ rev: 1, session: live }));
  localStorage.setItem(SESSION_KEY(ended.id), JSON.stringify({ rev: 1, session: ended }));
  setActiveSessionId(quiz.id, live.id);
  setLastResultsSessionId(quiz.id, ended.id);
}
