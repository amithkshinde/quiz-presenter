import { create } from 'zustand';
import type { Quiz } from '../types/quiz';
import { initialQuestionState, type QuizSession } from '../types/session';
import { makeId } from '../utils/id';
import { createSyncAdapter, type SyncAdapter } from './sync';
import { clearActiveSessionId, setActiveSessionId, setLastResultsSessionId } from './activeSessions';

/** Not reactive state — an implementation detail of the sync loop, not UI. */
let applyingRemote = false;
let adapter: SyncAdapter | null = null;
let boundSessionId: string | null = null;

interface SessionStore {
  session: QuizSession | null;
  isWriter: boolean; // true on the Presenter tab that owns this session

  /** Presenter: create a brand-new live session for a quiz and become the writer. */
  startSession: (quiz: Quiz) => QuizSession;
  /** Presenter/Display/Preview: attach to an existing session id and receive updates. */
  attachAsReader: (sessionId: string) => void;
  detach: () => void;

  goLive: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  skipQuestion: () => void;

  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: (seconds: number) => void;
  tick: () => void;

  revealHint: () => void;
  revealAnswer: () => void;

  /** Returns the new ScoreEvent's id, so the caller can offer a precisely-scoped undo. */
  adjustScore: (teamId: string, delta: number) => string;
  undoScoreEvent: (eventId: string) => void;

  toggleLeaderboard: (show?: boolean) => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  endQuiz: () => void;
}

function publish(session: QuizSession) {
  adapter?.publish(session);
}

