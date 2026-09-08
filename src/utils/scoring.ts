import type { Team } from '../types/quiz';
import type { ScoreEvent, TeamStanding } from '../types/session';

export function scoreForTeam(events: ScoreEvent[], teamId: string): number {
  return events.filter((e) => e.teamId === teamId).reduce((sum, e) => sum + e.delta, 0);
}

/** Standard competition ranking — ties share a rank, next rank skips accordingly. */
export function standings(teams: Team[], events: ScoreEvent[]): TeamStanding[] {
  const withScores = teams
    .map((t) => ({ teamId: t.id, name: t.name, score: scoreForTeam(events, t.id) }))
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
