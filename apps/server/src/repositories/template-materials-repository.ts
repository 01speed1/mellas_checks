import { and, eq, inArray } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client.js';
import { templateSubjectMaterial } from '../db/schema.js';

export interface TemplateSubjectMaterialLinkRow {
  subjectId: number;
  materialId: number;
}

export async function listTemplateSubjectMaterials(
  templateId: number,
  subjectIds: number[]
): Promise<TemplateSubjectMaterialLinkRow[]> {
  if (subjectIds.length === 0) return [];
  const db = getDrizzle();
  const rows = await db
    .select({
      subjectId: templateSubjectMaterial.subjectId,
      materialId: templateSubjectMaterial.materialId,
    })
    .from(templateSubjectMaterial)
    .where(
      and(
        eq(templateSubjectMaterial.templateId, templateId),
        inArray(templateSubjectMaterial.subjectId, subjectIds)
      )
    );
  return rows.map((r) => ({ subjectId: r.subjectId, materialId: r.materialId }));
}

export async function attachMaterialToTemplateSubject(
  templateId: number,
  subjectId: number,
  materialId: number
): Promise<void> {
  const db = getDrizzle();
  await db
    .insert(templateSubjectMaterial)
    .values({ templateId, subjectId, materialId })
    .onConflictDoNothing();
}

export async function detachMaterialFromTemplateSubject(
  templateId: number,
  subjectId: number,
  materialId: number
): Promise<void> {
  const db = getDrizzle();
  await db
    .delete(templateSubjectMaterial)
    .where(
      and(
        eq(templateSubjectMaterial.templateId, templateId),
        eq(templateSubjectMaterial.subjectId, subjectId),
        eq(templateSubjectMaterial.materialId, materialId)
      )
    );
}
