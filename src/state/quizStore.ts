import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerOption, Question, QuestionType, Quiz, ScoreConfig, Team, TeamMember } from '../types/quiz';
import { makeId } from '../utils/id';
import { seedQuiz } from './seed';
import { seedDemoSessions } from './seedDemoSessions';

export const TEAM_COLOR_PALETTE = ['#e5533c', '#3c7fe5', '#3cae5c', '#e5b23c', '#9c5ce5', '#e53c94', '#3ce5d0', '#e57a3c'];
export const TEAM_AVATAR_PALETTE = ['🦁', '🐯', '🦅', '🐺', '🦈', '🐉', '⚡', '🔥', '🌊', '⭐', '🐸', '🦊'];

interface QuizStore {
  quizzes: Quiz[];

  createQuiz: (title: string) => Quiz;
  duplicateQuiz: (id: string) => Quiz | null;
  archiveQuiz: (id: string) => void;
  renameQuiz: (id: string, title: string) => void;
  getQuiz: (id: string) => Quiz | undefined;

  addQuestion: (quizId: string, type: QuestionType) => Question | null;
  /** Inserts a full question object (regenerating ids) — used by duplicate-from-bank and import. */
  addQuestionFromTemplate: (quizId: string, template: Question) => Question | null;
  updateQuestion: (quizId: string, questionId: string, patch: Partial<Question>) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  duplicateQuestion: (quizId: string, questionId: string) => void;
  moveQuestion: (quizId: string, index: number, direction: -1 | 1) => void;
  reorderQuestions: (quizId: string, fromIndex: number, toIndex: number) => void;

  addOption: (quizId: string, questionId: string) => void;
  updateOption: (quizId: string, questionId: string, optionId: string, patch: Partial<AnswerOption>) => void;
  setCorrectOption: (quizId: string, questionId: string, optionId: string) => void;
  removeOption: (quizId: string, questionId: string, optionId: string) => void;
  moveOption: (quizId: string, questionId: string, index: number, direction: -1 | 1) => void;

  addTeam: (quizId: string, name: string) => void;
  updateTeam: (quizId: string, teamId: string, patch: Partial<Team>) => void;
  duplicateTeam: (quizId: string, teamId: string) => void;
  removeTeam: (quizId: string, teamId: string) => void;
  moveTeam: (quizId: string, index: number, direction: -1 | 1) => void;
  reorderTeams: (quizId: string, fromIndex: number, toIndex: number) => void;
  addTeamMember: (quizId: string, teamId: string, name: string) => void;
  removeTeamMember: (quizId: string, teamId: string, memberId: string) => void;

  updateScoreConfig: (quizId: string, patch: Partial<ScoreConfig>) => void;
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
  if (type === 'text') base.alternativeAnswers = [];
  return base;
}

function regenerateQuestionIds(src: Question): Question {
  return { ...src, id: makeId('q'), options: src.options?.map((o) => ({ ...o, id: makeId('opt') })) };
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
          teams: src.teams.map((t) => ({ ...t, id: makeId('team'), members: t.members.map((m) => ({ ...m, id: makeId('member') })) })),
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

      addQuestionFromTemplate: (quizId, template) => {
        const quiz = get().quizzes.find((q) => q.id === quizId);
        if (!quiz) return null;
        const question = regenerateQuestionIds(template);
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
            const copy = regenerateQuestionIds(q.questions[idx]);
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

      moveOption: (quizId, questionId, index, direction) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            return touch({
              ...q,
              questions: q.questions.map((qq) => {
                if (qq.id !== questionId || !qq.options) return qq;
                const target = index + direction;
                if (target < 0 || target >= qq.options.length) return qq;
                const options = [...qq.options];
                [options[index], options[target]] = [options[target], options[index]];
                return { ...qq, options };
              }),
            });
          }),
        })),

      addTeam: (quizId, name) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const team: Team = {
              id: makeId('team'),
              name,
              color: TEAM_COLOR_PALETTE[q.teams.length % TEAM_COLOR_PALETTE.length],
              avatar: TEAM_AVATAR_PALETTE[q.teams.length % TEAM_AVATAR_PALETTE.length],
              startingScore: 0,
              members: [],
            };
            return touch({ ...q, teams: [...q.teams, team] });
          }),
        })),

      updateTeam: (quizId, teamId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId ? q : touch({ ...q, teams: q.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)) })
          ),
        })),

      duplicateTeam: (quizId, teamId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const idx = q.teams.findIndex((t) => t.id === teamId);
            if (idx === -1) return q;
            const copy: Team = {
              ...q.teams[idx],
              id: makeId('team'),
              name: `${q.teams[idx].name} (copy)`,
              members: q.teams[idx].members.map((m) => ({ ...m, id: makeId('member') })),
            };
            const teams = [...q.teams];
            teams.splice(idx + 1, 0, copy);
            return touch({ ...q, teams });
          }),
        })),

      removeTeam: (quizId, teamId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => (q.id !== quizId ? q : touch({ ...q, teams: q.teams.filter((t) => t.id !== teamId) }))),
        })),

      moveTeam: (quizId, index, direction) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const target = index + direction;
            if (target < 0 || target >= q.teams.length) return q;
            const teams = [...q.teams];
            [teams[index], teams[target]] = [teams[target], teams[index]];
            return touch({ ...q, teams });
          }),
        })),

      reorderTeams: (quizId, fromIndex, toIndex) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            if (fromIndex === toIndex) return q;
            const teams = [...q.teams];
            const [moved] = teams.splice(fromIndex, 1);
            teams.splice(toIndex, 0, moved);
            return touch({ ...q, teams });
          }),
        })),

      addTeamMember: (quizId, teamId, name) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) => {
            if (q.id !== quizId) return q;
            const member: TeamMember = { id: makeId('member'), name };
            return touch({ ...q, teams: q.teams.map((t) => (t.id === teamId ? { ...t, members: [...t.members, member] } : t)) });
          }),
        })),

      removeTeamMember: (quizId, teamId, memberId) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({
                  ...q,
                  teams: q.teams.map((t) => (t.id === teamId ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t)),
                })
          ),
        })),

      updateScoreConfig: (quizId, patch) =>
        set((s) => ({
          quizzes: s.quizzes.map((q) =>
            q.id !== quizId
              ? q
              : touch({ ...q, scoreConfig: { defaultPoints: 10, ...q.scoreConfig, ...patch } })
          ),
        })),
    }),
    {
      name: 'quiz-presenter/quizzes',
      version: 2,
      // v1 -> v2: Team gained color/avatar/startingScore/members — backfill for anything persisted before this change.
      migrate: (persisted) => {
        type LegacyQuiz = Omit<Quiz, 'teams'> & { teams: Partial<Team>[] };
        const state = persisted as { quizzes?: LegacyQuiz[] } | undefined;
        if (!state?.quizzes) return state;
        return {
          ...state,
          quizzes: state.quizzes.map((q) => ({
            ...q,
            teams: q.teams.map(
              (t, i): Team => ({
                id: t.id ?? makeId('team'),
                name: t.name ?? `Team ${i + 1}`,
                color: TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length],
                avatar: TEAM_AVATAR_PALETTE[i % TEAM_AVATAR_PALETTE.length],
                startingScore: 0,
                members: [],
                ...t,
              })
            ),
          })),
        };
      },
    }
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
