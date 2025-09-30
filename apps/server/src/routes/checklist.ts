import { FastifyInstance } from 'fastify';
import { ensureChecklist } from '../services/checklist-service';
import { loadChecklist } from '../services/load-checklist-service';
import { toggleChecklistItem } from '../services/toggle-checklist-item-service';
import { reselectTemplate } from '../services/reselect-checklist-service';
import { summarizeChecklist } from '../services/summary-checklist-service';
import { loadEnv } from '../config/env';
import { computePhase } from '../lib/time-phase';

export async function checklistRoutes(app: FastifyInstance) {
  app.post('/checklist/ensure', async (request, reply) => {
    const body = request.body as any;
    const childId = Number(body?.childId);
    const templateId = Number(body?.templateId);
    if (!childId || !templateId)
      return reply
        .code(400)
        .send({ error: 'validation_error', message: 'childId and templateId required' });
    const env = loadEnv();
    const phaseResult = computePhase(new Date(), env.SCHOOL_TIMEZONE);
    if (!phaseResult.editable)
      return reply
        .code(403)
        .send({ error: 'phase_locked', message: 'Checklist cannot be ensured in locked phase' });
    try {
      const result = await ensureChecklist(childId, templateId, phaseResult.targetDateISO);
      return {
        checklistInstanceId: result.checklistInstanceId,
        targetDateISO: result.targetDateISO,
        phase: phaseResult.phase,
        editable: phaseResult.editable,
        template: result.template,
        subjects: result.subjects,
        aggregates: result.aggregates,
      };
    } catch (e: any) {
      if (e && e.message === 'not_found')
        return reply.code(404).send({ error: 'not_found', message: 'Template or child mismatch' });
      return reply.code(500).send({ error: 'internal_error', message: 'Unexpected error' });
    }
  });

  app.get('/checklist', async (request, reply) => {
    const childId = Number((request.query as any).childId);
    if (!childId)
      return reply.code(400).send({ error: 'validation_error', message: 'childId required' });
    const env = loadEnv();
    const phaseResult = computePhase(new Date(), env.SCHOOL_TIMEZONE);
    try {
      const result = await loadChecklist(childId, phaseResult.targetDateISO);
      if (!result)
        return reply.code(404).send({ error: 'not_found', message: 'Checklist not found' });
      return { phase: phaseResult.phase, editable: phaseResult.editable, ...result };
    } catch {
      return reply.code(500).send({ error: 'internal_error', message: 'Unexpected error' });
    }
  });

  app.post('/checklist/item/toggle', async (request, reply) => {
    const body = request.body as any;
    const itemId = Number(body?.itemId);
    const checked = Boolean(body?.checked);
    if (!itemId || typeof body?.checked === 'undefined')
      return reply
        .code(400)
        .send({ error: 'validation_error', message: 'itemId and checked required' });
    const env = loadEnv();
    const phaseResult = computePhase(new Date(), env.SCHOOL_TIMEZONE);
    if (!phaseResult.editable)
      return reply.code(403).send({ error: 'phase_locked', message: 'Checklist is locked' });
    try {
      const updated = await toggleChecklistItem(itemId, checked);
      if (!updated) return reply.code(404).send({ error: 'not_found', message: 'Item not found' });
      return updated;
    } catch {
      return reply.code(500).send({ error: 'internal_error', message: 'Unexpected error' });
    }
  });

  app.post('/checklist/reselect', async (request, reply) => {
    const body = request.body as any;
    const childId = Number(body?.childId);
    const templateId = Number(body?.templateId);
    if (!childId || !templateId)
      return reply
        .code(400)
        .send({ error: 'validation_error', message: 'childId and templateId required' });
    const env = loadEnv();
    const phaseResult = computePhase(new Date(), env.SCHOOL_TIMEZONE);
    if (!phaseResult.editable)
      return reply
        .code(403)
        .send({ error: 'phase_locked', message: 'Cannot reselect in locked phase' });
    try {
      const result = await reselectTemplate(childId, templateId, phaseResult.targetDateISO);
      return { ...result, phase: phaseResult.phase, editable: phaseResult.editable };
    } catch (e: any) {
      if (e && e.message === 'not_found')
        return reply.code(404).send({ error: 'not_found', message: 'Template or child mismatch' });
      return reply.code(500).send({ error: 'internal_error', message: 'Unexpected error' });
    }
  });

  app.get('/checklist/summary', async (request, reply) => {
    const childId = Number((request.query as any).childId);
    if (!childId)
      return reply.code(400).send({ error: 'validation_error', message: 'childId required' });
    const env = loadEnv();
    const phaseResult = computePhase(new Date(), env.SCHOOL_TIMEZONE);
    try {
      const summary = await summarizeChecklist(childId, phaseResult.targetDateISO);
      if (!summary)
        return reply.code(404).send({ error: 'not_found', message: 'Checklist not found' });
      return { phase: phaseResult.phase, editable: phaseResult.editable, ...summary };
    } catch {
      return reply.code(500).send({ error: 'internal_error', message: 'Unexpected error' });
    }
  });
}
