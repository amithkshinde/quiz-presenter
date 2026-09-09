// Authored content — persists independently of any live session.
// See: Control Room, Center Stage §1 (Core Entities) for the rationale
// behind separating authored content from live session state.

export type QuestionType = 'multiple-choice' | 'text' | 'image' | 'audio' | 'video';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  category: string;
  points: number;
  hint: string; // '' means "no hint for this question"
  explanation?: string; // shown to participants after the answer is revealed
  presenterNotes?: string; // host-only, never shown to participants
  mediaUrl?: string; // legacy/direct URL fallback — prefer mediaId
  mediaId?: string; // references a MediaAsset (state/mediaStore.ts)
  durationSeconds?: number; // audio/video only
  timerSeconds: number;
  /** multiple-choice only */
  options?: AnswerOption[];
  /** text/image/audio/video — shown to the host as "the" answer */
  correctText?: string;
  /** text-answer only */
  alternativeAnswers?: string[];
  caseSensitive?: boolean;
  /** per-question overrides of the quiz's live-scoring deltas — falls back to Quiz.scoreConfig, then hardcoded defaults */
  scoreOverride?: ScoreDeltaOverrides;
}

export interface ScoreDeltaOverrides {
  correctPoints?: number;
  incorrectPoints?: number;
  penaltyPoints?: number;
}

/** Quiz-level defaults for the live-scoring quick-actions — independent of a question's authored `points`. */
export interface ScoreConfig extends ScoreDeltaOverrides {
  defaultPoints: number;
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  avatar: string; // emoji or short glyph
  startingScore: number;
  members: TeamMember[];
}

export type QuizStatus = 'draft' | 'ready' | 'archived';

export interface Quiz {
  id: string;
  title: string;
  status: QuizStatus;
  questions: Question[];
  teams: Team[];
  scoreConfig?: ScoreConfig;
  createdAt: string;
  updatedAt: string;
}

export function isQuizReady(quiz: Quiz): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (quiz.questions.length === 0) reasons.push('Add at least one question');
  if (quiz.teams.length === 0) reasons.push('Add at least one team');
  const incomplete = quiz.questions.filter((q) => !isQuestionComplete(q));
  if (incomplete.length > 0) reasons.push(`${incomplete.length} question${incomplete.length > 1 ? 's are' : ' is'} incomplete`);
  return { ready: reasons.length === 0, reasons };
}

export function isQuestionComplete(q: Question): boolean {
  return getQuestionWarnings(q).length === 0;
}

const MEDIA_TYPES: QuestionType[] = ['image', 'audio', 'video'];

/** Specific, actionable warnings — used by both the question list badges and the editor drawer. Never blocks saving. */
export function getQuestionWarnings(q: Question): string[] {
  const warnings: string[] = [];
  if (!q.text.trim()) warnings.push('Missing question text');
  if (MEDIA_TYPES.includes(q.type) && !q.mediaUrl && !q.mediaId) warnings.push('Missing media');
  if (q.type === 'multiple-choice') {
    const options = q.options ?? [];
    if (!options.some((o) => o.isCorrect && o.text.trim())) warnings.push('Missing correct option');
  } else if (!q.correctText?.trim()) {
    warnings.push('Missing answer');
  }
  if (!Number.isFinite(q.points) || q.points <= 0) warnings.push('Invalid points');
  if (!Number.isFinite(q.timerSeconds) || q.timerSeconds <= 0) warnings.push('Invalid timer');
  return warnings;
}
