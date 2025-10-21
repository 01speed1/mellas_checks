import { useEffect, useState, useCallback } from 'react';
import { loadChecklistForChild, toggleChecklistItemState } from '../api/checklist-api-service';

interface ChecklistMaterialItem {
  subjectId: number;
  subjectName: string;
  materialId: number;
  materialName: string;
  checked: boolean;
}

interface ChecklistSubjectGroup {
  subjectId: number;
  subjectName: string;
  materials: Array<{
    materialId: number;
    materialName: string;
    checked: boolean;
    checklistItemId: number;
  }>;
}

interface UseChecklistApiResult {
  loading: boolean;
  error: string;
  items: ChecklistMaterialItem[];
  subjects: ChecklistSubjectGroup[];
  allComplete: boolean;
  toggle: (itemId: number, subjectId: number, materialId: number) => Promise<void>;
  refresh: () => Promise<void>;
  editable: boolean;
  templateName: string;
  phase: string | null;
  instanceId: number | null;
  targetDateIso: string | null;
}

export function useChecklistApi(childId: number | null): UseChecklistApiResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<ChecklistMaterialItem[]>([]);
  const [editable, setEditable] = useState(false);
  const [subjects, setSubjects] = useState<ChecklistSubjectGroup[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [phase, setPhase] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<number | null>(null);
  const [targetDateIso, setTargetDateIso] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    setError('');
    try {
      const response = await loadChecklistForChild(childId);
      const flat: ChecklistMaterialItem[] = [];
      response.subjects.forEach((subject) => {
        subject.materials.forEach((material) => {
          flat.push({
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            materialId: material.materialId,
            materialName: material.materialName,
            checked: material.checked,
          });
        });
      });
      setItems(flat);
      setSubjects(
        response.subjects.map((subject) => ({
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          materials: subject.materials.map((material) => ({
            materialId: material.materialId,
            materialName: material.materialName,
            checked: material.checked,
            checklistItemId: material.checklistItemId,
          })),
        }))
      );
      setEditable(response.editable);
      setTemplateName(response.template.name);
      setInstanceId(response.checklistInstanceId);
      setPhase(response.phase);
      setTargetDateIso(response.targetDateISO);
      try {
        localStorage.setItem('activeChecklistInstanceId', String(response.checklistInstanceId));
      } catch (storageError) {
        console.error('Failed to save instance ID to localStorage', storageError);
      }
    } catch (apiError: any) {
      console.error('Failed loading checklist', apiError);
      setError(apiError?.message || 'Failed loading checklist');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (itemId: number, subjectId: number, materialId: number) => {
      if (!editable) return;
      try {
        const currentItem = items.find(
          (i) => i.subjectId === subjectId && i.materialId === materialId
        );
        if (!currentItem) return;
        const nextChecked = !currentItem.checked;
        await toggleChecklistItemState(itemId, nextChecked);
        setItems((prev) =>
          prev.map((i) =>
            i.subjectId === subjectId && i.materialId === materialId
              ? { ...i, checked: nextChecked }
              : i
          )
        );
        setSubjects((prev) =>
          prev.map((s) =>
            s.subjectId === subjectId
              ? {
                  ...s,
                  materials: s.materials.map((m) =>
                    m.materialId === materialId ? { ...m, checked: nextChecked } : m
                  ),
                }
              : s
          )
        );
      } catch (toggleError: any) {
        console.error('Toggle failed', toggleError);
        setError(toggleError?.message || 'Toggle failed');
      }
    },
    [editable, items]
  );

  return {
    loading,
    error,
    items,
    allComplete: items.length > 0 && items.every((i) => i.checked),
    toggle,
    refresh: load,
    editable,
    subjects,
    templateName,
    phase,
    instanceId,
    targetDateIso,
  };
}
