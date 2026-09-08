/**
 * Pure selectors shared by Presenter Console and Presentation Display.
 * Neither view re-derives this logic independently — both read the same
 * functions, so "what the audience sees" can never drift from
 * "what the state actually says" (see: On Air §"Component structure").
 */
import type { Question, Quiz } from '../types/quiz';
import type { QuestionRuntimeState, QuizSession } from '../types/session';
import { standings } from '../utils/scoring';

export function getCurrentQuestion(quiz: Quiz, session: QuizSession): Question | null {
  const id = session.questionIds[session.currentQuestionIndex];
  return quiz.questions.find((q) => q.id === id) ?? null;
}

export function getRuntimeState(session: QuizSession, questionId: string): QuestionRuntimeState | null {
  return session.questionStates[questionId] ?? null;
}

export function isLastQuestion(session: QuizSession): boolean {
  return session.currentQuestionIndex >= session.questionIds.length - 1;
}

export function questionProgress(session: QuizSession): { current: number; total: number } {
  return { current: session.currentQuestionIndex + 1, total: session.questionIds.length };
}

export function getStandings(quiz: Quiz, session: QuizSession) {
  return standings(quiz.teams, session.scoreEvents);
}

/** How much of the quiz is still ahead — the current question counts as "left," it hasn't been resolved yet. */
export function remainingSummary(quiz: Quiz, session: QuizSession): { questionsLeft: number; pointsLeft: number } {
  const remainingIds = new Set(session.questionIds.slice(session.currentQuestionIndex));
  const remaining = quiz.questions.filter((q) => remainingIds.has(q.id));
  return { questionsLeft: remaining.length, pointsLeft: remaining.reduce((sum, q) => sum + q.points, 0) };
}
