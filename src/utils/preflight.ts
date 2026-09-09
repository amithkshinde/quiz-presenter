import type { Quiz, QuestionType } from '../types/quiz';
import type { MediaAsset } from '../types/media';

export interface PreflightIssue {
  message: string;
}

export interface PreflightReport {
  critical: PreflightIssue[];
  warnings: PreflightIssue[];
  passedChecks: string[];
  summary: { rounds: number; questions: number; teams: number; mediaQuestions: number };
  ready: boolean;
}

const MEDIA_TYPES: QuestionType[] = ['image', 'audio', 'video'];
// A separate, lower bar than the hard upload cap (utils/media.ts MAX_MEDIA_BYTES) — purely to flag
// a video that may be slow to load live, not to block anything.
const LARGE_VIDEO_BYTES = 3 * 1024 * 1024;

/** Everything a host needs to know before going live — never blocks on warnings, only on `critical`. */
export function runPreflightCheck(quiz: Quiz, assets: MediaAsset[]): PreflightReport {
  const critical: PreflightIssue[] = [];
  const warnings: PreflightIssue[] = [];
  const passedChecks: string[] = [];

  function pass(ok: boolean, label: string) {
    if (ok) passedChecks.push(label);
    return ok;
  }

  pass(!!quiz.title.trim(), 'Quiz has a name');
  if (!quiz.title.trim()) critical.push({ message: 'Quiz has no name' });

  pass(quiz.questions.length > 0, 'Quiz contains questions');
  if (quiz.questions.length === 0) critical.push({ message: 'Quiz has no questions' });

  pass(quiz.teams.length > 0, 'Teams exist');
  if (quiz.teams.length === 0) critical.push({ message: 'No teams have been added' });

  let answerOk = true;
  let mcOk = true;
  let mediaExistsOk = true;
  let mediaLoadOk = true;
  let timersOk = true;
  let pointsOk = true;

  quiz.questions.forEach((q, i) => {
    const n = i + 1;
    const asset = q.mediaId ? assets.find((a) => a.id === q.mediaId) : undefined;

    const hasAnswer = q.type === 'multiple-choice' ? (q.options ?? []).some((o) => o.isCorrect && o.text.trim()) : !!q.correctText?.trim();
    if (!hasAnswer) {
      critical.push({ message: `Question ${n} has no answer` });
      answerOk = false;
    }

    if (q.type === 'multiple-choice' && !(q.options ?? []).some((o) => o.isCorrect)) {
      critical.push({ message: `Question ${n} has no correct option marked` });
      mcOk = false;
    }

    if (MEDIA_TYPES.includes(q.type)) {
      const referenced = q.mediaId || q.mediaUrl;
      if (q.mediaId && !asset) {
        critical.push({ message: `Question ${n} references missing media` });
        mediaExistsOk = false;
      } else if (!referenced) {
        critical.push({ message: `Question ${n} has no media attached` });
        mediaExistsOk = false;
      } else if (asset) {
        if (asset.status === 'failed') {
          critical.push({ message: `Question ${n}'s ${q.type} failed to load` });
          mediaLoadOk = false;
        } else if (asset.status !== 'ready') {
          warnings.push({ message: `Question ${n}'s media is still processing` });
        } else if (q.type === 'video' && asset.size > LARGE_VIDEO_BYTES) {
          warnings.push({ message: `Question ${n} contains a large video` });
        }
      }
    }

    if (!Number.isFinite(q.timerSeconds) || q.timerSeconds <= 0) {
      critical.push({ message: `Question ${n} has an invalid timer` });
      timersOk = false;
    }
    if (!Number.isFinite(q.points) || q.points <= 0) {
      critical.push({ message: `Question ${n} has invalid points` });
      pointsOk = false;
    }

    if (!q.hint.trim()) warnings.push({ message: `Question ${n} has no hint` });
    if (!q.explanation?.trim()) warnings.push({ message: `Question ${n} has no explanation` });
  });

  pass(answerOk, 'Every question has an answer');
  pass(mcOk, 'Multiple-choice questions have a correct option');
  pass(mediaExistsOk, 'All referenced media exists');
  pass(mediaLoadOk, 'Audio can load');
  pass(mediaLoadOk, 'Video can load');
  pass(timersOk, 'Timers are valid');
  pass(pointsOk, 'Points are valid');

  const rounds = new Set(quiz.questions.map((q) => q.category || 'Uncategorized')).size;
  const mediaQuestions = quiz.questions.filter((q) => MEDIA_TYPES.includes(q.type)).length;

  return {
    critical,
    warnings,
    passedChecks,
    summary: { rounds, questions: quiz.questions.length, teams: quiz.teams.length, mediaQuestions },
    ready: critical.length === 0,
  };
}
