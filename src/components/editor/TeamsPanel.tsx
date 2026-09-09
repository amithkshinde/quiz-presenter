import { useState } from 'react';
import type { DragEvent } from 'react';
import { useQuizStore, newTeamNameSuggestion, TEAM_AVATAR_PALETTE, TEAM_COLOR_PALETTE } from '../../state/quizStore';
import type { Quiz } from '../../types/quiz';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './TeamsPanel.module.css';

export function TeamsPanel({ quiz }: { quiz: Quiz }) {
  const addTeam = useQuizStore((s) => s.addTeam);
  const updateTeam = useQuizStore((s) => s.updateTeam);
  const duplicateTeam = useQuizStore((s) => s.duplicateTeam);
  const removeTeam = useQuizStore((s) => s.removeTeam);
  const moveTeam = useQuizStore((s) => s.moveTeam);
  const reorderTeams = useQuizStore((s) => s.reorderTeams);
  const addTeamMember = useQuizStore((s) => s.addTeamMember);
  const removeTeamMember = useQuizStore((s) => s.removeTeamMember);

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [newMemberName, setNewMemberName] = useState('');

  function onDragStart(index: number) {
    return (e: DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    };
  }
  function onDrop(index: number) {
    return (e: DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null) reorderTeams(quiz.id, dragIndex, index);
      setDragIndex(null);
    };
  }

  if (quiz.teams.length === 0) {
    return (
      <EmptyState
        title="No teams yet"
        description="Add the teams playing tonight — you can edit or remove them anytime before launch."
        action={<Button variant="primary" onClick={() => addTeam(quiz.id, newTeamNameSuggestion(quiz.teams))}>+ Add Team</Button>}
      />
    );
  }

  return (
    <div>
      <ul className={styles.list}>
        {quiz.teams.map((team, index) => {
          const expanded = expandedId === team.id;
          return (
            <li
              key={team.id}
              className={styles.card}
              draggable
              onDragStart={onDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(index)}
            >
              <div className={styles.row}>
                <span className={styles.handle} aria-hidden>⠿</span>
                <button className={styles.reorderBtn} aria-label="Move up" disabled={index === 0} onClick={() => moveTeam(quiz.id, index, -1)}>↑</button>
                <button className={styles.reorderBtn} aria-label="Move down" disabled={index === quiz.teams.length - 1} onClick={() => moveTeam(quiz.id, index, 1)}>↓</button>
                <span className={styles.avatar} style={{ background: team.color }}>{team.avatar}</span>
                <button className={styles.nameBtn} onClick={() => setExpandedId(expanded ? null : team.id)}>
                  <span className={styles.name}>{team.name}</span>
                  <span className={styles.metaRow}>
                    {team.startingScore !== 0 && <Badge tone="neutral">Starts at {team.startingScore}</Badge>}
                    {team.members.length > 0 && <Badge tone="neutral">{team.members.length} member{team.members.length > 1 ? 's' : ''}</Badge>}
                  </span>
                </button>
                <div className={styles.rowActions}>
                  <Button size="sm" variant="ghost" onClick={() => setExpandedId(expanded ? null : team.id)}>{expanded ? 'Done' : 'Edit'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateTeam(quiz.id, team.id)}>Duplicate</Button>
                  <Button size="sm" variant="danger" onClick={() => setRemoveTarget(team.id)}>Delete</Button>
                </div>
              </div>

              {expanded && (
                <div className={styles.editForm}>
                  <label className={styles.field}>
                    <span className={styles.label}>Team name</span>
                    <input
                      className={styles.input}
                      value={team.name}
                      onChange={(e) => updateTeam(quiz.id, team.id, { name: e.target.value })}
                      aria-label="Team name"
                    />
                  </label>

                  <div className={styles.field}>
                    <span className={styles.label}>Avatar</span>
                    <div className={styles.avatarPicker}>
                      {TEAM_AVATAR_PALETTE.map((a) => (
                        <button
                          key={a}
                          className={`${styles.avatarChip} ${team.avatar === a ? styles.avatarChipActive : ''}`}
                          onClick={() => updateTeam(quiz.id, team.id, { avatar: a })}
                          aria-label={`Use ${a} avatar`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <span className={styles.label}>Color</span>
                      <div className={styles.colorRow}>
                        <input
                          className={styles.colorInput}
                          type="color"
                          value={team.color}
                          onChange={(e) => updateTeam(quiz.id, team.id, { color: e.target.value })}
                          aria-label="Team color"
                        />
                        {TEAM_COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            className={`${styles.swatch} ${team.color === c ? styles.swatchActive : ''}`}
                            style={{ background: c }}
                            onClick={() => updateTeam(quiz.id, team.id, { color: c })}
                            aria-label={`Use color ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                    <label className={styles.field}>
                      <span className={styles.label}>Starting score</span>
                      <input
                        className={styles.input}
                        type="number"
                        value={team.startingScore}
                        onChange={(e) => updateTeam(quiz.id, team.id, { startingScore: Number(e.target.value) || 0 })}
                      />
                    </label>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>Members <span className={styles.optional}>(optional)</span></span>
                    <div className={styles.memberRow}>
                      {team.members.map((m) => (
                        <span key={m.id} className={styles.memberChip}>
                          {m.name}
                          <button aria-label={`Remove ${m.name}`} onClick={() => removeTeamMember(quiz.id, team.id, m.id)}>✕</button>
                        </span>
                      ))}
                    </div>
                    <div className={styles.addMemberRow}>
                      <input
                        className={styles.input}
                        placeholder="Member name"
                        value={expandedId === team.id ? newMemberName : ''}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMemberName.trim()) {
                            addTeamMember(quiz.id, team.id, newMemberName.trim());
                            setNewMemberName('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newMemberName.trim()) {
                            addTeamMember(quiz.id, team.id, newMemberName.trim());
                            setNewMemberName('');
                          }
                        }}
                      >
                        + Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className={styles.footer}>
        <Button variant="primary" onClick={() => addTeam(quiz.id, newTeamNameSuggestion(quiz.teams))}>+ Add Team</Button>
      </div>

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
