import { useEffect, useState } from 'react';
import type { Question, Quiz } from '../../types/quiz';
import type { ScoreEvent } from '../../types/session';
import { resolveScoreDeltas, standings } from '../../utils/scoring';
import { useToast } from '../common/ToastProvider';
import { Button } from '../common/Button';
import styles from './ScoringPanel.module.css';

/**
 * The dedicated post-reveal scoring state: fast per-team quick-actions plus a
 * custom-value fallback, staged locally until "Apply Scores" commits them all
 * at once as one undoable batch. Appears once the answer is revealed; the
 * always-available ScoreboardRail ± popover still handles ad hoc corrections.
 */
export function ScoringPanel({
  quiz,
  question,
  scoreEvents,
  questionNumber,
  onApply,
  onUndoBatch,
  onPendingChange,
}: {
  quiz: Quiz;
  question: Question;
  scoreEvents: ScoreEvent[];
  questionNumber: number;
  onApply: (entries: { teamId: string; delta: number }[], round: string) => string;
  onUndoBatch: (batchId: string) => void;
  /** Lets the host page warn before navigating away with unapplied score changes. */
  onPendingChange?: (hasPending: boolean) => void;
}) {
  const showToast = useToast();
  // `undefined` = no judgement made yet for this team; distinct from an explicit
  // 0 (marked incorrect) so the "0" quick-action doesn't look pre-selected by default.
  const [pending, setPending] = useState<Record<string, number | undefined>>({});
  const deltas = resolveScoreDeltas(quiz, question);
  const ranked = standings(quiz.teams, scoreEvents);
  const hasPending = Object.values(pending).some((v) => v !== undefined);

  useEffect(() => setPending({}), [question.id]);
  useEffect(() => onPendingChange?.(hasPending), [hasPending, onPendingChange]);

  const correctAnswer =
    question.type === 'multiple-choice' ? question.options?.find((o) => o.isCorrect)?.text : question.correctText;

  function apply() {
    const entries = quiz.teams.map((t) => ({ teamId: t.id, delta: pending[t.id] ?? 0 }));
    if (entries.every((e) => e.delta === 0)) return;
    const round = question.category || 'Round';
    const batchId = onApply(entries, round);
    showToast('Scores applied', { tone: 'success', actionLabel: 'Undo', onAction: () => onUndoBatch(batchId) });
    setPending({});
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.qLabel}>QUESTION {questionNumber}</span>
        {correctAnswer && <span className={styles.answerLabel}>Correct answer: <b>{correctAnswer}</b></span>}
        <span className={styles.pointsLabel}>Points: {deltas.correct}</span>
      </div>

      <ul className={styles.rows}>
        {ranked.map((r) => {
          const team = quiz.teams.find((t) => t.id === r.teamId);
          if (!team) return null;
          const value = pending[team.id];
          return (
            <li key={team.id} className={styles.row}>
              <span className={styles.avatar} style={{ background: team.color }}>{team.avatar}</span>
              <span className={styles.name}>{team.name}</span>
              <span className={styles.score}>{r.score}</span>
              <div className={styles.quick}>
                <button
                  className={`${styles.quickBtn} ${styles.pos} ${value === deltas.correct ? styles.active : ''}`}
                  onClick={() => setPending((p) => ({ ...p, [team.id]: deltas.correct }))}
                >
                  {deltas.correct > 0 ? `+${deltas.correct}` : deltas.correct}
                </button>
                <button
                  className={`${styles.quickBtn} ${value === deltas.incorrect ? styles.active : ''}`}
                  onClick={() => setPending((p) => ({ ...p, [team.id]: deltas.incorrect }))}
                >
                  {deltas.incorrect}
                </button>
                <button
                  className={`${styles.quickBtn} ${styles.neg} ${value === deltas.penalty ? styles.active : ''}`}
                  onClick={() => setPending((p) => ({ ...p, [team.id]: deltas.penalty }))}
                >
                  {deltas.penalty}
                </button>
                <input
                  className={styles.customInput}
                  type="number"
                  value={value ?? ''}
                  placeholder="0"
                  onChange={(e) => setPending((p) => ({ ...p, [team.id]: e.target.value === '' ? undefined : Number(e.target.value) || 0 }))}
                  aria-label={`Custom score change for ${team.name}`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <Button variant="primary" onClick={apply} disabled={!hasPending}>Apply Scores</Button>
    </div>
  );
}
