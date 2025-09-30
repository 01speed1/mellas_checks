import { getChecklistInstance, listItemStates } from '../repositories/checklist-repository';

export async function summarizeChecklist(childId: number, targetDateIso: string) {
  const instance = await getChecklistInstance(childId, targetDateIso);
  if (!instance) return undefined;
  const states = await listItemStates(instance.id);
  const total = states.length;
  const checked = states.filter((s) => s.checked === 1).length;
  const allReady = total > 0 && total === checked;
  return {
    checklistInstanceId: instance.id,
    targetDateISO: targetDateIso,
    aggregates: { total, checked, allReady },
  };
}
