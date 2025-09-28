import { desc, eq, lte, and } from 'drizzle-orm';
import { scheduleTemplate, scheduleVersion, scheduleBlock, subject } from '../../db/schema';
import { getDbClient } from '../../db/client';

export interface CreateScheduleTemplateInput {
  name: string;
  childId: number;
}

export async function createScheduleTemplate(input: CreateScheduleTemplateInput) {
  const db = getDbClient();
  const existing = await db
    .select()
    .from(scheduleTemplate)
    .where(and(eq(scheduleTemplate.childId, input.childId), eq(scheduleTemplate.name, input.name)))
    .limit(1);
  if (existing[0]) return existing[0];
  const [inserted] = await db
    .insert(scheduleTemplate)
    .values({ name: input.name, childId: input.childId })
    .returning();
  return inserted;
}

export async function listScheduleTemplates(childId?: number) {
  const db = getDbClient();
  if (typeof childId === 'number') {
    return db
      .select()
      .from(scheduleTemplate)
      .where(eq(scheduleTemplate.childId, childId))
      .orderBy(scheduleTemplate.name);
  }
  return db.select().from(scheduleTemplate).orderBy(scheduleTemplate.name);
}

export async function renameScheduleTemplate(templateId: number, newName: string) {
  const db = getDbClient();
  const rows = await db
    .update(scheduleTemplate)
    .set({ name: newName })
    .where(eq(scheduleTemplate.id, templateId))
    .returning();
  return rows[0] || null;
}

export async function deleteScheduleTemplate(templateId: number) {
  const db = getDbClient();
  await db.delete(scheduleTemplate).where(eq(scheduleTemplate.id, templateId));
}

export interface CreateScheduleVersionInput {
  templateId: number;
  validFrom: string;
}

export async function createScheduleVersion(input: CreateScheduleVersionInput) {
  const db = getDbClient();
  const [inserted] = await db
    .insert(scheduleVersion)
    .values({ templateId: input.templateId, validFrom: input.validFrom })
    .returning();
  return inserted;
}

export async function listScheduleVersions(templateId: number) {
  const db = getDbClient();
  return db
    .select()
    .from(scheduleVersion)
    .where(eq(scheduleVersion.templateId, templateId))
    .orderBy(desc(scheduleVersion.validFrom));
}

export interface CreateScheduleBlockInput {
  versionId: number;
  blockOrder: number;
  subjectId: number;
}

export async function createScheduleBlock(input: CreateScheduleBlockInput) {
  const db = getDbClient();
  const [inserted] = await db
    .insert(scheduleBlock)
    .values({
      versionId: input.versionId,
      blockOrder: input.blockOrder,
      subjectId: input.subjectId,
    })
    .returning();
  return inserted;
}

export async function listBlocksForVersion(versionId: number) {
  const db = getDbClient();
  return db
    .select({
      id: scheduleBlock.id,
      blockOrder: scheduleBlock.blockOrder,
      subjectId: scheduleBlock.subjectId,
      subjectName: subject.name,
    })
    .from(scheduleBlock)
    .innerJoin(subject, eq(subject.id, scheduleBlock.subjectId))
    .where(eq(scheduleBlock.versionId, versionId))
    .orderBy(scheduleBlock.blockOrder);
}

export async function deleteScheduleBlock(blockId: number) {
  const db = getDbClient();
  await db.delete(scheduleBlock).where(eq(scheduleBlock.id, blockId));
}

export interface ReorderBlockInput {
  blockId: number;
  newOrder: number;
}

export async function reorderScheduleBlock(input: ReorderBlockInput) {
  const db = getDbClient();
  const rows = await db
    .update(scheduleBlock)
    .set({ blockOrder: input.newOrder })
    .where(eq(scheduleBlock.id, input.blockId))
    .returning();
  return rows[0] || null;
}

export interface UpdateScheduleBlockInput {
  blockId: number;
  subjectId?: number;
}

export async function updateScheduleBlock(input: UpdateScheduleBlockInput) {
  const db = getDbClient();
  const update: any = {};
  if (typeof input.subjectId === 'number') update.subjectId = input.subjectId;
  const rows = await db
    .update(scheduleBlock)
    .set(update)
    .where(eq(scheduleBlock.id, input.blockId))
    .returning();
  return rows[0] || null;
}

export async function getActiveScheduleVersionForTemplate(
  templateId: number,
  targetDateIso: string
) {
  const db = getDbClient();
  const rows = await db
    .select()
    .from(scheduleVersion)
    .where(
      and(eq(scheduleVersion.templateId, templateId), lte(scheduleVersion.validFrom, targetDateIso))
    )
    .orderBy(desc(scheduleVersion.validFrom))
    .limit(1);
  return rows[0] || null;
}

export async function cloneScheduleVersionWithBlocks(
  sourceVersionId: number,
  newValidFrom: string
) {
  const db = getDbClient();
  const [sourceVersion] = await db
    .select()
    .from(scheduleVersion)
    .where(eq(scheduleVersion.id, sourceVersionId));
  if (!sourceVersion) return null;
  const [newVersion] = await db
    .insert(scheduleVersion)
    .values({
      templateId: sourceVersion.templateId,
      validFrom: newValidFrom,
    })
    .returning();
  const blocks = await db
    .select()
    .from(scheduleBlock)
    .where(eq(scheduleBlock.versionId, sourceVersionId));
  if (blocks.length > 0) {
    await db.insert(scheduleBlock).values(
      blocks.map((b) => ({
        versionId: newVersion.id,
        blockOrder: b.blockOrder,
        subjectId: b.subjectId,
      }))
    );
  }
  return newVersion;
}

export async function ensureEditableVersion(templateId: number, todayIso: string) {
  const db = getDbClient();
  const active = await getActiveScheduleVersionForTemplate(templateId, todayIso);
  if (!active) {
    const [created] = await db
      .insert(scheduleVersion)
      .values({ templateId, validFrom: todayIso })
      .returning();
    return created;
  }
  if (active.validFrom === todayIso) return active;
  const cloned = await cloneScheduleVersionWithBlocks(active.id, todayIso);
  return cloned;
}
