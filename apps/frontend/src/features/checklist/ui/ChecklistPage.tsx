import React, { useMemo, useState, useCallback } from 'react';
import { useChecklist } from '../state/useChecklist';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/8bit/card';
import { Badge } from '@/components/ui/8bit/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/8bit/accordion';
import { Checkbox } from '@/components/ui/8bit/checkbox';

import SkeletonLoading from '@/components/Skeleton-loading';
import { AngleDown } from '@/components/icons/AngleDown';
import { IconButton } from '@/components/ui/8bit/icon-button';

export function ChecklistPage(): React.ReactElement {
  const childIdRaw = localStorage.getItem('activeChildId');
  const templateIdRaw = localStorage.getItem('activeTemplateId');
  const targetDateIso = localStorage.getItem('activeTargetDate');
  const childId = childIdRaw ? Number(childIdRaw) : null;
  const templateId = templateIdRaw ? Number(templateIdRaw) : null;
  const {
    loading,
    error,
    items,
    allComplete,
    toggle,
    editable,
    subjects,
    templateName,
    phase,
    instanceId,
  } = useChecklist(childId, templateId, targetDateIso);

  React.useEffect(() => {
    const legacyKeys = ['activeChildIdentifier', 'activeScheduleIdentifier'];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }, []);

  const phaseLabel = useMemo(() => {
    if (!phase) return '';
    if (phase === 'pre_window') return 'En espera (después de las 3:00 pm puedes preparar)';
    if (phase === 'prep_window') return 'Ventana de preparación abierta';
    if (phase === 'locked') return 'Bloqueado (horario escolar)';
    return 'Preparación de tarde abierta';
  }, [phase]);

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [subjectOnlyRevision, setSubjectOnlyRevision] = useState(0);
  const toggleExpand = useCallback((subjectId: number) => {
    setExpanded((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }, []);

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
      target.materials.forEach((m) => toggle(subjectId, m.materialId));
    },
    [lexicalSubjects, subjectAggregate, toggle]
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
                <div className="mb-4">Fecha de tu horario: {targetDateIso} / Mañana</div>
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
                const isOpen = expanded[subjectId] || false;
                const accordionValue = isOpen ? String(subjectId) : '';
                return (
                  <Card key={subjectId} className="p-2 flex flex-col gap-2 press-ripple">
                    <div className="flex items-start gap-3">
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
                        <div className="font-semibold text-sm flex items-center justify-between">
                          <span className={!editable ? 'opacity-60' : 'font-size-sm'}>
                            {subject.subjectName}
                          </span>
                          {hasMaterials && (
                            <IconButton
                              onClick={() => toggleExpand(subjectId)}
                              aria-expanded={isOpen}
                              aria-controls={'subject-panel-' + subjectId}
                              disabled={!editable}
                              aria-label={isOpen ? 'Cerrar materiales' : 'Ver materiales'}
                              className="transition-transform"
                            >
                              <AngleDown
                                className={
                                  'w-4 h-4 fill-current transform transition-transform duration-200 ' +
                                  (isOpen ? 'rotate-180' : 'rotate-0')
                                }
                              />
                            </IconButton>
                          )}
                        </div>
                      </div>
                    </div>
                    {hasMaterials && (
                      <Accordion
                        type="single"
                        collapsible
                        value={accordionValue}
                        onValueChange={(val) => {
                          setExpanded((prev) => ({
                            ...prev,
                            [subjectId]: val === String(subjectId),
                          }));
                        }}
                        className="border-none"
                      >
                        <AccordionItem value={String(subjectId)} className="border-none">
                          <AccordionContent id={'subject-panel-' + subjectId} className="pt-2">
                            <ul className="flex flex-col gap-2 list-none m-0 p-0">
                              {subject.materials.map((material) => (
                                <li key={material.materialId} className="flex items-center gap-2">
                                  <Checkbox
                                    disabled={!editable}
                                    checked={material.checked}
                                    onCheckedChange={() => toggle(subjectId, material.materialId)}
                                  />
                                  <span className="text-sm">{material.materialName}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </Card>
                );
              })}
              {lexicalSubjects.length === 0 && !loading && <div>No subjects</div>}
              {totalMaterials === 0 && lexicalSubjects.length > 0 && !loading && (
                <div className="text-sm opacity-70">No materials required</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
