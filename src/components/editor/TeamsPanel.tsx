import { useState } from 'react';
import { useQuizStore, newTeamNameSuggestion } from '../../state/quizStore';
import type { Quiz } from '../../types/quiz';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './TeamsPanel.module.css';

export function TeamsPanel({ quiz }: { quiz: Quiz }) {
  const addTeam = useQuizStore((s) => s.addTeam);
  const renameTeam = useQuizStore((s) => s.renameTeam);
  const removeTeam = useQuizStore((s) => s.removeTeam);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  return (
    <div>
      {quiz.teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Add the teams playing tonight — you can rename or remove them anytime before launch."
          action={<Button variant="primary" onClick={() => addTeam(quiz.id, newTeamNameSuggestion(quiz.teams))}>+ Add Team</Button>}
        />
      ) : (
        <>
          <ul className={styles.list}>
            {quiz.teams.map((team) => (
              <li key={team.id} className={styles.row}>
                <input
                  className={styles.input}
                  value={team.name}
                  onChange={(e) => renameTeam(quiz.id, team.id, e.target.value)}
                  aria-label="Team name"
                />
                <Button size="sm" variant="danger" onClick={() => setRemoveTarget(team.id)}>Remove</Button>
              </li>
            ))}
          </ul>
          <div className={styles.footer}>
            <Button variant="primary" onClick={() => addTeam(quiz.id, newTeamNameSuggestion(quiz.teams))}>+ Add Team</Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove this team?"
        description="Their score history for this quiz will be removed too."
        confirmLabel="Remove"
        danger
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeTeam(quiz.id, removeTarget);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}
