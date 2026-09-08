import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {action}
    </div>
  );
}
