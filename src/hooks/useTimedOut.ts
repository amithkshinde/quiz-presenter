import { useEffect, useState } from 'react';

/**
 * Resolves to true if `ready` hasn't become true within `timeoutMs` — used to
 * turn "still loading" into an honest "this doesn't exist" after a fair
 * chance to sync, instead of a spinner that runs forever indistinguishably
 * from a broken link. Resets whenever `resetKey` changes (e.g. a new
 * sessionId), so navigating to a different session gets its own fresh wait.
 */
export function useTimedOut(ready: boolean, resetKey: string, timeoutMs = 4000): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    if (ready) return;
    const timer = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [ready, resetKey, timeoutMs]);

  return !ready && timedOut;
}
