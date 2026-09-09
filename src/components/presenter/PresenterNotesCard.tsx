import styles from './HintCard.module.css';

/** Host-only reminders — never sent to the Presentation Display. Same card idiom as Answer/Hint, minus a reveal control since it's never shown to participants. */
export function PresenterNotesCard({ notes }: { notes?: string }) {
  const hasNotes = !!notes?.trim();
  return (
    <div className={`${styles.card} ${hasNotes ? '' : styles.empty}`}>
      <div className={styles.head}>
        <span className={styles.label}>Presenter notes</span>
      </div>
      {hasNotes ? <p className={styles.body}>{notes}</p> : <p className={styles.emptyText}>No notes for this question</p>}
    </div>
  );
}
