import type { Question, Quiz, Team } from '../types/quiz';
import type { ScoreEvent, TeamStanding } from '../types/session';

/** Sum of recorded score events only — excludes startingScore, since sessionStore has no quiz data to draw it from. */
export function scoreForTeam(events: ScoreEvent[], teamId: string): number {
  return events.filter((e) => e.teamId === teamId).reduce((sum, e) => sum + e.delta, 0);
}

/** Standard competition ranking — ties share a rank, next rank skips accordingly (deterministic: stable sort keeps original team order within a tie). */
export function standings(teams: Team[], events: ScoreEvent[]): TeamStanding[] {
  const withScores = teams
    .map((t) => ({ teamId: t.id, name: t.name, score: t.startingScore + scoreForTeam(events, t.id) }))
    .sort((a, b) => b.score - a.score);

  const result: TeamStanding[] = [];
  let rank = 0;
  let lastScore: number | null = null;
  withScores.forEach((t, i) => {
    if (lastScore === null || t.score !== lastScore) rank = i + 1;
    lastScore = t.score;
    result.push({ ...t, rank });
  });
  return result;
}

export function recentEvents(events: ScoreEvent[], count = 5): ScoreEvent[] {
  return [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, count);
}

/** How many points a team gained/lost specifically on the question immediately before the current one. */
export function changeFromPreviousQuestion(events: ScoreEvent[], teamId: string, currentQuestionIndex: number): number {
  const prevIndex = currentQuestionIndex - 1;
  return events.filter((e) => e.teamId === teamId && e.questionIndex === prevIndex).reduce((sum, e) => sum + e.delta, 0);
}

/** Consecutive most-recent questions (by question index) this team scored a positive delta on, one entry per question. */
export function computeStreak(events: ScoreEvent[], teamId: string): number {
  const byQuestion = new Map<number, number>();
  for (const e of events) {
    if (e.teamId !== teamId || e.questionIndex === null) continue;
    byQuestion.set(e.questionIndex, (byQuestion.get(e.questionIndex) ?? 0) + e.delta);
  }
  const indices = [...byQuestion.keys()].sort((a, b) => b - a);
  let streak = 0;
  for (const idx of indices) {
    if ((byQuestion.get(idx) ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

/** Effective live-scoring deltas for a question: question override → quiz config → hardcoded fallback. */
export function resolveScoreDeltas(quiz: Quiz, question: Question): { correct: number; incorrect: number; penalty: number } {
  const cfg = quiz.scoreConfig;
  const override = question.scoreOverride;
  const base = cfg?.defaultPoints ?? question.points ?? 10;
  return {
    correct: override?.correctPoints ?? cfg?.correctPoints ?? base,
    incorrect: override?.incorrectPoints ?? cfg?.incorrectPoints ?? 0,
    penalty: override?.penaltyPoints ?? cfg?.penaltyPoints ?? -5,
  };
}
