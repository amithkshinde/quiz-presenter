import { useEffect, useRef, useState } from 'react';
import styles from './ScoreNumber.module.css';

const DURATION_MS = 500;

/** Animates from `from` to `value` when `from` is provided and differs; otherwise renders statically. */
export function ScoreNumber({ value, from }: { value: number; from?: number }) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (from === undefined || from === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const fromValue = from;
    const delta = value - fromValue;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(fromValue + delta * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setDisplay(value);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, from]);

  return <span className={styles.num}>{display}</span>;
}
