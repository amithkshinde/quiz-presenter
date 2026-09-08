import { useState } from 'react';
import type { Team } from '../../types/quiz';
import type { ScoreEvent } from '../../types/session';
import { standings, recentEvents } from '../../utils/scoring';
import { useQuizStore, newTeamNameSuggestion } from '../../state/quizStore';
import { useToast } from '../common/ToastProvider';
import { ScoreNumber } from './ScoreNumber';
import styles from './ScoreboardRail.module.css';

const DELTAS = [10, 20, 5, -5, -10];
const FLASH_MS = 1100;

interface Flash {
  teamId: string;
  delta: number;
  fromScore: number;
  key: number;
}

export function ScoreboardRail({
  quizId,
  teams,
  scoreEvents,
  onAdjust,
  onUndo,
  showLeaderboard,
  onToggleLeaderboard,
}: {
  quizId: string;
  teams: Team[];
  scoreEvents: ScoreEvent[];
  onAdjust: (teamId: string, delta: number) => string;
  onUndo: (eventId: string) => void;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
}) {
  const addTeam = useQuizStore((s) => s.addTeam);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [flash, setFlash] = useState<Flash | null>(null);
  const showToast = useToast();
  const ranked = standings(teams, scoreEvents);
  const recent = recentEvents(scoreEvents, 5);

  function handleAdjust(teamId: string, teamName: string, delta: number) {
    const fromScore = ranked.find((t) => t.teamId === teamId)?.score ?? 0;
    const eventId = onAdjust(teamId, delta);
    setOpenTeamId(null);
    setFlash({ teamId, delta, fromScore, key: Date.now() });
    window.setTimeout(() => setFlash((f) => (f?.teamId === teamId ? null : f)), FLASH_MS);
    showToast(`${teamName} ${delta > 0 ? '+' : ''}${delta}`, {
      tone: delta > 0 ? 'success' : 'error',
      actionLabel: 'Undo',
      onAction: () => onUndo(eventId),
    });
  }

  function startAddingTeam() {
    setNewTeamName(newTeamNameSuggestion(teams));
    setAddingTeam(true);
  }

  function confirmAddTeam() {
    const name = newTeamName.trim();
    if (name) {
      addTeam(quizId, name);
      showToast(`${name} added — they're on the board from now`, { tone: 'success' });
    }
    setAddingTeam(false);
    setNewTeamName('');
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <span className={styles.title}>Standings</span>
        <button className={styles.leaderboardToggle} onClick={onToggleLeaderboard} aria-pressed={showLeaderboard}>
          {showLeaderboard ? 'Showing on stage ●' : 'Show on stage'}
        </button>
      </div>

      {teams.length === 0 ? (
        <div className={styles.empty}>No teams yet</div>
      ) : (
        <ul className={styles.list}>
          {ranked.map((team) => {
            const isFlashing = flash?.teamId === team.teamId;
            return (
              <li
                key={team.teamId}
                className={[styles.row, isFlashing ? (flash!.delta > 0 ? styles.rowPos : styles.rowNeg) : ''].join(' ')}
              >
                <span className={styles.rank}>{team.rank}</span>
                <span className={styles.name}>{team.name}</span>
                <span className={styles.scoreWrap}>
                  <span className={styles.score}>
                    <ScoreNumber value={team.score} from={isFlashing ? flash!.fromScore : undefined} />
                  </span>
                  {isFlashing && (
                    <span key={flash!.key} className={`${styles.delta} ${flash!.delta > 0 ? styles.pos : styles.neg}`}>
                      {flash!.delta > 0 ? `+${flash!.delta}` : flash!.delta}
                    </span>
                  )}
                </span>
                <div className={styles.adjustWrap}>
                  <button className={styles.adjustBtn} onClick={() => setOpenTeamId(openTeamId === team.teamId ? null : team.teamId)} aria-label={`Adjust ${team.name} score`}>
                    ±
                  </button>
                  {openTeamId === team.teamId && (
                    <div className={styles.popover}>
                      {DELTAS.map((d) => (
                        <button key={d} className={`${styles.deltaBtn} ${d > 0 ? styles.pos : styles.neg}`} onClick={() => handleAdjust(team.teamId, team.name, d)}>
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* A team arriving after kickoff is the single most common live-event
          disruption — this stays reachable without ever leaving the console. */}
      {addingTeam ? (
        <div className={styles.addTeamForm}>
          <input
            autoFocus
            className={styles.addTeamInput}
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAddTeam();
              if (e.key === 'Escape') setAddingTeam(false);
            }}
            placeholder="Team name"
          />
          <button className={styles.addTeamConfirm} onClick={confirmAddTeam}>Add</button>
          <button className={styles.addTeamCancel} onClick={() => setAddingTeam(false)} aria-label="Cancel">✕</button>
        </div>
      ) : (
        <button className={styles.addTeamToggle} onClick={startAddingTeam}>+ Add team</button>
      )}

      {/* Beyond the 6s undo toast, a correction is always reachable here — no
          mental arithmetic required to undo a mis-tap from five minutes ago. */}
      <button className={styles.logToggle} onClick={() => setLogOpen((v) => !v)}>
        {logOpen ? '▾ Hide recent activity' : '▸ Recent activity'}
      </button>
      {logOpen && (
        recent.length === 0 ? (
          <p className={styles.logEmpty}>No score changes yet.</p>
        ) : (
          <ul className={styles.log}>
            {recent.map((e) => {
              const team = teams.find((t) => t.id === e.teamId);
              return (
                <li key={e.id} className={styles.logRow}>
                  <span className={styles.logName}>{team?.name ?? 'Unknown'}</span>
                  <span className={styles.logDelta} style={{ color: e.delta > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {e.delta > 0 ? `+${e.delta}` : e.delta}
                  </span>
                  <button className={styles.logUndo} onClick={() => onUndo(e.id)}>Undo</button>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
