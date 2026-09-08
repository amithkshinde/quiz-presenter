import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerOption, Question, QuestionType, Quiz, Team } from '../types/quiz';
import { makeId } from '../utils/id';
import { seedQuiz } from './seed';
import { seedDemoSessions } from './seedDemoSessions';

interface QuizStore {
  quizzes: Quiz[];

  createQuiz: (title: string) => Quiz;
  duplicateQuiz: (id: string) => Quiz | null;
  archiveQuiz: (id: string) => void;
  renameQuiz: (id: string, title: string) => void;
  getQuiz: (id: string) => Quiz | undefined;

  addQuestion: (quizId: string, type: QuestionType) => Question | null;
  updateQuestion: (quizId: string, questionId: string, patch: Partial<Question>) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  duplicateQuestion: (quizId: string, questionId: string) => void;
  moveQuestion: (quizId: string, index: number, direction: -1 | 1) => void;
  reorderQuestions: (quizId: string, fromIndex: number, toIndex: number) => void;

  addOption: (quizId: string, questionId: string) => void;
  updateOption: (quizId: string, questionId: string, optionId: string, patch: Partial<AnswerOption>) => void;
  setCorrectOption: (quizId: string, questionId: string, optionId: string) => void;
  removeOption: (quizId: string, questionId: string, optionId: string) => void;

  addTeam: (quizId: string, name: string) => void;
  renameTeam: (quizId: string, teamId: string, name: string) => void;
  removeTeam: (quizId: string, teamId: string) => void;
}

function touch(quiz: Quiz): Quiz {
  return { ...quiz, updatedAt: new Date().toISOString() };
}

