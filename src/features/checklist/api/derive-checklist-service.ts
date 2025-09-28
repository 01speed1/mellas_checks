import { and, eq, inArray } from 'drizzle-orm';
import { getDbClient } from '../../../db/client';
import {
  checklistInstance,
  checklistItemState,
  scheduleBlock,
  scheduleTemplate,
  scheduleVersion,
  subject,
  material,
  templateSubjectMaterial,
} from '../../../db/schema';
import {
  ensureScheduleVersionForDate,
  getOrCreateChecklistInstance,
} from './snapshot-instance-service';

export interface ChecklistMaterialEntry {
  materialId: number;
  materialName: string;
  checked: boolean;
}
export interface ChecklistSubjectEntry {
  subjectId: number;
  subjectName: string;
  materials: ChecklistMaterialEntry[];
}
export interface ChecklistStructureResult {
  subjects: ChecklistSubjectEntry[];
  templateName: string;
  allComplete: boolean;
  instanceId: number;
  editable: boolean;
}

export async function buildChecklistStructure(
  childId: number,
  templateId: number,
  targetDateIso: string,
  now: Date,
  editable: boolean
): Promise<ChecklistStructureResult> {
  const db = getDbClient();
  const version = await ensureScheduleVersionForDate(templateId, targetDateIso);
  if (!version) throw new Error('Schedule version not resolved');
  const { instanceId } = await getOrCreateChecklistInstance(childId, targetDateIso, version.id);
  const templateRows = await db
    .select({ id: scheduleTemplate.id, name: scheduleTemplate.name })
    .from(scheduleTemplate)
    .where(eq(scheduleTemplate.id, templateId));
  const templateName = templateRows[0]?.name || '';

  const blocks = await db
    .select({
      id: scheduleBlock.id,
      blockOrder: scheduleBlock.blockOrder,
      subjectId: scheduleBlock.subjectId,
      subjectName: subject.name,
    })
    .from(scheduleBlock)
    .innerJoin(subject, eq(subject.id, scheduleBlock.subjectId))
    .where(eq(scheduleBlock.versionId, version.id))
    .orderBy(scheduleBlock.blockOrder);
  const subjectIds = blocks.map((b) => b.subjectId);
  const links =
    subjectIds.length === 0
      ? []
      : await db
          .select({
            subjectId: templateSubjectMaterial.subjectId,
            materialId: templateSubjectMaterial.materialId,
          })
          .from(templateSubjectMaterial)
          .where(
            and(
              eq(templateSubjectMaterial.templateId, templateId),
              inArray(templateSubjectMaterial.subjectId, subjectIds)
            )
          );
  const materialIds = Array.from(new Set(links.map((l) => l.materialId)));
  const materials =
    materialIds.length === 0
      ? []
      : await db
          .select({ id: material.id, name: material.name })
          .from(material)
          .where(inArray(material.id, materialIds));
  const materialNameMap = new Map<number, string>();
  materials.forEach((m) => materialNameMap.set(m.id, m.name));
  const existingStates = await db
    .select()
    .from(checklistItemState)
    .where(eq(checklistItemState.checklistInstanceId, instanceId));
  const stateIndex = new Map<string, { id: number; checked: number }>();
  existingStates.forEach((s) =>
    stateIndex.set(s.subjectId + ':' + s.materialId, { id: s.id, checked: s.checked ? 1 : 0 })
  );
  const subjects: ChecklistSubjectEntry[] = [];
  let total = 0;
  let checkedCount = 0;
  for (const block of blocks) {
    const subjectMaterials = links.filter((l) => l.subjectId === block.subjectId);
    const matEntries: ChecklistMaterialEntry[] = [];
    for (const link of subjectMaterials) {
      const key = block.subjectId + ':' + link.materialId;
      const existing = stateIndex.get(key);
      const name = materialNameMap.get(link.materialId) || '';
      const checked = existing ? existing.checked === 1 : false;
      matEntries.push({ materialId: link.materialId, materialName: name, checked });
      total += 1;
      if (checked) checkedCount += 1;
    }
    matEntries.sort((a, b) =>
      a.materialName.localeCompare(b.materialName, undefined, { sensitivity: 'base' })
    );
    subjects.push({
      subjectId: block.subjectId,
      subjectName: block.subjectName,
      materials: matEntries,
    });
  }
  const allComplete = total > 0 && checkedCount === total;
  return { subjects, templateName, allComplete, instanceId, editable };
}
