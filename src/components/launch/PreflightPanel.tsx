import { useState } from 'react';
import type { PreflightReport } from '../../utils/preflight';
import styles from './PreflightPanel.module.css';

export function PreflightPanel({ report }: { report: PreflightReport }) {
  const [warningsOpen, setWarningsOpen] = useState(false);
  const { summary, critical, warnings } = report;

  return (
    <div className={styles.wrap}>
      <p className={styles.summary}>
        {summary.rounds} round{summary.rounds !== 1 ? 's' : ''} · {summary.questions} question{summary.questions !== 1 ? 's' : ''} ·{' '}
        {summary.teams} team{summary.teams !== 1 ? 's' : ''} · {summary.mediaQuestions} media question{summary.mediaQuestions !== 1 ? 's' : ''}
      </p>

      <div className={`${styles.status} ${report.ready ? styles.statusReady : styles.statusBlocked}`}>
        {report.ready ? '✓ READY TO START' : `✕ NOT READY — ${critical.length} critical issue${critical.length !== 1 ? 's' : ''}`}
      </div>

      {critical.length > 0 && (
        <ul className={styles.list}>
          {critical.map((c, i) => (
            <li key={i} className={styles.critical}>✕ {c.message}</li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <>
          <button className={styles.toggle} onClick={() => setWarningsOpen((v) => !v)}>
            {warningsOpen ? '▾' : '▸'} {warnings.length} warning{warnings.length !== 1 ? 's' : ''} (won't block starting)
          </button>
          {warningsOpen && (
            <ul className={styles.list}>
              {warnings.map((w, i) => (
                <li key={i} className={styles.warning}>⚠ {w.message}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
