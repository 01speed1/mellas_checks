import React, { useMemo, useState, useCallback } from 'react';
import { useChecklist } from '../state/useChecklist';

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
    refresh,
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
    if (phase === 'pre_window') return 'Waiting (after 15:00 you can prepare)';
    if (phase === 'prep_window') return 'Preparation window open';
    if (phase === 'locked') return 'Locked (school time)';
    return 'Afternoon preparation open';
  }, [phase]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [subjectOnlyRevision, setSubjectOnlyRevision] = useState(0);
  const toggleExpand = useCallback((subjectId: number) => {
    setExpanded((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }, []);
  const totalMaterials = useMemo(
    () => subjects.reduce((acc, s) => acc + s.materials.length, 0),
    [subjects]
  );
  const subjectAggregate = useMemo(() => {
    const key = instanceId ? 'subjectOnlyStates:' + instanceId : null;
    let stored: Record<string, boolean> = {};
    if (key) {
      try {
        stored = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {}
    }
    return subjects.reduce<Record<number, { checked: boolean; indeterminate: boolean }>>(
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
  }, [subjects, instanceId, subjectOnlyRevision]);

  const readinessState = useMemo(() => {
    const key = instanceId ? 'subjectOnlyStates:' + instanceId : null;
    let stored: Record<string, boolean> = {};
    if (key) {
      try {
        stored = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {}
    }
    const emptySubjects = subjects.filter((s) => s.materials.length === 0).map((s) => s.subjectId);
    const emptySubjectsAllChecked = emptySubjects.every((id) => !!stored[String(id)]);
    const anyRequirements = emptySubjects.length > 0 || totalMaterials > 0;
    const materialsAllChecked = items.length === 0 ? true : items.every((i) => i.checked);
    const allReady = anyRequirements && materialsAllChecked && emptySubjectsAllChecked;
    return { allReady };
  }, [subjects, instanceId, subjectOnlyRevision, totalMaterials, items]);

  const toggleSubject = useCallback(
    (subjectId: number) => {
      const target = subjects.find((s) => s.subjectId === subjectId);
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
        // force re-render by triggering state change via expanded toggle map (lightweight)
        setSubjectOnlyRevision((r) => r + 1);
        return;
      }
      const agg = subjectAggregate[subjectId];
      const shouldCheck = !(agg && agg.checked);
      target.materials.forEach((m) => toggle(subjectId, m.materialId));
    },
    [subjects, subjectAggregate, toggle]
  );
  const showAllReady = readinessState.allReady;
  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1>Checklist</h1>
      {templateName && <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{templateName}</div>}
      {targetDateIso && <div>Target date: {targetDateIso}</div>}
      {phase && (
        <div style={{ fontSize: '.9rem', opacity: 0.85 }} aria-live="polite" aria-atomic="true">
          {phaseLabel} {editable ? '' : '(read only)'}
        </div>
      )}
      {loading && <div>Loading...</div>}
      {error && (
        <div style={{ color: '#b00', whiteSpace: 'pre-wrap' }}>
          {error.replace(/Failed query:/, 'Error:').replace(/params:/, 'params:')}
        </div>
      )}
      {showAllReady && <div style={{ color: 'green' }}>All ready</div>}
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        <button onClick={() => refresh()} disabled={loading} style={{ padding: '.25rem .75rem' }}>
          Refresh
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {subjects.map((s) => {
          const hasMaterials = s.materials.length > 0;
          const isOpen = expanded[s.subjectId] || false;
          return (
            <div
              key={s.subjectId}
              style={{ border: '1px solid #ccc', borderRadius: 4, padding: '.5rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: hasMaterials ? '.25rem' : 0,
                }}
              >
                <input
                  type="checkbox"
                  disabled={!editable}
                  checked={subjectAggregate[s.subjectId]?.checked || false}
                  onChange={() => toggleSubject(s.subjectId)}
                  ref={(el) => {
                    if (el)
                      el.indeterminate = subjectAggregate[s.subjectId]?.indeterminate || false;
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (hasMaterials) {
                      toggleExpand(s.subjectId);
                    } else if (editable) {
                      toggleSubject(s.subjectId);
                    }
                  }}
                  aria-expanded={hasMaterials ? isOpen : undefined}
                  aria-controls={hasMaterials ? 'subject-panel-' + s.subjectId : undefined}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 600,
                    cursor: editable ? 'pointer' : 'default',
                    opacity: !editable ? 0.6 : 1,
                  }}
                >
                  {s.subjectName}{' '}
                  {hasMaterials && <span style={{ fontSize: '.8rem' }}>{isOpen ? '▼' : '▶'}</span>}
                </button>
              </div>
              {!hasMaterials && totalMaterials > 0 && (
                <div style={{ opacity: 0.7 }}>No materials</div>
              )}
              {hasMaterials && isOpen && (
                <ul
                  id={'subject-panel-' + s.subjectId}
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.25rem',
                  }}
                >
                  {s.materials.map((m) => (
                    <li
                      key={m.materialId}
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={!editable}
                          checked={m.checked}
                          onChange={() => toggle(s.subjectId, m.materialId)}
                        />
                        <span>{m.materialName}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {subjects.length === 0 && !loading && <div>No subjects</div>}
        {totalMaterials === 0 && subjects.length > 0 && !loading && (
          <div style={{ opacity: 0.7 }}>No materials required</div>
        )}
      </div>
    </div>
  );
}
