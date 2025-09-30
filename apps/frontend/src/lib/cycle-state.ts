import { isIsoBeforeToday } from './cycle-phase';
import { determineChecklistPhase } from './time-window';

export type PurgeResult = {
  cleared: boolean;
  phase: string | null;
  targetDateIso: string | null;
};

export function purgeCycleState(options: { clearChild: boolean }): PurgeResult {
  const storedTarget = localStorage.getItem('activeTargetDate');
  const storedTemplate = localStorage.getItem('activeTemplateId');
  const storedChild = localStorage.getItem('activeChildId');
  if (!storedTarget) return { cleared: false, phase: null, targetDateIso: null };
  if (!storedTemplate || !storedChild) {
    clearCore();
    return { cleared: true, phase: null, targetDateIso: null };
  }
  if (isIsoBeforeToday(storedTarget)) {
    clearCore();
    return { cleared: true, phase: null, targetDateIso: null };
  }
  const parts = storedTarget.split('-').map(Number);
  const phase = determineChecklistPhase(new Date(), new Date(parts[0], parts[1] - 1, parts[2]));
  if (phase === 'post_locked_prep') {
    clearCore();
    return { cleared: true, phase: null, targetDateIso: null };
  }
  return { cleared: false, phase, targetDateIso: storedTarget };

  function clearCore(): void {
    const instanceId = localStorage.getItem('activeChecklistInstanceId');
    if (instanceId) {
      localStorage.removeItem('subjectOnlyStates:' + instanceId);
    }
    localStorage.removeItem('activeTemplateId');
    localStorage.removeItem('activeTargetDate');
    if (options.clearChild) localStorage.removeItem('activeChildId');
    localStorage.removeItem('activeChecklistInstanceId');
  }
}
