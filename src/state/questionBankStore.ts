import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question } from '../types/quiz';
import type { BankQuestion, Difficulty } from '../types/questionBank';
import { makeId } from '../utils/id';

interface QuestionBankStore {
  entries: BankQuestion[];

  /** Copies `question` into the bank as a brand-new, independent entry — editing the quiz question afterward never touches this copy. */
  addToBank: (question: Question, opts?: { difficulty?: Difficulty; source?: string }) => BankQuestion;
  updateBankEntry: (id: string, patch: Partial<Pick<BankQuestion, 'difficulty' | 'source'>>) => void;
  removeFromBank: (id: string) => void;
}

function cloneQuestion(src: Question): Question {
  return { ...src, id: makeId('q'), options: src.options?.map((o) => ({ ...o, id: makeId('opt') })) };
}

export const useQuestionBankStore = create<QuestionBankStore>()(
  persist(
    (set) => ({
      entries: seedBank(),

      addToBank: (question, opts) => {
        const now = new Date().toISOString();
        const entry: BankQuestion = {
          id: makeId('bank'),
          question: cloneQuestion(question),
          difficulty: opts?.difficulty,
          source: opts?.source,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
        return entry;
      },

      updateBankEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)),
        })),

      removeFromBank: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    { name: 'quiz-presenter/question-bank' }
  )
);

/** A handful of standalone starter questions so the bank is useful on a fresh install, independent of any quiz. */
function seedBank(): BankQuestion[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  const mk = (q: Omit<Question, 'id'>, difficulty: Difficulty, age: number): BankQuestion => ({
    id: makeId('bank'),
    question: { ...q, id: makeId('q') },
    difficulty,
    source: 'manual',
    createdAt: daysAgo(age),
    updatedAt: daysAgo(age),
  });

  return [
    mk(
      {
        type: 'multiple-choice',
        text: 'What is the capital of Australia?',
        category: 'Geography',
        points: 10,
        hint: "It's not Sydney.",
        timerSeconds: 20,
        options: [
          { id: makeId('opt'), text: 'Sydney', isCorrect: false },
          { id: makeId('opt'), text: 'Canberra', isCorrect: true },
          { id: makeId('opt'), text: 'Melbourne', isCorrect: false },
          { id: makeId('opt'), text: 'Perth', isCorrect: false },
        ],
      },
      'easy',
      30
    ),
    mk(
      {
        type: 'text',
        text: 'Who developed the theory of general relativity?',
        category: 'Science',
        points: 15,
        hint: 'He also won a Nobel Prize for the photoelectric effect.',
        timerSeconds: 25,
        correctText: 'Albert Einstein',
      },
      'medium',
      21
    ),
    mk(
      {
        type: 'multiple-choice',
        text: 'Which gas do plants primarily absorb for photosynthesis?',
        category: 'Science',
        points: 10,
        hint: 'It also traps heat in the atmosphere.',
        timerSeconds: 20,
        options: [
          { id: makeId('opt'), text: 'Oxygen', isCorrect: false },
          { id: makeId('opt'), text: 'Nitrogen', isCorrect: false },
          { id: makeId('opt'), text: 'Carbon dioxide', isCorrect: true },
          { id: makeId('opt'), text: 'Hydrogen', isCorrect: false },
        ],
      },
      'easy',
      18
    ),
    mk(
      {
        type: 'text',
        text: 'What year did the Berlin Wall fall?',
        category: 'History',
        points: 20,
        hint: '',
        timerSeconds: 20,
        correctText: '1989',
      },
      'medium',
      14
    ),
    mk(
      {
        type: 'multiple-choice',
        text: 'Which element has the chemical symbol "Fe"?',
        category: 'Science',
        points: 25,
        hint: "It's Latin for iron.",
        timerSeconds: 20,
        options: [
          { id: makeId('opt'), text: 'Fluorine', isCorrect: false },
          { id: makeId('opt'), text: 'Iron', isCorrect: true },
          { id: makeId('opt'), text: 'Lead', isCorrect: false },
          { id: makeId('opt'), text: 'Tin', isCorrect: false },
        ],
      },
      'hard',
      9
    ),
    mk(
      {
        type: 'text',
        text: 'In tennis, what is a score of zero called?',
        category: 'Sports',
        points: 10,
        hint: '',
        timerSeconds: 15,
        correctText: 'Love',
      },
      'easy',
      4
    ),
  ];
}