function blankQuestion(type: QuestionType): Question {
  const base: Question = {
    id: makeId('q'),
    type,
    text: '',
    category: '',
    points: 10,
    hint: '',
    timerSeconds: 30,
  };
  if (type === 'multiple-choice') {
    base.options = [
      { id: makeId('opt'), text: '', isCorrect: false },
      { id: makeId('opt'), text: '', isCorrect: false },
    ];
  }
  return base;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizzes: [seedQuiz()],

      createQuiz: (title) => {
        const quiz: Quiz = {
          id: makeId('quiz'),
          title: title.trim() || 'Untitled Quiz',
          status: 'draft',
          questions: [],
          teams: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ quizzes: [quiz, ...s.quizzes] }));
        return quiz;
      },

      duplicateQuiz: (id) => {
        const src = get().quizzes.find((q) => q.id === id);
        if (!src) return null;
        const copy: Quiz = {
          ...src,
          id: makeId('quiz'),
          title: `${src.title} (copy)`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          questions: src.questions.map((q) => ({ ...q, id: makeId('q'), options: q.options?.map((o) => ({ ...o, id: makeId('opt') })) })),
          teams: src.teams.map((t) => ({ ...t, id: makeId('team') })),
        };
        set((s) => ({ quizzes: [copy, ...s.quizzes] }));
        return copy;
      },

      archiveQuiz: (id) =>
        set((s) => ({ quizzes: s.quizzes.map((q) => (q.id === id ? touch({ ...q, status: 'archived' }) : q)) })),

      renameQuiz: (id, title) =>
        set((s) => ({ quizzes: s.quizzes.map((q) => (q.id === id ? touch({ ...q, title }) : q)) })),

      getQuiz: (id) => get().quizzes.find((q) => q.id === id),

      addQuestion: (quizId, type) => {
        const quiz = get().quizzes.find((q) => q.id === quizId);
        if (!quiz) return null;
        const question = blankQuestion(type);
        set((s) => ({
          quizzes: s.quizzes.map((q) => (q.id === quizId ? touch({ ...q, questions: [...q.questions, question] }) : q)),
        }));
        return question;
      },

      updateQuestion: (quizId, questionId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({ ...q, questions: q.questions.map((qq) => (qq.id === questionId ? { ...qq, ...patch } : qq)) })
          ),
        })),

      deleteQuestion: (quizId, questionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId ? q : touch({ ...q, questions: q.questions.filter((qq) => qq.id !== questionId) })
          ),
        })),

      duplicateQuestion: (quizId, questionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const idx = q.questions.findIndex((qq) => qq.id === questionId);
            if (idx === -1) return q;
            const src = q.questions[idx];
            const copy: Question = { ...src, id: makeId('q'), options: src.options?.map((o) => ({ ...o, id: makeId('opt') })) };
            const questions = [...q.questions];
            questions.splice(idx + 1, 0, copy);
            return touch({ ...q, questions });
          }),
        })),

      moveQuestion: (quizId, index, direction) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const target = index + direction;
            if (target < 0 || target >= q.questions.length) return q;
            const questions = [...q.questions];
            [questions[index], questions[target]] = [questions[target], questions[index]];
            return touch({ ...q, questions });
          }),
        })),

      reorderQuestions: (quizId, fromIndex, toIndex) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            if (fromIndex === toIndex) return q;
            const questions = [...q.questions];
            const [moved] = questions.splice(fromIndex, 1);
            questions.splice(toIndex, 0, moved);
            return touch({ ...q, questions });
          }),
        })),

      addOption: (quizId, questionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  questions: q.questions.map((qq) =>
                    qq.id === questionId ? { ...qq, options: [...(qq.options ?? []), { id: makeId('opt'), text: '', isCorrect: false }] } : qq
                  ),
                })
          ),
        })),

      updateOption: (quizId, questionId, optionId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  questions: q.questions.map((qq) =>
                    qq.id !== questionId ? qq : { ...qq, options: qq.options?.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) }
                  ),
                })
          ),
        })),

      setCorrectOption: (quizId, questionId, optionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  questions: q.questions.map((qq) =>
                    qq.id !== questionId ? qq : { ...qq, options: qq.options?.map((o) => ({ ...o, isCorrect: o.id === optionId })) }
                  ),
                })
          ),
        })),

      removeOption: (quizId, questionId, optionId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  questions: q.questions.map((qq) =>
                    qq.id !== questionId ? qq : { ...qq, options: qq.options?.filter((o) => o.id !== optionId) }
                  ),
                })
          ),
        })),

      addTeam: (quizId, name) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => (q.id === quizId ? touch({ ...q, teams: [...q.teams, { id: makeId('team'), name }] }) : q)),
        })),

      renameTeam: (quizId, teamId, name) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId ? q : touch({ ...q, teams: q.teams.map((t) => (t.id === teamId ? { ...t, name } : t)) })
          ),
        })),

      removeTeam: (quizId, teamId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => (q.id !== quizId ? q : touch({ ...q, teams: q.teams.filter((t) => t.id !== teamId) }))),
        })),
    }),
    { name: 'quiz-presenter/quizzes' }
  )
);

export function newTeamNameSuggestion(existing: Team[]): string {
  return `Team ${existing.length + 1}`;
}

// The seed quiz is generated once in memory on a cold start. Force it to
// persist immediately so its id stays stable across reloads and across
// windows (the Presentation Display opens in a separate window and must
// resolve the same quiz id the session was started with). The same moment
// is used to seed two demo sessions against it — one live and in-progress,
// one completed — so the product can be evaluated as a real quiz already
// under way rather than an empty shell.
if (typeof window !== 'undefined' && !window.localStorage.getItem('quiz-presenter/quizzes')) {
  useQuizStore.setState((s) => ({ quizzes: s.quizzes }));
  seedDemoSessions(useQuizStore.getState().quizzes[0]);
}

// Quiz edits (adding a late team, fixing a typo) happen in whichever tab the
// host has open, but the Presentation Display is always a *different* tab —
// without this, a team added from the Presenter Console would sit invisible
// on stage until someone thought to reload it. The live session itself syncs
// over its own channel (see state/sync.ts); this is the equivalent for the
// authored quiz content the session reads teams and questions from.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'quiz-presenter/quizzes') {
      void useQuizStore.persist.rehydrate();
    }
  });
}
