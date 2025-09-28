import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listScheduleTemplates } from '../../db/repositories/schedule-repository';
import {
  ensureScheduleVersionForDate,
  resetChecklistInstanceForReselection,
} from '../checklist/api/snapshot-instance-service';
import { getTomorrowIso, getTodayIso } from '../../lib/date-iso';
import { evaluateStoredCycle } from '../../lib/cycle-phase';
import { purgeCycleState } from '../../lib/cycle-state';
import { ScheduleTemplate } from '../../db/types';

export function ScheduleSelector(): React.ReactElement {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [phase, setPhase] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [targetDateIso, setTargetDateIso] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);

  useEffect(() => {
    const result = purgeCycleState({ clearChild: false });
    if (!result.cleared && result.targetDateIso) {
      const storedTemplate = localStorage.getItem('activeTemplateId');
      if (storedTemplate) {
        setActiveTemplateId(Number(storedTemplate));
        setTargetDateIso(result.targetDateIso);
        setPhase(result.phase);
      }
    } else {
      setActiveTemplateId(null);
      setTargetDateIso(null);
      setPhase(null);
    }
  }, []);

  useEffect(() => {
    const storedChildId = localStorage.getItem('activeChildId');
    if (storedChildId) setActiveChildId(Number(storedChildId));
    else setActiveChildId(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (activeChildId == null) {
      setTemplates([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    listScheduleTemplates(activeChildId)
      .then((rows) => {
        if (!active) return;
        const parseDay = (name: string) => {
          const match = name.match(/Día\s+(\d+)/i);
          return match ? Number(match[1]) : 999;
        };
        const ordered = [...(rows as ScheduleTemplate[])].sort((a, b) => {
          const da = parseDay(a.name);
          const db = parseDay(b.name);
          if (da !== db) return da - db;
          return a.name.localeCompare(b.name, 'es');
        });
        setTemplates(ordered);
      })
      .catch(() => {
        if (active) setErrorMessage('Failed loading templates');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeChildId]);

  async function handleSelect(templateId: number): Promise<void> {
    const childIdRaw = localStorage.getItem('activeChildId');
    if (!childIdRaw) {
      navigate('/');
      return;
    }
    const childId = Number(childIdRaw);
    const todayIso = getTodayIso();
    const existingTarget = localStorage.getItem('activeTargetDate');
    if (existingTarget && existingTarget < todayIso) {
      localStorage.removeItem('activeTemplateId');
      localStorage.removeItem('activeTargetDate');
    }
    const tomorrowIso = getTomorrowIso();
    const version = await ensureScheduleVersionForDate(templateId, tomorrowIso);
    if (!version) return;
    const evalResult = evaluateStoredCycle(tomorrowIso);
    const previousTemplate = localStorage.getItem('activeTemplateId');
    if (
      previousTemplate &&
      Number(previousTemplate) !== templateId &&
      evalResult.phase === 'prep_window'
    ) {
      await resetChecklistInstanceForReselection(childId, tomorrowIso, version.id);
    }
    localStorage.setItem('activeTemplateId', String(templateId));
    localStorage.setItem('activeTargetDate', tomorrowIso);
    setActiveTemplateId(templateId);
    setTargetDateIso(tomorrowIso);
    setPhase(evalResult.phase);
    navigate('/checklist');
  }

  const disableSelection = useMemo(() => {
    if (!phase) return false;
    return phase === 'locked';
  }, [phase]);

  const phaseLabel = useMemo(() => {
    if (!phase) return '';
    if (phase === 'pre_window') return 'Waiting (after 15:00 prep opens)';
    if (phase === 'prep_window') return 'Preparation window open';
    if (phase === 'locked') return 'Locked (cannot reselect)';
    if (phase === 'afternoon_next') return 'New cycle open';
    return '';
  }, [phase]);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Select Schedule For Tomorrow</h1>
      {phase && (
        <div style={{ marginBottom: '.5rem', fontSize: '.9rem', opacity: 0.85 }}>{phaseLabel}</div>
      )}
      {activeTemplateId && targetDateIso && (
        <div style={{ marginBottom: '.75rem', fontSize: '.85rem' }}>
          Selected template: {templates.find((t) => t.id === activeTemplateId)?.name || 'Unknown'} /
          Target date: {targetDateIso}
        </div>
      )}
      {loading && <div>Loading...</div>}
      {errorMessage && <div>{errorMessage}</div>}
      {!loading && activeChildId == null && <div>Select a child first</div>}
      {!loading && templates.length === 0 && <div>No templates</div>}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {templates.map((t) => {
          const isActive = t.id === activeTemplateId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => handleSelect(t.id)}
                disabled={disableSelection && !isActive}
                style={{
                  fontWeight: isActive ? 'bold' : 'normal',
                  opacity: disableSelection && !isActive ? 0.55 : 1,
                }}
              >
                {t.name}
                {isActive ? ' (current)' : ''}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
