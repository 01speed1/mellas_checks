import { and, eq } from 'drizzle-orm';
import {
  getActiveScheduleVersionForTemplate,
  ensureEditableVersion,
} from '../../../db/repositories/schedule-repository';
import { getDbClient } from '../../../db/client';
import { checklistInstance, checklistItemState } from '../../../db/schema';

export async function ensureScheduleVersionForDate(templateId: number, targetDateIso: string) {
  const version = await ensureEditableVersion(templateId, targetDateIso);
  return version;
}

export interface EnsureChecklistInstanceResult {
  instanceId: number;
  scheduleVersionId: number;
  created: boolean;
}

export async function getOrCreateChecklistInstance(
  childId: number,
  targetDateIso: string,
  scheduleVersionId: number
): Promise<EnsureChecklistInstanceResult> {
  const db = getDbClient();
  const existing = await db
    .select()
    .from(checklistInstance)
    .where(
      and(eq(checklistInstance.childId, childId), eq(checklistInstance.targetDate, targetDateIso))
    )
    .limit(1);
  if (existing[0]) {
    if (existing[0].scheduleVersionId !== scheduleVersionId) {
      await db
        .update(checklistInstance)
        .set({ scheduleVersionId })
        .where(eq(checklistInstance.id, existing[0].id));
      return { instanceId: existing[0].id, scheduleVersionId, created: false };
    }
    return {
      instanceId: existing[0].id,
      scheduleVersionId: existing[0].scheduleVersionId,
      created: false,
    };
  }
  const inserted = await db
    .insert(checklistInstance)
    .values({ childId, targetDate: targetDateIso, scheduleVersionId })
    .returning();
  const row = inserted[0];
  return { instanceId: row.id, scheduleVersionId: row.scheduleVersionId, created: true };
}

export async function resetChecklistInstanceForReselection(
  childId: number,
  targetDateIso: string,
  newScheduleVersionId: number
): Promise<EnsureChecklistInstanceResult> {
  const db = getDbClient();
  const rows = await db
    .select()
    .from(checklistInstance)
    .where(
      and(eq(checklistInstance.childId, childId), eq(checklistInstance.targetDate, targetDateIso))
    )
    .limit(1);
  if (!rows[0]) {
    return getOrCreateChecklistInstance(childId, targetDateIso, newScheduleVersionId);
  }
  const instance = rows[0];
  await db
    .delete(checklistItemState)
    .where(eq(checklistItemState.checklistInstanceId, instance.id));
  if (instance.scheduleVersionId !== newScheduleVersionId) {
    await db
      .update(checklistInstance)
      .set({ scheduleVersionId: newScheduleVersionId })
      .where(eq(checklistInstance.id, instance.id));
  }
  return { instanceId: instance.id, scheduleVersionId: newScheduleVersionId, created: false };
}
