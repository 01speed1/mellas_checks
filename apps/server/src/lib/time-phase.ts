export type Phase = 'prep_afternoon' | 'prep_early' | 'locked' | 'next_cycle';

export interface PhaseResult {
  phase: Phase;
  editable: boolean;
  nowISO: string;
  targetDateISO: string;
}

export function computePhase(now: Date, timezone: string): PhaseResult {
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const year = localTime.getFullYear();
  const month = localTime.getMonth();
  const day = localTime.getDate();
  const hour = localTime.getHours();
  let phase: Phase;
  let targetDayOffset: number;
  if (hour >= 15 && hour < 24) {
    phase = 'prep_afternoon';
    targetDayOffset = 1;
  } else if (hour >= 0 && hour < 7) {
    phase = 'prep_early';
    targetDayOffset = 0;
  } else if (hour >= 7 && hour < 15) {
    phase = 'locked';
    targetDayOffset = 0;
  } else {
    phase = 'next_cycle';
    targetDayOffset = 1;
  }
  const target = new Date(year, month, day + targetDayOffset);
  const editable = phase === 'prep_afternoon' || phase === 'prep_early';
  const targetISO = new Date(
    Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  ).toISOString();
  return {
    phase,
    editable,
    nowISO: now.toISOString(),
    targetDateISO: targetISO.split('T')[0],
  };
}