/** Wraps `set` so every writer-side mutation also broadcasts to other tabs. */
function withPublish(set: (fn: (s: SessionStore) => Partial<SessionStore>) => void, fn: (s: SessionStore) => QuizSession | null) {
  set((s) => {
    const next = fn(s);
    if (next) {
      publish(next);
      // Whichever action ends the quiz — the explicit End Quiz button, or
      // simply clicking Next past the last question — this is the one place
      // both paths pass through, so "this quiz no longer has a session in
      // progress" is recorded exactly once, however the show actually ended.
      if (next.phase === 'ended' && s.session?.phase !== 'ended') {
        clearActiveSessionId(next.quizId);
        setLastResultsSessionId(next.quizId, next.id);
      }
    }
    return { session: next };
  });
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  isWriter: false,

  startSession: (quiz) => {
    const session: QuizSession = {
      id: makeId('session'),
      quizId: quiz.id,
      phase: 'not-started',
      currentQuestionIndex: 0,
      questionIds: quiz.questions.map((q) => q.id),
      questionStates: Object.fromEntries(quiz.questions.map((q) => [q.id, initialQuestionState(q.timerSeconds)])),
      scoreEvents: [],
      showLeaderboard: false,
      displayConnected: false,
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    adapter = createSyncAdapter(session.id);
    boundSessionId = session.id;
    adapter.subscribe((remote) => {
      if (remote.id !== boundSessionId) return;
      applyingRemote = true;
      set({ session: remote });
      applyingRemote = false;
    });
    set({ session, isWriter: true });
    publish(session);
    setActiveSessionId(quiz.id, session.id);
    return session;
  },

  attachAsReader: (sessionId) => {
    if (boundSessionId === sessionId) return;
    adapter = createSyncAdapter(sessionId);
    boundSessionId = sessionId;
    const last = adapter.loadLast();
    if (last) set({ session: last, isWriter: false });
    adapter.subscribe((remote) => {
      if (remote.id !== boundSessionId) return;
      applyingRemote = true;
      set({ session: remote });
      applyingRemote = false;
    });
  },

  detach: () => {
    adapter = null;
    boundSessionId = null;
    set({ session: null, isWriter: false });
  },

  goLive: () => withPublish(set, ({ session }) => (session && session.phase === 'not-started' ? { ...session, phase: 'live' } : session)),

  nextQuestion: () =>
    withPublish(set, ({ session }) => {
      if (!session) return null;
      const lastIndex = session.questionIds.length - 1;
      if (session.currentQuestionIndex >= lastIndex) {
        return { ...session, phase: 'ended', endedAt: new Date().toISOString() };
      }
      return { ...session, currentQuestionIndex: session.currentQuestionIndex + 1, showLeaderboard: false };
    }),

  prevQuestion: () =>
    withPublish(set, ({ session }) => {
      if (!session || session.currentQuestionIndex === 0) return session;
      return { ...session, currentQuestionIndex: session.currentQuestionIndex - 1, showLeaderboard: false };
    }),

  jumpToQuestion: (index) =>
    withPublish(set, ({ session }) => {
      if (!session) return null;
      const max = session.questionIds.length - 1;
      const clamped = Math.max(0, Math.min(index, max));
      return { ...session, currentQuestionIndex: clamped, showLeaderboard: false };
    }),

  skipQuestion: () => {
    const { session } = get();
    if (!session) return;
    const qid = session.questionIds[session.currentQuestionIndex];
    withPublish(set, (s) =>
      s.session
        ? { ...s.session, questionStates: { ...s.session.questionStates, [qid]: { ...s.session.questionStates[qid], skipped: true } } }
        : null
    );
    get().nextQuestion();
  },

  startTimer: () => mutateCurrentQuestion(set, get, (q) => ({ ...q, timerStatus: 'running' })),
  pauseTimer: () => mutateCurrentQuestion(set, get, (q) => ({ ...q, timerStatus: 'paused' })),
  resumeTimer: () => mutateCurrentQuestion(set, get, (q) => ({ ...q, timerStatus: 'running' })),
  resetTimer: (seconds) => mutateCurrentQuestion(set, get, (q) => ({ ...q, timerStatus: 'idle', timerRemaining: seconds })),

  tick: () =>
    mutateCurrentQuestion(set, get, (q) => {
      if (q.timerStatus !== 'running') return q;
      const remaining = Math.max(0, q.timerRemaining - 1);
      return { ...q, timerRemaining: remaining, timerStatus: remaining === 0 ? 'expired' : 'running' };
    }),

  revealHint: () => mutateCurrentQuestion(set, get, (q) => ({ ...q, hintRevealed: true })),
  revealAnswer: () => mutateCurrentQuestion(set, get, (q) => ({ ...q, answerRevealed: true })),

  adjustScore: (teamId, delta) => {
    const id = makeId('score');
    withPublish(set, ({ session }) => {
      if (!session) return null;
      const event = { id, teamId, questionIndex: session.currentQuestionIndex, delta, timestamp: new Date().toISOString() };
      return { ...session, scoreEvents: [...session.scoreEvents, event] };
    });
    return id;
  },

  undoScoreEvent: (eventId) =>
    withPublish(set, ({ session }) => (session ? { ...session, scoreEvents: session.scoreEvents.filter((e) => e.id !== eventId) } : null)),

  toggleLeaderboard: (show) =>
    withPublish(set, ({ session }) => (session ? { ...session, showLeaderboard: show ?? !session.showLeaderboard } : null)),

  pauseQuiz: () => withPublish(set, ({ session }) => (session ? { ...session, phase: 'paused' } : null)),
  resumeQuiz: () => withPublish(set, ({ session }) => (session ? { ...session, phase: 'live' } : null)),
  endQuiz: () => withPublish(set, ({ session }) => (session ? { ...session, phase: 'ended', endedAt: new Date().toISOString() } : null)),
}));

function mutateCurrentQuestion(
  set: (fn: (s: SessionStore) => Partial<SessionStore>) => void,
  get: () => SessionStore,
  fn: (q: QuizSession['questionStates'][string]) => QuizSession['questionStates'][string]
) {
  const { session } = get();
  if (!session) return;
  const qid = session.questionIds[session.currentQuestionIndex];
  withPublish(set, (s) =>
    s.session ? { ...s.session, questionStates: { ...s.session.questionStates, [qid]: fn(s.session.questionStates[qid]) } } : null
  );
}

export function isApplyingRemoteUpdate() {
  return applyingRemote;
}
