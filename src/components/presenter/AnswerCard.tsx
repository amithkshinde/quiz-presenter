import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { Question } from '../../types/quiz';
import styles from './AnswerCard.module.css';

const HOLD_MS = 650;

export interface AnswerCardHandle {
  /** First call arms the reveal; a second call within 2s confirms it. Used by the keyboard shortcut ("A"). */
  triggerFromKeyboard: () => void;
  cancelArm: () => void;
}

function answerText(question: Question): string {
  if (question.type === 'multiple-choice') return question.options?.find((o) => o.isCorrect)?.text ?? '—';
  return question.correctText || '—';
}

export const AnswerCard = forwardRef<AnswerCardHandle, { question: Question; revealed: boolean; onReveal: () => void }>(
  function AnswerCard({ question, revealed, onReveal }, ref) {
    const [armed, setArmed] = useState(false);
    const [holding, setHolding] = useState(false);
    const holdTimer = useRef<number | null>(null);
    const armTimer = useRef<number | null>(null);

    function clearHold() {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
      setHolding(false);
    }

    function startHold() {
      if (revealed) return;
      setHolding(true);
      holdTimer.current = window.setTimeout(() => {
        onReveal();
        clearHold();
      }, HOLD_MS);
    }

    function armFromKeyboard() {
      setArmed(true);
      if (armTimer.current) window.clearTimeout(armTimer.current);
      armTimer.current = window.setTimeout(() => setArmed(false), 2000);
    }

    useImperativeHandle(ref, () => ({
      triggerFromKeyboard() {
        if (revealed) return;
        if (armed) {
          onReveal();
          setArmed(false);
        } else {
          armFromKeyboard();
        }
      },
      cancelArm() {
        setArmed(false);
      },
    }));

    return (
      <div className={`${styles.card} ${revealed ? styles.live : ''}`}>
        <div className={styles.head}>
          <span className={styles.label}>Answer</span>
          <span className={`${styles.led} ${revealed ? styles.ledLive : styles.ledStandby}`} />
        </div>
        <p className={styles.body}>{answerText(question)}</p>
        {revealed ? (
          <span className={styles.status}>LIVE — shown to participants</span>
        ) : (
          <button
            className={`${styles.reveal} ${holding ? styles.holding : ''} ${armed ? styles.armed : ''}`}
            onPointerDown={startHold}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
          >
            {armed ? 'Press A again to confirm' : 'Hold to reveal'}
          </button>
        )}
      </div>
    );
  }
);
