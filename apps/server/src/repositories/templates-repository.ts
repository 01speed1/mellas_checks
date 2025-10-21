import { and, eq } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client.js';
import { scheduleTemplate } from '../db/schema.js';

export interface TemplateRow {
  id: string;
  childId: string;
  name: string;
}

export async function listTemplatesByChild(childId: string): Promise<TemplateRow[]> {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: scheduleTemplate.id,
      childId: scheduleTemplate.childId,
      name: scheduleTemplate.name,
    })
    .from(scheduleTemplate)
    .where(eq(scheduleTemplate.childId, Number(childId)))
    .orderBy(scheduleTemplate.name);
  return rows.map((r) => ({ id: String(r.id), childId: String(r.childId), name: r.name }));
}

export async function createTemplate(childId: number, name: string): Promise<number> {
  const db = getDrizzle();
  const result = await db
    .insert(scheduleTemplate)
    .values({ childId, name })
    .returning({ id: scheduleTemplate.id });
  return result[0].id;
}

export async function updateTemplateName(templateId: number, name: string): Promise<void> {
  const db = getDrizzle();
  await db
    .update(scheduleTemplate)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(scheduleTemplate.id, templateId));
}

export async function deleteTemplateById(templateId: number): Promise<void> {
  const db = getDrizzle();
  await db.delete(scheduleTemplate).where(eq(scheduleTemplate.id, templateId));
}
