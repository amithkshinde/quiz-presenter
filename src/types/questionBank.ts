import type { Question } from './quiz';

// A reusable repository of questions, independent of any single quiz — see
// Control Room, Question Bank for the rationale. Each entry owns its own
// copy of a Question; nothing here is a live reference into a quiz, so
// editing a quiz's question never touches its bank entry and vice versa.
// Designed to also back future features (quiz templates, AI-generated
// questions, shared collections, import/export) without a shape change.

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface BankQuestion {
  id: string;
  question: Question;
  difficulty?: Difficulty;
  /** free-text provenance — e.g. the quiz title it was saved from, 'manual', 'import', 'ai' */
  source?: string;
  createdAt: string;
  updatedAt: string;
}
