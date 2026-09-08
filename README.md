# Quiz Presenter

A live quiz presentation tool with two deliberately different surfaces:

- **Presenter Console** — the host's control room: current question, the correct answer (always visible, privately), a hint they can choose to reveal, a timer, team scores, and navigation. Dense, functional, built to run an entire quiz without leaving the screen.
- **Presentation Display** — the audience-facing "stage," meant for a projector or TV. No controls, no admin UI, no way to see an answer before the host reveals it. Large, distance-readable typography.

The two stay in sync in real time across browser windows/tabs on the same machine (via `BroadcastChannel` + `localStorage`), so the host can run the console on a laptop while the display is projected. The sync layer is isolated behind a small adapter (`src/state/sync.ts`) so swapping in a real-time backend later doesn't touch any component.

## Running it

```bash
npm install
npm run dev
```

Open the app, and it seeds itself with a complete 20-question "General Knowledge Night" quiz plus a live in-progress session and a completed one — so there's something real to look at immediately rather than an empty screen. Full flow: **Quiz Library → Editor → Launch → Presenter Console**, with **Open Presentation Display** launching the audience-facing window.

## Stack

React + TypeScript + Vite, Zustand for state (one store for authored quiz content, one for live session state), CSS Modules for styling — no UI framework, no backend.

## Structure

```
src/
  types/         Quiz/question/team and live-session type definitions
  state/         Zustand stores, the cross-tab sync adapter, derived selectors
  components/    editor/, presenter/, presentation/, common/
  pages/         one file per route
```

## Build

```bash
npm run build   # tsc -b && vite build
```
