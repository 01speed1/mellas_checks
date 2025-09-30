import { ensureChecklist } from './checklist-service';

export async function reselectTemplate(childId: number, templateId: number, targetDateIso: string) {
  return ensureChecklist(childId, templateId, targetDateIso);
}
