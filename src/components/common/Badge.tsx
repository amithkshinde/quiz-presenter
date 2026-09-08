import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
