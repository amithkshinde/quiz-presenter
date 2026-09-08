import type { Question } from '../../types/quiz';
import type { QuestionRuntimeState, QuizPhase, TeamStanding } from '../../types/session';
import { WelcomeSlate } from './WelcomeSlate';
import { QuestionSlate } from './QuestionSlate';
import { LeaderboardSlate } from './LeaderboardSlate';
import { PausedSlate } from './PausedSlate';
import styles from './PresentationStage.module.css';

export interface PresentationViewModel {
  quizTitle: string;
  teamNames: string[];
  phase: QuizPhase;
  question: Question | null;
  runtimeState: QuestionRuntimeState | null;
  showLeaderboard: boolean;
  standings: TeamStanding[];
  progress: { current: number; total: number };
}

/**
 * The single "stage" renderer — used verbatim by both the real Presentation
 * Display (fed by the live session) and Quiz Preview (fed by local stepping
 * state), so what the audience will see can never drift from what the
 * preview showed the host. See: On Air §"Component structure".
 */
export function PresentationStage({ vm, isPreview = false }: { vm: PresentationViewModel; isPreview?: boolean }) {
  // Keyed on what actually changes the scene (which question, which slate) —
  // not on hint/answer/timer ticks within a question, so only a genuine
  // question change gets the cross-fade; reveals keep their own transitions.
  const sceneKey = `${vm.phase}:${vm.question?.id ?? 'none'}:${vm.showLeaderboard}`;
  return (
    <div className={`stage-scope ${styles.frame}`}>
      {isPreview && <span className={styles.previewBadge}>PREVIEW</span>}
      <div key={sceneKey} className={styles.scene}>
        {renderContent(vm)}
      </div>
      <span className={styles.brandmark}>{vm.quizTitle}</span>
    </div>
  );
}

function renderContent(vm: PresentationViewModel) {
  if (vm.phase === 'not-started') {
    return <WelcomeSlate quizTitle={vm.quizTitle} teamNames={vm.teamNames} />;
  }
  if (vm.phase === 'paused') {
    return <PausedSlate />;
  }
  if (vm.phase === 'ended') {
    return <LeaderboardSlate standings={vm.standings} final />;
  }
  if (vm.showLeaderboard) {
    return <LeaderboardSlate standings={vm.standings} caption={`Standings after Question ${vm.progress.current}`} />;
  }
  if (vm.question && vm.runtimeState) {
    return <QuestionSlate question={vm.question} runtimeState={vm.runtimeState} progress={vm.progress} />;
  }
  return <WelcomeSlate quizTitle={vm.quizTitle} teamNames={vm.teamNames} />;
}
