const START_ALLOWED_HOUR = 13;
const START_ALLOWED_MINUTE = 0;
const END_ALLOWED_HOUR = 7;
const END_ALLOWED_MINUTE = 0;

export function isWithinChecklistWindow(currentDateTime: Date, targetDate: Date): boolean {
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  const windowStart = new Date(
    targetYear,
    targetMonth,
    targetDay - 1,
    START_ALLOWED_HOUR,
    START_ALLOWED_MINUTE,
    0,
    0
  );
  const windowEnd = new Date(
    targetYear,
    targetMonth,
    targetDay,
    END_ALLOWED_HOUR,
    END_ALLOWED_MINUTE,
    0,
    0
  );
  return currentDateTime >= windowStart && currentDateTime < windowEnd;
}

export function nextChecklistWindowFor(targetDate: Date): { start: Date; end: Date } {
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  const start = new Date(
    targetYear,
    targetMonth,
    targetDay - 1,
    START_ALLOWED_HOUR,
    START_ALLOWED_MINUTE,
    0,
    0
  );
  const end = new Date(
    targetYear,
    targetMonth,
    targetDay,
    END_ALLOWED_HOUR,
    END_ALLOWED_MINUTE,
    0,
    0
  );
  return { start, end };
}

export function isLockedPeriod(currentDateTime: Date, targetDate: Date): boolean {
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  const lockStart = new Date(targetYear, targetMonth, targetDay, END_ALLOWED_HOUR, 0, 0, 0);
  const lockEnd = new Date(targetYear, targetMonth, targetDay, START_ALLOWED_HOUR, 0, 0, 0);
  return currentDateTime >= lockStart && currentDateTime < lockEnd;
}

export type ChecklistPhase = 'pre_window' | 'prep_window' | 'locked' | 'post_locked_prep';

export function determineChecklistPhase(now: Date, targetDate: Date): ChecklistPhase {
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  const prepStart = new Date(targetYear, targetMonth, targetDay - 1, START_ALLOWED_HOUR, 0, 0, 0);
  const lockedStart = new Date(targetYear, targetMonth, targetDay, END_ALLOWED_HOUR, 0, 0, 0);
  const lockedEnd = new Date(targetYear, targetMonth, targetDay, START_ALLOWED_HOUR, 0, 0, 0);
  if (now < prepStart) return 'pre_window';
  if (now >= prepStart && now < lockedStart) return 'prep_window';
  if (now >= lockedStart && now < lockedEnd) return 'locked';
  return 'post_locked_prep';
}
