// Live session state — transient runtime state for one "run" of a quiz.
// Presenter Console is the only writer. Presentation Display is a pure,
// read-only projection of this shape (see: On Air §"Component structure").

export type QuizPhase = 'not-started' | 'live' | 'paused' | 'ended';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired';

/** Audio/video playback for the current question — Presenter is the sole writer, Display/Preview only read it. */
export type MediaPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface MediaPlaybackState {
  status: MediaPlaybackStatus;
  position: number; // seconds — authoritative, set by the presenter
  seekToken: number; // bumped on every explicit seek/restart so a reader applies the jump exactly once
  skipped: boolean; // presenter chose to continue this question without media
  error?: string;
}

export function initialMediaState(): MediaPlaybackState {
  return { status: 'idle', position: 0, seekToken: 0, skipped: false };
}

export interface QuestionRuntimeState {
  timerStatus: TimerStatus;
  timerRemaining: number; // seconds
  hintRevealed: boolean;
  answerRevealed: boolean;
  skipped: boolean;
  media: MediaPlaybackState;
}

export function initialQuestionState(timerSeconds: number): QuestionRuntimeState {
  return {
    timerStatus: 'idle',
    timerRemaining: timerSeconds,
    hintRevealed: false,
    answerRevealed: false,
    skipped: false,
    media: initialMediaState(),
  };
}

export interface ScoreEvent {
  id: string;
  teamId: string;
  questionIndex: number | null;
  /** the question's category at the time of scoring — the closest existing grouping concept to "round" */
  round: string;
  delta: number;
  previousScore: number;
  newScore: number;
  timestamp: string;
  /** shared by every event created from one "Apply Scores" action, so the whole application can be undone together */
  batchId?: string;
}

export type RoundBannerState = 'none' | 'intro' | 'complete';

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
  /** presenter-triggered round section-break overlay — same idiom as showLeaderboard, cleared automatically on navigation */
  roundBanner: RoundBannerState;
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
