import { and, eq } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client';
import { scheduleTemplate } from '../db/schema';

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
