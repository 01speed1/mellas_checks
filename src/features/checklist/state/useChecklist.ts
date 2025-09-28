import { useEffect, useState, useCallback } from 'react';
import { buildChecklistStructure } from '../api/derive-checklist-service';
import { getDbClient } from '../../../db/client';
import { checklistItemState } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { determineChecklistPhase } from '../../../lib/time-window';
// ...removed unused imports from snapshot-instance-service

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
  }>;
}

interface UseChecklistResult {
  loading: boolean;
  error: string;
  items: ChecklistMaterialItem[];
  subjects: ChecklistSubjectGroup[];
  allComplete: boolean;
  toggle: (subjectId: number, materialId: number) => Promise<void>;
  refresh: () => Promise<void>;
  editable: boolean;
  templateName: string;
  phase: string | null;
  instanceId: number | null;
}

export function useChecklist(
  childId: number | null,
  templateId: number | null,
  targetDateIso: string | null
): UseChecklistResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<ChecklistMaterialItem[]>([]);
  const [editable, setEditable] = useState(false);
  const [subjects, setSubjects] = useState<ChecklistSubjectGroup[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [phase, setPhase] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!childId || !templateId || !targetDateIso) return;
    setLoading(true);
    setError('');
    try {
      const parts = targetDateIso.split('-').map(Number);
      const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const phaseValue = determineChecklistPhase(new Date(), targetDate);
      setPhase(phaseValue);
      const editablePhase = phaseValue === 'prep_window';
      const structure = await buildChecklistStructure(
        childId,
        templateId,
        targetDateIso,
        new Date(),
        editablePhase
      );
      const flat: ChecklistMaterialItem[] = [];
      structure.subjects.forEach((s) => {
        s.materials.forEach((m) => {
          flat.push({
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            materialId: m.materialId,
            materialName: m.materialName,
            checked: m.checked,
          });
        });
      });
      setItems(flat);
      setSubjects(
        structure.subjects.map((s) => ({
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          materials: s.materials.map((m) => ({
            materialId: m.materialId,
            materialName: m.materialName,
            checked: m.checked,
          })),
        }))
      );
      setEditable(structure.editable && editablePhase);
      setTemplateName(structure.templateName);
      setInstanceId(structure.instanceId);
      try {
        localStorage.setItem('activeChecklistInstanceId', String(structure.instanceId));
      } catch {}
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed loading checklist');
    } finally {
      setLoading(false);
    }
  }, [childId, templateId, targetDateIso]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (subjectId: number, materialId: number) => {
      if (!editable || !instanceId) return;
      try {
        const db = getDbClient();
        const existing = await db
          .select()
          .from(checklistItemState)
          .where(
            and(
              eq(checklistItemState.checklistInstanceId, instanceId),
              eq(checklistItemState.subjectId, subjectId),
              eq(checklistItemState.materialId, materialId)
            )
          )
          .limit(1);
        const nowIso = new Date().toISOString();
        if (existing[0]) {
          const nextChecked = !existing[0].checked;

          await db
            .update(checklistItemState)
            .set({ checked: nextChecked, checkedAt: nextChecked ? nowIso : null })
            .where(eq(checklistItemState.id, existing[0].id));
        } else {
          await db.insert(checklistItemState).values({
            checklistInstanceId: instanceId,
            subjectId,
            materialId,
            checked: true,
            checkedAt: nowIso,
          });
        }
        setItems((prev) =>
          prev.map((i) =>
            i.subjectId === subjectId && i.materialId === materialId
              ? { ...i, checked: !i.checked }
              : i
          )
        );
        setSubjects((prev) =>
          prev.map((s) =>
            s.subjectId === subjectId
              ? {
                  ...s,
                  materials: s.materials.map((m) =>
                    m.materialId === materialId ? { ...m, checked: !m.checked } : m
                  ),
                }
              : s
          )
        );
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Toggle failed');
      }
    },
    [editable, instanceId]
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
  };
}
