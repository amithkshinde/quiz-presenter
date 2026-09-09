import type { Question } from '../types/quiz';

export interface RoundBlock {
  category: string;
  count: number;
  startIndex: number;
}

/** Groups questions into contiguous runs sharing a category — the only "round" concept this data model has. */
export function computeRounds(questions: Question[]): RoundBlock[] {
  const rounds: RoundBlock[] = [];
  questions.forEach((q, i) => {
    const category = q.category || 'Uncategorized';
    const last = rounds[rounds.length - 1];
    if (last && last.category === category) last.count++;
    else rounds.push({ category, count: 1, startIndex: i });
  });
  return rounds;
}

export interface RoundInfo {
  roundNumber: number;
  totalRounds: number;
  category: string;
  count: number;
  isFirstOfRound: boolean;
  isLastOfRound: boolean;
}

export function getRoundInfo(questions: Question[], index: number): RoundInfo | null {
  const rounds = computeRounds(questions);
  const roundIndex = rounds.findIndex((r) => index >= r.startIndex && index < r.startIndex + r.count);
  if (roundIndex === -1) return null;
  const round = rounds[roundIndex];
  return {
    roundNumber: roundIndex + 1,
    totalRounds: rounds.length,
    category: round.category,
    count: round.count,
    isFirstOfRound: index === round.startIndex,
    isLastOfRound: index === round.startIndex + round.count - 1,
  };
}
