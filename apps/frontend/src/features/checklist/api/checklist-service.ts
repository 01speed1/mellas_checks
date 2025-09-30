import {
  listBlocksForVersion,
  ensureEditableVersion,
} from '../../../db/repositories/schedule-repository';
import { listMaterialsForTemplate } from '../../../db/repositories/template-material-repository';
import { getDbClient } from '../../../db/client';
import { checklistInstance, checklistItemState, scheduleTemplate } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { isLockedPeriod } from '../../../lib/time-window';

interface GetChecklistParams {
  childId: number;
  templateId: number;
  targetDateIso: string;
  toggle?: { subjectId: number; materialId: number };
}

export async function getDbChecklist(params: GetChecklistParams): Promise<{
  subjects: Array<{
    subjectId: number;
    subjectName: string;
    materials: Array<{
      materialId: number;
      materialName: string;
      checked: boolean;
    }>;
  }>;
  flatItems: Array<{
    subjectId: number;
    subjectName: string;
    materialId: number;
    materialName: string;
    checked: boolean;
  }>;
  editable: boolean;
  templateName: string;
}> {
  const db = getDbClient();
  const parts = params.targetDateIso.split('-').map(Number);
  const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const lockedNow = isLockedPeriod(new Date(), targetDate);
  const version = await ensureEditableVersion(params.templateId, params.targetDateIso);
  if (!version) throw new Error('No version resolved');
  const versionId = version.id;
  const templateRow = await db
    .select({ id: scheduleTemplate.id, name: scheduleTemplate.name })
    .from(scheduleTemplate)
    .where(eq(scheduleTemplate.id, params.templateId))
    .limit(1);
  const templateName = templateRow[0]?.name || '';
  let instanceRow = await db
    .select()
    .from(checklistInstance)
    .where(
      and(
        eq(checklistInstance.childId, params.childId),
        eq(checklistInstance.targetDate, params.targetDateIso)
      )
    )
    .limit(1);
  if (!instanceRow[0]) {
    try {
      const inserted = await db
        .insert(checklistInstance)
        .values({
          childId: params.childId,
          targetDate: params.targetDateIso,
          scheduleVersionId: versionId,
        })
        .returning();
      instanceRow = inserted;
    } catch (e: any) {
      const retry = await db
        .select()
        .from(checklistInstance)
        .where(
          and(
            eq(checklistInstance.childId, params.childId),
            eq(checklistInstance.targetDate, params.targetDateIso)
          )
        )
        .limit(1);
      if (retry[0]) instanceRow = retry;
      else throw new Error('Cannot create checklist instance');
    }
  }
  const instance = instanceRow[0];
  const instanceId = instance.id;
  if (params.toggle && !lockedNow) {
    const existingState = await db
      .select()
      .from(checklistItemState)
      .where(
        and(
          eq(checklistItemState.checklistInstanceId, instanceId),
          eq(checklistItemState.subjectId, params.toggle.subjectId),
          eq(checklistItemState.materialId, params.toggle.materialId)
        )
      )
      .limit(1);
    if (existingState[0]) {
      await db
        .update(checklistItemState)
        .set({
          checked: existingState[0].checked ? false : true,
          checkedAt: existingState[0].checked ? null : new Date().toISOString(),
        })
        .where(eq(checklistItemState.id, existingState[0].id));
    } else {
      await db
        .insert(checklistItemState)
        .values({
          checklistInstanceId: instanceId,
          subjectId: params.toggle.subjectId,
          materialId: params.toggle.materialId,
          checked: true,
          checkedAt: new Date().toISOString(),
        })
        .returning();
    }
  }
  const lockedNowRecalc = lockedNow;
  const blocks = await listBlocksForVersion(versionId);
  const materialsForTemplate = await listMaterialsForTemplate(params.templateId);
  const materialsBySubject: Record<
    number,
    Array<{ materialId: number; materialName: string }>
  > = {};
  for (const row of materialsForTemplate) {
    if (!materialsBySubject[row.subjectId]) materialsBySubject[row.subjectId] = [];
    materialsBySubject[row.subjectId].push({
      materialId: row.materialId,
      materialName: row.materialName,
    });
  }
  const states = await db
    .select()
    .from(checklistItemState)
    .where(eq(checklistItemState.checklistInstanceId, instanceId));
  const stateKey = new Map<string, any>();
  states.forEach((s) => {
    stateKey.set(s.subjectId + ':' + s.materialId, s);
  });
  const subjects: Array<{
    subjectId: number;
    subjectName: string;
    materials: Array<{
      materialId: number;
      materialName: string;
      checked: boolean;
    }>;
  }> = [];
  const flatItems: Array<{
    subjectId: number;
    subjectName: string;
    materialId: number;
    materialName: string;
    checked: boolean;
  }> = [];
  blocks.forEach((b: any) => {
    const mats = materialsBySubject[b.subjectId] || [];
    const materialEntries: Array<{
      materialId: number;
      materialName: string;
      checked: boolean;
    }> = [];
    mats.forEach((m) => {
      const key = b.subjectId + ':' + m.materialId;
      const existing = stateKey.get(key);
      const entry = {
        materialId: m.materialId,
        materialName: m.materialName,
        checked: existing ? !!existing.checked : false,
      };
      materialEntries.push(entry);
      flatItems.push({
        subjectId: b.subjectId,
        subjectName: b.subjectName,
        materialId: m.materialId,
        materialName: m.materialName,
        checked: entry.checked,
      });
    });
    subjects.push({
      subjectId: b.subjectId,
      subjectName: b.subjectName,
      materials: materialEntries,
    });
  });
  return { subjects, flatItems, editable: !lockedNowRecalc, templateName };
}
