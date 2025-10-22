import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTemplatesByChild, type TemplateDto } from './api/templates-service';
import {
  ensureChecklistForTemplate,
  reselectChecklistTemplate,
} from '../checklist/api/checklist-api-service';
import { getTomorrowIso, getTodayIso, formatDateForDisplay } from '../../lib/date-iso';
import { purgeCycleState } from '../../lib/cycle-state';
import { fetchCurrentPhase, type Phase } from './api/phase-service';

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
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [phase, setPhase] = useState<Phase | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [targetDateIso, setTargetDateIso] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);

  useEffect(() => {
    async function loadPhase() {
      try {
        const phaseData = await fetchCurrentPhase();
        const result = purgeCycleState({ clearChild: false });
        if (!result.cleared && result.targetDateIso) {
          const storedTemplate = localStorage.getItem('activeTemplateId');
          if (storedTemplate) {
            setActiveTemplateId(Number(storedTemplate));
            setTargetDateIso(result.targetDateIso);
            setPhase(phaseData.phase);
          }
        } else {
          setActiveTemplateId(null);
          setTargetDateIso(null);
          setPhase(null);
        }
      } catch (error) {
        console.error('Error loading phase', error);
        setPhase(null);
      }
    }
    loadPhase();
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
    fetchTemplatesByChild(activeChildId)
      .then((rows) => {
        if (!active) return;
        const parseDay = (name: string) => {
          const match = name.match(/Día\s+(\d+)/i);
          return match ? Number(match[1]) : 999;
        };
        const ordered = [...rows].sort((a, b) => {
          const da = parseDay(a.name);
          const db = parseDay(b.name);
          if (da !== db) return da - db;
          return a.name.localeCompare(b.name, 'es');
        });
        setTemplates(ordered);
      })
      .catch((error) => {
        console.error('Error loading templates', error);
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
    const previousTemplate = localStorage.getItem('activeTemplateId');
    try {
      const phaseData = await fetchCurrentPhase();
      let response;
      if (previousTemplate && Number(previousTemplate) !== templateId && phaseData.editable) {
        response = await reselectChecklistTemplate(childId, templateId);
      } else {
        response = await ensureChecklistForTemplate(childId, templateId);
      }
      const targetDateOnly = response.targetDateISO.split('T')[0];
      localStorage.setItem('activeTemplateId', String(templateId));
      localStorage.setItem('activeTargetDate', targetDateOnly);
      setActiveTemplateId(templateId);
      setTargetDateIso(targetDateOnly);
      setPhase(phaseData.phase);
      navigate('/checklist');
    } catch (error) {
      console.error('Error selecting template', error);
      setErrorMessage('Failed to select template');
    }
  }

  const disableSelection = useMemo(() => {
    if (!phase) return false;
    return phase === 'locked';
  }, [phase]);

  const phaseLabel = useMemo(() => {
    if (!phase) return '';
    if (phase === 'prep_afternoon') return 'Puedes preparar tu checklist para mañana! (tarde)';
    if (phase === 'prep_early') return 'Puedes preparar tu checklist! (mañana temprano)';
    if (phase === 'locked') return 'Bloqueado - Estás en la escuela';
    if (phase === 'next_cycle')
      return 'Esperando - Aún estás en clase (después de las 3:00 pm se abre)';
    return '';
  }, [phase]);

  const selectedTemplateName = useMemo(() => {
    if (!activeTemplateId) return 'Selecciona un horario';
    if (loading) return 'Cargando...';
    const template = templates.find((t) => Number(t.id) === Number(activeTemplateId));
    return template?.name || 'Unknown';
  }, [activeTemplateId, templates, loading]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Elige tu horario de mañana</CardTitle>
          {phase && <CardDescription>{phaseLabel}</CardDescription>}
        </CardHeader>
        {activeTemplateId && targetDateIso && (
          <CardContent>
            <p>horario seleccionado: {selectedTemplateName}</p>
            <p> Fecha de tu horario: {formatDateForDisplay(targetDateIso)}</p>
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
          const isActive = Number(template.id) === Number(activeTemplateId);
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
