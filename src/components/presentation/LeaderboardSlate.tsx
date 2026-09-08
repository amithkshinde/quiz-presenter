import { useLayoutEffect, useRef } from 'react';
import type { TeamStanding } from '../../types/session';
import styles from './LeaderboardSlate.module.css';

const MEDALS = ['gold', 'silver', 'bronze'] as const;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function LeaderboardSlate({ standings, final = false, caption }: { standings: TeamStanding[]; final?: boolean; caption?: string }) {
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);
  // podium visual order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  // Rank-change indicators, computed during render rather than in an effect —
  // "store information from previous renders" (react.dev) — so there's no
  // commit/effect interleaving for a double-render (dev StrictMode, or any
  // future duplicate delivery) to race against. Guarded by lastKeyRef so a
  // repeated render for the *same* standings never re-derives (and can't
  // erase) the indicator; it only advances on a genuinely new standingsKey,
  // and then holds until the next one.
  const standingsKey = standings.map((t) => `${t.teamId}:${t.rank}`).join(',');
  const prevRanksRef = useRef<Map<string, number> | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const deltasRef = useRef<Map<string, number>>(new Map());
  if (!final && lastKeyRef.current !== standingsKey) {
    const prev = prevRanksRef.current;
    const next = new Map<string, number>();
    if (prev) {
      for (const team of standings) {
        const prevRank = prev.get(team.teamId);
        if (prevRank !== undefined && prevRank !== team.rank) next.set(team.teamId, prevRank - team.rank);
      }
    }
    deltasRef.current = next;
    lastKeyRef.current = standingsKey;
    prevRanksRef.current = new Map(standings.map((t) => [t.teamId, t.rank]));
  }
  const rankDeltas = deltasRef.current;

  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const rowTopsRef = useRef<Map<string, number>>(new Map());
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    const prevTops = rowTopsRef.current;
    const nextTops = new Map<string, number>();
    rowRefs.current.forEach((el, id) => {
      const top = el.getBoundingClientRect().top;
      nextTops.set(id, top);
      const prevTop = prevTops.get(id);
      if (prevTop !== undefined && prevTop !== top) {
        const delta = prevTop - top;
        el.style.transition = 'none';
        el.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          el.style.transition = `transform var(--duration-slow) var(--ease-in-out)`;
          el.style.transform = '';
        });
      }
    });
    rowTopsRef.current = nextTops;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest.map((t) => t.teamId).join(',')]);

  if (standings.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.kicker}>{final ? 'Final Results' : caption ?? 'Standings'}</div>
        <p className={styles.empty}>No teams to show yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.kicker}>{final ? 'Trivia Night' : ''}</div>
      <h2 className={styles.title}>{final ? 'Final Results' : caption}</h2>
      {final && <div className={styles.titleRule} aria-hidden />}
      <div className={styles.podium}>
        {final && <Confetti />}
        {podiumOrder.map((team, i) => {
          const medal = MEDALS[team.rank - 1] ?? 'bronze';
          const delta = rankDeltas.get(team.teamId);
          return (
            <div
              key={team.teamId}
              className={`${styles.block} ${styles[medal]} ${final ? styles.podiumEnter : ''}`}
              style={final ? { animationDelay: `${(2 - i) * 160}ms` } : undefined}
            >
              <div className={styles.card}>
                {final && team.rank === 1 && <span className={styles.crown}>★</span>}
                <span className={styles.rank}>
                  {ordinal(team.rank)}
                  {delta !== undefined && <RankDelta delta={delta} />}
                </span>
                <span className={styles.name}>{team.name}</span>
                <span className={styles.score}>{team.score}</span>
              </div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <ul className={styles.restList}>
          {rest.map((team) => {
            const delta = rankDeltas.get(team.teamId);
            return (
              <li
                key={team.teamId}
                ref={(el) => {
                  if (el) rowRefs.current.set(team.teamId, el);
                  else rowRefs.current.delete(team.teamId);
                }}
                className={styles.restRow}
              >
                <span className={styles.restRank}>
                  {ordinal(team.rank)}
                  {delta !== undefined && <RankDelta delta={delta} />}
                </span>
                <span className={styles.restName}>{team.name}</span>
                <span className={styles.restScore}>{team.score}</span>
              </li>
            );
          })}
        </ul>
      )}
      {final && <p className={styles.closing}>Thanks for playing</p>}
    </div>
  );
}

function RankDelta({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const up = delta > 0;
  return (
    <span className={`${styles.rankDelta} ${up ? styles.rankUp : styles.rankDown}`}>
      {up ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  );
}

function Confetti() {
  // A restrained, one-shot burst behind 1st place — not a looping effect, and
  // never shown to reduced-motion viewers.
  const pieces = Array.from({ length: 18 });
  return (
    <div className={styles.confetti} aria-hidden>
      {pieces.map((_, i) => (
        <span
          key={i}
          className={styles.confettiPiece}
          style={{
            left: `${8 + ((i * 37) % 84)}%`,
            animationDelay: `${(i % 6) * 70}ms`,
            background: i % 3 === 0 ? 'var(--s-gold)' : i % 3 === 1 ? '#fff' : 'var(--s-correct)',
          }}
        />
      ))}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
