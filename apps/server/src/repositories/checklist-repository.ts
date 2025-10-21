import { eq, and } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client';
import { checklistInstance, checklistItemState } from '../db/schema';

export interface ChecklistInstanceRow {
  id: number;
  childId: number;
  targetDate: string;
  scheduleVersionId: number;
}
export interface ChecklistItemStateRow {
  id: number;
  checklistInstanceId: number;
  subjectId: number;
  materialId: number;
  checked: number;
  checkedAt: string | null;
}

export async function getChecklistInstance(
  childId: number,
  targetDateIso: string
): Promise<ChecklistInstanceRow | undefined> {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: checklistInstance.id,
      childId: checklistInstance.childId,
      targetDate: checklistInstance.targetDate,
      scheduleVersionId: checklistInstance.scheduleVersionId,
    })
    .from(checklistInstance)
    .where(
      and(eq(checklistInstance.childId, childId), eq(checklistInstance.targetDate, targetDateIso))
    )
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return {
    id: row.id,
    childId: row.childId,
    targetDate: row.targetDate,
    scheduleVersionId: row.scheduleVersionId,
  };
}

export async function createChecklistInstance(
  childId: number,
  targetDateIso: string,
  scheduleVersionId: number
): Promise<ChecklistInstanceRow> {
  const db = getDrizzle();
  const inserted = await db
    .insert(checklistInstance)
    .values({ childId, targetDate: targetDateIso, scheduleVersionId })
    .returning({
      id: checklistInstance.id,
      childId: checklistInstance.childId,
      targetDate: checklistInstance.targetDate,
      scheduleVersionId: checklistInstance.scheduleVersionId,
    });
  const row = inserted[0];
  return {
    id: row.id,
    childId: row.childId,
    targetDate: row.targetDate,
    scheduleVersionId: row.scheduleVersionId,
  };
}

export async function updateChecklistInstanceVersion(
  instanceId: number,
  scheduleVersionId: number
): Promise<void> {
  const db = getDrizzle();
  await db
    .update(checklistInstance)
    .set({ scheduleVersionId })
    .where(eq(checklistInstance.id, instanceId));
}

export async function listItemStates(instanceId: number): Promise<ChecklistItemStateRow[]> {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: checklistItemState.id,
      checklistInstanceId: checklistItemState.checklistInstanceId,
      subjectId: checklistItemState.subjectId,
      materialId: checklistItemState.materialId,
      checked: checklistItemState.isChecked,
      checkedAt: checklistItemState.checkedAt,
    })
    .from(checklistItemState)
    .where(eq(checklistItemState.checklistInstanceId, instanceId));
  return rows.map((r) => ({
    id: r.id,
    checklistInstanceId: r.checklistInstanceId,
    subjectId: r.subjectId,
    materialId: r.materialId,
    checked: r.checked ? 1 : 0,
    checkedAt: r.checkedAt,
  }));
}

export async function bulkInsertMissingStates(
  insertRows: { instanceId: number; subjectId: number; materialId: number }[]
): Promise<ChecklistItemStateRow[]> {
  if (insertRows.length === 0) return [];
  const db = getDrizzle();
  const inserted = await db
    .insert(checklistItemState)
    .values(
      insertRows.map((r) => ({
        checklistInstanceId: r.instanceId,
        subjectId: r.subjectId,
        materialId: r.materialId,
        isChecked: false,
      }))
    )
    .returning({
      id: checklistItemState.id,
      checklistInstanceId: checklistItemState.checklistInstanceId,
      subjectId: checklistItemState.subjectId,
      materialId: checklistItemState.materialId,
      checked: checklistItemState.isChecked,
      checkedAt: checklistItemState.checkedAt,
    });
  return inserted.map((r) => ({
    id: r.id,
    checklistInstanceId: r.checklistInstanceId,
    subjectId: r.subjectId,
    materialId: r.materialId,
    checked: r.checked ? 1 : 0,
    checkedAt: r.checkedAt,
  }));
}
