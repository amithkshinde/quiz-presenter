import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export function Badge({ tone = 'neutral', title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`} title={title}>{children}</span>;
}
