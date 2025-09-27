import { and, eq, isNull, or } from 'drizzle-orm';
import { subjectRequirement, subject } from '../../db/schema';
import { getDbClient } from '../../db/client';

export interface CreateSubjectRequirementInput {
  subjectId: number;
  description: string;
  targetDate?: string | null;
  isRecurring?: boolean;
}

export async function createSubjectRequirement(input: CreateSubjectRequirementInput) {
  const db = getDbClient();
  const [inserted] = await db
    .insert(subjectRequirement)
    .values({
      subjectId: input.subjectId,
      description: input.description,
      targetDate: input.targetDate ?? null,
      isRecurring: input.isRecurring ?? false,
    })
    .returning();
  return inserted;
}

export async function listOpenRequirementsForDate(targetDateIso: string) {
  const db = getDbClient();
  return db
    .select({
      id: subjectRequirement.id,
      subjectId: subjectRequirement.subjectId,
      subjectName: subject.name,
      description: subjectRequirement.description,
      targetDate: subjectRequirement.targetDate,
      isRecurring: subjectRequirement.isRecurring,
    })
    .from(subjectRequirement)
    .innerJoin(subject, eq(subject.id, subjectRequirement.subjectId))
    .where(
      and(
        isNull(subjectRequirement.resolvedAt),
        or(
          eq(subjectRequirement.targetDate, targetDateIso),
          and(isNull(subjectRequirement.targetDate), eq(subjectRequirement.isRecurring, true))
        )
      )
    )
    .orderBy(subjectRequirement.id);
}

export async function resolveSubjectRequirement(requirementId: number, resolvedAtIso: string) {
  const db = getDbClient();
  const rows = await db
    .update(subjectRequirement)
    .set({ resolvedAt: resolvedAtIso })
    .where(eq(subjectRequirement.id, requirementId))
    .returning();
  return rows[0] || null;
}

export async function listRecurringRequirements() {
  const db = getDbClient();
  return db
    .select({
      id: subjectRequirement.id,
      subjectId: subjectRequirement.subjectId,
      description: subjectRequirement.description,
      isRecurring: subjectRequirement.isRecurring,
    })
    .from(subjectRequirement)
    .where(and(eq(subjectRequirement.isRecurring, true), isNull(subjectRequirement.resolvedAt)));
}

export async function listUnresolvedRequirements() {
  const db = getDbClient();
  return db
    .select({
      id: subjectRequirement.id,
      subjectId: subjectRequirement.subjectId,
      description: subjectRequirement.description,
      targetDate: subjectRequirement.targetDate,
      isRecurring: subjectRequirement.isRecurring,
    })
    .from(subjectRequirement)
    .where(isNull(subjectRequirement.resolvedAt));
}
