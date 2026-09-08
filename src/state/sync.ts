/**
 * Cross-tab sync for a live session, today implemented over BroadcastChannel
 * + localStorage (same-machine, two-window MVP — see: Control Room, Center
 * Stage §"Sync architecture consideration").
 *
 * Swapping this for a real-time backend later means replacing this file's
 * transport only: everything else in the app talks to `sessionStore`, never
 * to BroadcastChannel directly, so a WebSocket/Firebase adapter that emits
 * and receives the same `QuizSession` JSON snapshot drops in with no changes
 * to any component or page.
 */
import type { QuizSession } from '../types/session';

type Listener = (session: QuizSession) => void;

export interface SyncAdapter {
  publish: (session: QuizSession) => void;
  subscribe: (listener: Listener) => () => void;
  loadLast: () => QuizSession | null;
}

interface Envelope {
  rev: number;
  session: QuizSession;
}

const storageKey = (sessionId: string) => `quiz-presenter/session/${sessionId}`;

export function createSyncAdapter(sessionId: string): SyncAdapter {
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(`quiz-session-${sessionId}`) : null;
  let rev = 0;

  return {
    publish(session) {
      const envelope: Envelope = { rev: ++rev, session };
      try {
        localStorage.setItem(storageKey(sessionId), JSON.stringify(envelope));
      } catch {
        // storage full or unavailable — cross-tab sync still works via BroadcastChannel
      }
      channel?.postMessage(envelope);
    },

    subscribe(listener) {
      // Every publish lands on both transports (BroadcastChannel + the native
      // storage event) as belt-and-suspenders delivery — dedupe by revision
      // so a listener never sees the same snapshot applied twice in a row,
      // which would otherwise erase any "what just changed" UI (e.g. a
      // leaderboard rank-change indicator) a frame after it appeared.
      let lastRev = -1;
      const apply = (envelope: Envelope) => {
        if (envelope.rev <= lastRev) return;
        lastRev = envelope.rev;
        listener(envelope.session);
      };

      const onMessage = (event: MessageEvent<Envelope>) => apply(event.data);
      channel?.addEventListener('message', onMessage);

      const onStorage = (event: StorageEvent) => {
        if (event.key === storageKey(sessionId) && event.newValue) {
          apply(JSON.parse(event.newValue) as Envelope);
        }
      };
      window.addEventListener('storage', onStorage);

      return () => {
        channel?.removeEventListener('message', onMessage);
        window.removeEventListener('storage', onStorage);
      };
    },

    loadLast() {
      try {
        const raw = localStorage.getItem(storageKey(sessionId));
        return raw ? (JSON.parse(raw) as Envelope).session : null;
      } catch {
        return null;
      }
    },
  };
}

/**
 * Lightweight presence heartbeat so the Presenter Console can show whether
 * the Presentation Display is actually open and receiving updates
 * (see: Run of Show §9, "Presentation Display disconnected").
 */
export function createPresenceChannel(sessionId: string) {
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(`quiz-session-${sessionId}-presence`) : null;
  return {
    announcePresence() {
      channel?.postMessage('ping');
    },
    subscribeToPresence(onPing: () => void) {
      const handler = () => onPing();
      channel?.addEventListener('message', handler);
      return () => channel?.removeEventListener('message', handler);
    },
  };
}

/**
 * Lets a Presenter Console notice a *second* Presenter Console open for the
 * same session — both would be able to issue commands, and whichever
 * publishes last would silently win. Each tab announces its own instance id
 * and ignores its own echo; hearing a different id means someone opened a
 * duplicate tab (or another device is also driving the same show).
 */
export function createPresenterPresenceChannel(sessionId: string) {
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(`quiz-session-${sessionId}-presenter-presence`) : null;
  return {
    announce(instanceId: string) {
      channel?.postMessage(instanceId);
    },
    subscribeToOthers(instanceId: string, onOtherPresenter: () => void) {
      const handler = (event: MessageEvent<string>) => {
        if (event.data !== instanceId) onOtherPresenter();
      };
      channel?.addEventListener('message', handler);
      return () => channel?.removeEventListener('message', handler);
    },
  };
}
