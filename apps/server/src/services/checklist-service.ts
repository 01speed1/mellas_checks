import {
  getChecklistInstance,
  createChecklistInstance,
  updateChecklistInstanceVersion,
  listItemStates,
  bulkInsertMissingStates,
  ChecklistInstanceRow,
} from '../repositories/checklist-repository.js';
import {
  getTemplate,
  getLatestVersionAtOrBefore,
  createVersion,
  cloneBlocks,
  listBlocks,
} from '../repositories/schedule-repository.js';
import { listTemplateSubjectMaterials } from '../repositories/template-materials-repository.js';
import { getMaterialsByIds } from '../repositories/materials-repository.js';

export interface EnsureChecklistResultSubjectMaterial {
  checklistItemId: number;
  materialId: number;
  materialName: string;
  checked: boolean;
  checkedAt?: string | null;
}
export interface EnsureChecklistResultSubject {
  subjectId: number;
  subjectName: string;
  hasMaterials: boolean;
  materials: EnsureChecklistResultSubjectMaterial[];
}
export interface EnsureChecklistResult {
  checklistInstanceId: number;
  targetDateISO: string;
  template: { id: number; name: string };
  subjects: EnsureChecklistResultSubject[];
  aggregates: { total: number; checked: number; allReady: boolean };
}

export async function ensureChecklist(
  childId: number,
  templateId: number,
  targetDateIso: string
): Promise<EnsureChecklistResult> {
  const template = await getTemplate(templateId);
  if (!template || Number(template.childId) !== childId) throw new Error('not_found');
  let version = await getLatestVersionAtOrBefore(templateId, targetDateIso);
  if (!version) {
    version = await createVersion(templateId, targetDateIso);
  } else if (version.validFrom !== targetDateIso) {
    const newVersion = await createVersion(templateId, targetDateIso);
    await cloneBlocks(version.id, newVersion.id);
    version = newVersion;
  }
  let instance: ChecklistInstanceRow | undefined = await getChecklistInstance(
    childId,
    targetDateIso
  );
  if (!instance) {
    instance = await createChecklistInstance(childId, targetDateIso, version.id);
  } else if (instance.scheduleVersionId !== version.id) {
    await updateChecklistInstanceVersion(instance.id, version.id);
    instance = { ...instance, scheduleVersionId: version.id };
  }
  const blocks = await listBlocks(version.id);
  const subjectIds = blocks.map((b) => b.subjectId);
  const linkRows = await listTemplateSubjectMaterials(templateId, subjectIds);
  const materialIds = Array.from(new Set(linkRows.map((r) => r.materialId)));
  const materialRows = await getMaterialsByIds(materialIds);
  const materialNameMap = new Map<number, string>();
  materialRows.forEach((m) => materialNameMap.set(m.id, m.name));
  const existingStates = await listItemStates(instance.id);
  const stateIndex = new Map<string, { id: number; checked: number; checkedAt: string | null }>();
  existingStates.forEach((s) =>
    stateIndex.set(s.subjectId + ':' + s.materialId, {
      id: s.id,
      checked: s.checked,
      checkedAt: s.checkedAt,
    })
  );
  const missing: { instanceId: number; subjectId: number; materialId: number }[] = [];
  linkRows.forEach((l) => {
    const key = l.subjectId + ':' + l.materialId;
    if (!stateIndex.has(key))
      missing.push({
        instanceId: instance.id,
        subjectId: Number(l.subjectId),
        materialId: Number(l.materialId),
      });
  });
  if (missing.length > 0) {
    const inserted = await bulkInsertMissingStates(missing);
    inserted.forEach((s) =>
      stateIndex.set(s.subjectId + ':' + s.materialId, {
        id: s.id,
        checked: s.checked,
        checkedAt: s.checkedAt,
      })
    );
  }
  const subjects: EnsureChecklistResultSubject[] = [];
  let total = 0;
  let checked = 0;
  for (const block of blocks) {
    const linksForSubject = linkRows.filter((r) => Number(r.subjectId) === block.subjectId);
    const materials: EnsureChecklistResultSubjectMaterial[] = [];
    for (const link of linksForSubject) {
      const key = link.subjectId + ':' + link.materialId;
      const st = stateIndex.get(key);
      const materialName = materialNameMap.get(Number(link.materialId)) || '';
      const isChecked = st ? st.checked === 1 : false;
      materials.push({
        checklistItemId: st ? st.id : 0,
        materialId: Number(link.materialId),
        materialName,
        checked: isChecked,
        checkedAt: st?.checkedAt,
      });
      total += 1;
      if (isChecked) checked += 1;
    }
    materials.sort((a, b) =>
      a.materialName.localeCompare(b.materialName, undefined, { sensitivity: 'base' })
    );
    subjects.push({
      subjectId: block.subjectId,
      subjectName: block.subjectName,
      hasMaterials: materials.length > 0,
      materials,
    });
  }
  const allReady = total > 0 && total === checked;
  return {
    checklistInstanceId: instance.id,
    targetDateISO: targetDateIso,
    template: { id: templateId, name: String(template.name) },
    subjects,
    aggregates: { total, checked, allReady },
  };
}
