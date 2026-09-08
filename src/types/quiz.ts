// Authored content — persists independently of any live session.
// See: Control Room, Center Stage §1 (Core Entities) for the rationale
// behind separating authored content from live session state.

export type QuestionType = 'multiple-choice' | 'text' | 'image';

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
  mediaUrl?: string;
  timerSeconds: number;
  /** multiple-choice only */
  options?: AnswerOption[];
  /** text-answer only — shown to the host as "the" answer */
  correctText?: string;
}

export interface Team {
  id: string;
  name: string;
}

export type QuizStatus = 'draft' | 'ready' | 'archived';

export interface Quiz {
  id: string;
  title: string;
  status: QuizStatus;
  questions: Question[];
  teams: Team[];
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
  if (!q.text.trim()) return false;
  if (q.type === 'multiple-choice') {
    return !!q.options && q.options.length >= 2 && q.options.some((o) => o.isCorrect);
  }
  if (q.type === 'text' || q.type === 'image') {
    return !!q.correctText?.trim();
  }
  return true;
}
