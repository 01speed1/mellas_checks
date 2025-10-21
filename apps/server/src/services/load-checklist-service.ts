import { getChecklistInstance, listItemStates } from '../repositories/checklist-repository';
import { listBlocks, getTemplate, getVersion } from '../repositories/schedule-repository';
import { listTemplateSubjectMaterials } from '../repositories/template-materials-repository';
import { getMaterialsByIds } from '../repositories/materials-repository';

export async function loadChecklist(childId: number, targetDateIso: string) {
  const instance = await getChecklistInstance(childId, targetDateIso);
  if (!instance) return undefined;
  const version = await getVersion(instance.scheduleVersionId);
  if (!version) return undefined;
  const template = await getTemplate(version.templateId);
  if (!template) return undefined;
  const blocks = await listBlocks(instance.scheduleVersionId);
  const subjectIds = blocks.map((b) => b.subjectId);
  const links = await listTemplateSubjectMaterials(template.id, subjectIds);
  const materialIds = Array.from(new Set(links.map((l) => l.materialId)));
  const materials = await getMaterialsByIds(materialIds);
  const materialNameMap = new Map(materials.map((m) => [m.id, m.name]));
  const states = await listItemStates(instance.id);
  const stateIndex = new Map(states.map((s) => [s.subjectId + ':' + s.materialId, s]));
  let total = 0;
  let checked = 0;
  const subjects = blocks.map((b) => {
    const linksFor = links.filter((l) => l.subjectId === b.subjectId);
    const materialsFor = linksFor
      .map((l) => {
        const key = l.subjectId + ':' + l.materialId;
        const st = stateIndex.get(key);
        const isChecked = st ? st.checked === 1 : false;
        if (isChecked) checked += 1;
        total += 1;
        return {
          checklistItemId: st ? st.id : 0,
          materialId: l.materialId,
          materialName: materialNameMap.get(l.materialId) || '',
          checked: isChecked,
          checkedAt: st?.checkedAt,
        };
      })
      .sort((a, b) => a.materialName.localeCompare(b.materialName));
    return {
      subjectId: b.subjectId,
      subjectName: b.subjectName,
      hasMaterials: materialsFor.length > 0,
      materials: materialsFor,
    };
  });
  const allReady = total > 0 && total === checked;
  return {
    checklistInstanceId: instance.id,
    targetDateISO: targetDateIso,
    template: { id: template.id, name: template.name },
    subjects,
    aggregates: { total, checked, allReady },
  };
}
