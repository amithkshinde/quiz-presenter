/**
 * Tracks, per quiz, the session currently in progress (if any) and the most
 * recently completed one — so a host can always find their way back to a
 * live show or its results, not just by having written down a URL. Without
 * this, re-opening Launch Setup for a quiz that's already running mints a
 * second, orphaned session with no path back to the first (see: senior
 * product review — "no way to recover an active session").
 */

const ACTIVE_KEY = 'quiz-presenter/active-sessions';
const LAST_RESULTS_KEY = 'quiz-presenter/last-results';

function readMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // storage unavailable — resuming a session still works via direct URL
  }
}

export function getActiveSessionId(quizId: string): string | null {
  return readMap(ACTIVE_KEY)[quizId] ?? null;
}

export function setActiveSessionId(quizId: string, sessionId: string): void {
  const map = readMap(ACTIVE_KEY);
  map[quizId] = sessionId;
  writeMap(ACTIVE_KEY, map);
}

export function clearActiveSessionId(quizId: string): void {
  const map = readMap(ACTIVE_KEY);
  delete map[quizId];
  writeMap(ACTIVE_KEY, map);
}

export function getLastResultsSessionId(quizId: string): string | null {
  return readMap(LAST_RESULTS_KEY)[quizId] ?? null;
}

export function setLastResultsSessionId(quizId: string, sessionId: string): void {
  const map = readMap(LAST_RESULTS_KEY);
  map[quizId] = sessionId;
  writeMap(LAST_RESULTS_KEY, map);
}
