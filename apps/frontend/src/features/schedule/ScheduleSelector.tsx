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

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/8bit/card';
import { Badge } from '@/components/ui/8bit/badge';

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
    if (phase === 'pre_window')
      return 'Esperando, aun estas en clase! (después de las 3:00 pm se abre)';
    if (phase === 'prep_window') return 'Puedes hacer checklist!';
    if (phase === 'locked') return 'Bloqueado ';
    if (phase === 'afternoon_next') return 'Nuevo ciclo abierto';
    return '';
  }, [phase]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Elige tu horario de mañana</CardTitle>
          {phase && <CardDescription>{phaseLabel}</CardDescription>}
        </CardHeader>
        {activeTemplateId && targetDateIso && (
          <CardContent>
            <p>
              horario seleccionado:
              {templates.find((t) => t.id === activeTemplateId)?.name || 'Unknown'}
            </p>
            <p> Fecha de tu horario: {targetDateIso}</p>
          </CardContent>
        )}
      </Card>

      {loading && <div>Loading...</div>}
      {errorMessage && <div>{errorMessage}</div>}
      {!loading && activeChildId == null && <div>Select a child first</div>}
      {!loading && templates.length === 0 && <div>No templates</div>}

      {!loading &&
        templates.length > 0 &&
        templates.map((template) => {
          const isActive = template.id === activeTemplateId;
          const disabled = disableSelection && !isActive;
          return (
            <Card
              key={template.id}
              className={`press-ripple my-2`}
              onClick={() => !disabled && handleSelect(template.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex-1">{template.name}</CardTitle>
                {isActive && <Badge className="ml-2 bg-green-500 text-black">Seleccionado</Badge>}
                {!isActive && disabled && (
                  <Badge className="ml-2 bg-white text-black">Bloqueado</Badge>
                )}
              </CardHeader>
            </Card>
          );
        })}
    </>
  );
}
