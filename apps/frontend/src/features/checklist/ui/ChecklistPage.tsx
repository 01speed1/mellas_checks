import React, { useMemo, useState, useCallback } from 'react';
import { useChecklistApi } from '../state/useChecklistApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/8bit/card';
import { Badge } from '@/components/ui/8bit/badge';
import { Checkbox } from '@/components/ui/8bit/checkbox';
import { formatDateForDisplay } from '@/lib/date-iso';

import SkeletonLoading from '@/components/Skeleton-loading';

export function ChecklistPage(): React.ReactElement {
  const childIdRaw = localStorage.getItem('activeChildId');
  const childId = childIdRaw ? Number(childIdRaw) : null;
  const {
    loading,
    error,
    items,
    toggle,
    editable,
    subjects,
    templateName,
    phase,
    instanceId,
    targetDateIso,
  } = useChecklistApi(childId);

  React.useEffect(() => {
    const legacyKeys = ['activeChildIdentifier', 'activeScheduleIdentifier'];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }, []);

  const phaseLabel = useMemo(() => {
    if (!phase) return '';
    if (phase === 'prep_afternoon') return 'Ventana de preparación abierta (tarde)';
    if (phase === 'prep_early') return 'Ventana de preparación abierta (mañana temprano)';
    if (phase === 'locked') return 'Bloqueado (horario escolar)';
    if (phase === 'next_cycle') return 'En espera (después de las 3:00 pm puedes preparar)';
    return '';
  }, [phase]);

  const [subjectOnlyRevision, setSubjectOnlyRevision] = useState(0);

  const lexicalSubjects = useMemo(() => {
    return subjects.map((s) => ({
      ...s,
      materials: [...s.materials].sort((a, b) =>
        a.materialName.localeCompare(b.materialName, 'es')
      ),
    }));
  }, [subjects]);

  const totalMaterials = useMemo(
    () => lexicalSubjects.reduce((acc, s) => acc + s.materials.length, 0),
    [lexicalSubjects]
  );

  const subjectAggregate = useMemo(() => {
    const key = instanceId ? 'subjectOnlyStates:' + instanceId : null;
    let stored: Record<string, boolean> = {};
    if (key) {
      try {
        stored = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {}
    }
    return lexicalSubjects.reduce<Record<number, { checked: boolean; indeterminate: boolean }>>(
      (acc, s) => {
        if (s.materials.length === 0) {
          const storedVal = key ? stored[String(s.subjectId)] : false;
          acc[s.subjectId] = { checked: !!storedVal, indeterminate: false };
        } else {
          const total = s.materials.length;
          const checkedCount = s.materials.filter((m) => m.checked).length;
          acc[s.subjectId] = {
            checked: total > 0 && checkedCount === total,
            indeterminate: checkedCount > 0 && checkedCount < total,
          };
        }
        return acc;
      },
      {}
    );
  }, [lexicalSubjects, instanceId, subjectOnlyRevision]);

  const readinessState = useMemo(() => {
    const key = instanceId ? 'subjectOnlyStates:' + instanceId : null;
    let stored: Record<string, boolean> = {};
    if (key) {
      try {
        stored = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {}
    }

    const emptySubjects = lexicalSubjects
      .filter((s) => s.materials.length === 0)
      .map((s) => s.subjectId);

    const emptySubjectsAllChecked = emptySubjects.every((id) => !!stored[String(id)]);
    const anyRequirements = emptySubjects.length > 0 || totalMaterials > 0;
    const materialsAllChecked = items.length === 0 ? true : items.every((i) => i.checked);
    const allReady = anyRequirements && materialsAllChecked && emptySubjectsAllChecked;
    return { allReady };
  }, [lexicalSubjects, instanceId, subjectOnlyRevision, totalMaterials, items]);

  const toggleSubject = useCallback(
    (subjectId: number) => {
      const target = lexicalSubjects.find((s) => s.subjectId === subjectId);
      if (!target) return;
      if (target.materials.length === 0) {
        if (!instanceId || !editable) return;
        const key = 'subjectOnlyStates:' + instanceId;
        let stored: Record<string, boolean> = {};
        try {
          stored = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {}
        const current = !!stored[String(subjectId)];
        stored[String(subjectId)] = !current;
        localStorage.setItem(key, JSON.stringify(stored));
        setSubjectOnlyRevision((r) => r + 1);
        return;
      }
      const agg = subjectAggregate[subjectId];
      const shouldCheck = !(agg && agg.checked);
      target.materials.forEach((m) => toggle(m.checklistItemId, subjectId, m.materialId));
    },
    [lexicalSubjects, subjectAggregate, toggle, instanceId, editable]
  );

  const showAllReady = readinessState.allReady;

  return (
    <>
      {loading && <SkeletonLoading />}
      {!loading && (
        <div className="flex flex-col">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {templateName && (
                <div className="font-semibold text-[1.05rem] mb-2">
                  <small>Este es tu horario </small> {templateName}
                </div>
              )}
              {targetDateIso && (
                <div className="mb-4">
                  Fecha de tu horario: {formatDateForDisplay(targetDateIso)}
                </div>
              )}
              {phase && (
                <Badge
                  className="text-black bg-green-500 text-[0.7rem] opacity-[0.85]"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {phaseLabel} {editable ? '' : '(read only)'}
                </Badge>
              )}
              {showAllReady && (
                <div className="mt-4 text-green-600 font-medium" aria-live="polite">
                  All ready
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            {error && (
              <div className="whitespace-pre-wrap text-red-700">
                {error.replace(/Failed query:/, 'Error:').replace(/params:/, 'params:')}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {lexicalSubjects.map((subject) => {
                const hasMaterials = subject.materials.length > 0;
                const subjectId = subject.subjectId;
                const allChecked = hasMaterials 
                  ? subjectAggregate[subjectId]?.checked 
                  : subjectAggregate[subjectId]?.checked || false;
                return (
                  <Card 
                    key={subjectId} 
                    className={`p-4 flex flex-col gap-3 press-ripple ${allChecked ? 'bg-green-500/20' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        disabled={!editable}
                        checked={subjectAggregate[subjectId]?.checked || false}
                        onCheckedChange={() => toggleSubject(subjectId)}
                        aria-checked={
                          subjectAggregate[subjectId]?.indeterminate ? 'mixed' : undefined
                        }
                        ref={(el) => {
                          if (el && 'querySelector' in el) {
                            try {
                              const inputElement = (el as unknown as HTMLElement).querySelector(
                                'input'
                              );
                              if (inputElement) {
                                (inputElement as HTMLInputElement).indeterminate =
                                  subjectAggregate[subjectId]?.indeterminate || false;
                              }
                            } catch {}
                          }
                        }}
                      />
                      <div className="flex-1 flex flex-col gap-1 pt-1">
                        <div className="font-semibold text-base flex items-center justify-between">
                          <span className={!editable ? 'opacity-60' : ''}>
                            {subject.subjectName}
                          </span>
                        </div>
                      </div>
                    </div>
                    {hasMaterials && (
                      <div className="mt-2 pl-8">
                        <ul className="flex flex-col gap-3 list-none m-0 p-0">
                          {subject.materials.map((material) => (
                            <li 
                              key={material.materialId} 
                              className={`flex items-center gap-3 p-3 rounded ${material.checked ? 'bg-green-500/10' : ''}`}
                            >
                              <Checkbox
                                disabled={!editable}
                                checked={material.checked}
                                onCheckedChange={() =>
                                  toggle(material.checklistItemId, subjectId, material.materialId)
                                }
                              />
                              <span className="text-base">{material.materialName}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
              {lexicalSubjects.length === 0 && !loading && <div>No subjects</div>}
              {totalMaterials === 0 && lexicalSubjects.length > 0 && !loading && (
                <div className="text-base opacity-70">No materials required</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
