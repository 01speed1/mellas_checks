import { desc, eq, and, lte } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client';
import { scheduleVersion, scheduleBlock, scheduleTemplate, subject } from '../db/schema';

export interface ScheduleVersionRow {
  id: number;
  templateId: number;
  validFrom: string;
}
export interface ScheduleBlockRow {
  id: number;
  versionId: number;
  blockOrder: number;
  subjectId: number;
  subjectName: string;
}

export async function getLatestVersionAtOrBefore(templateId: number, targetDateIso: string) {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: scheduleVersion.id,
      templateId: scheduleVersion.templateId,
      validFrom: scheduleVersion.validFrom,
    })
    .from(scheduleVersion)
    .where(
      and(eq(scheduleVersion.templateId, templateId), lte(scheduleVersion.validFrom, targetDateIso))
    )
    .orderBy(desc(scheduleVersion.validFrom))
    .limit(1);
  return rows[0] as ScheduleVersionRow | undefined;
}

export async function createVersion(templateId: number, validFrom: string) {
  const db = getDrizzle();
  const inserted = await db
    .insert(scheduleVersion)
    .values({ templateId, validFrom })
    .returning({
      id: scheduleVersion.id,
      templateId: scheduleVersion.templateId,
      validFrom: scheduleVersion.validFrom,
    });
  return inserted[0] as ScheduleVersionRow;
}

export async function cloneBlocks(sourceVersionId: number, newVersionId: number) {
  const db = getDrizzle();
  const rows = await db
    .select({ blockOrder: scheduleBlock.blockOrder, subjectId: scheduleBlock.subjectId })
    .from(scheduleBlock)
    .where(eq(scheduleBlock.versionId, sourceVersionId))
    .orderBy(scheduleBlock.blockOrder);
  if (rows.length === 0) return;
  await db
    .insert(scheduleBlock)
    .values(
      rows.map((r) => ({
        versionId: newVersionId,
        blockOrder: r.blockOrder,
        subjectId: r.subjectId,
      }))
    );
}

export async function listBlocks(versionId: number): Promise<ScheduleBlockRow[]> {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: scheduleBlock.id,
      versionId: scheduleBlock.versionId,
      blockOrder: scheduleBlock.blockOrder,
      subjectId: scheduleBlock.subjectId,
      subjectName: subject.name,
    })
    .from(scheduleBlock)
    .innerJoin(subject, eq(scheduleBlock.subjectId, subject.id))
    .where(eq(scheduleBlock.versionId, versionId))
    .orderBy(scheduleBlock.blockOrder);
  return rows.map((r) => ({
    id: r.id,
    versionId: r.versionId,
    blockOrder: r.blockOrder,
    subjectId: r.subjectId,
    subjectName: r.subjectName,
  }));
}

export async function getTemplate(templateId: number) {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: scheduleTemplate.id,
      childId: scheduleTemplate.childId,
      name: scheduleTemplate.name,
    })
    .from(scheduleTemplate)
    .where(eq(scheduleTemplate.id, templateId))
    .limit(1);
  return rows[0];
}

export async function getVersion(versionId: number) {
  const db = getDrizzle();
  const rows = await db
    .select({
      id: scheduleVersion.id,
      templateId: scheduleVersion.templateId,
      validFrom: scheduleVersion.validFrom,
    })
    .from(scheduleVersion)
    .where(eq(scheduleVersion.id, versionId))
    .limit(1);
  return rows[0] as ScheduleVersionRow | undefined;
}
