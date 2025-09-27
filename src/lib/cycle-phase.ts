import { determineChecklistPhase } from './time-window';
import { getTodayIso } from './date-iso';

export function isIsoBeforeToday(isoDate: string): boolean {
  const todayIso = getTodayIso();
  return isoDate < todayIso;
}

export function evaluateStoredCycle(targetDateIso: string | null): {
  expired: boolean;
  phase: string | null;
} {
  if (!targetDateIso) return { expired: false, phase: null };
  if (isIsoBeforeToday(targetDateIso)) return { expired: true, phase: null };
  const parts = targetDateIso.split('-').map(Number);
  const phase = determineChecklistPhase(new Date(), new Date(parts[0], parts[1] - 1, parts[2]));
  return { expired: false, phase };
}
