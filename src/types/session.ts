// Live session state — transient runtime state for one "run" of a quiz.
// Presenter Console is the only writer. Presentation Display is a pure,
// read-only projection of this shape (see: On Air §"Component structure").

export type QuizPhase = 'not-started' | 'live' | 'paused' | 'ended';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired';

export interface QuestionRuntimeState {
  timerStatus: TimerStatus;
  timerRemaining: number; // seconds
  hintRevealed: boolean;
  answerRevealed: boolean;
  skipped: boolean;
}

export function initialQuestionState(timerSeconds: number): QuestionRuntimeState {
  return {
    timerStatus: 'idle',
    timerRemaining: timerSeconds,
    hintRevealed: false,
    answerRevealed: false,
    skipped: false,
  };
}

export interface ScoreEvent {
  id: string;
  teamId: string;
  questionIndex: number | null;
  delta: number;
  timestamp: string;
}

export interface QuizSession {
  id: string;
  quizId: string;
  phase: QuizPhase;
  currentQuestionIndex: number;
  /** snapshot of question order at session start — navigation indexes into this, not into the live quiz. */
  questionIds: string[];
  /** keyed by question id */
  questionStates: Record<string, QuestionRuntimeState>;
  scoreEvents: ScoreEvent[];
  /** presenter can surface standings between questions, independent of phase */
  showLeaderboard: boolean;
  displayConnected: boolean;
  startedAt: string | null;
  endedAt: string | null;
}

export interface TeamStanding {
  teamId: string;
  name: string;
  score: number;
  rank: number;
}
