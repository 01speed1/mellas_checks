import { and, eq } from 'drizzle-orm';
import { getDbClient } from '../../db/client';
import { templateSubjectMaterial, material } from '../../db/schema';

export async function attachMaterialToTemplateSubject(
  templateId: number,
  subjectId: number,
  materialId: number
) {
  const db = getDbClient();
  await db
    .insert(templateSubjectMaterial)
    .values({ templateId, subjectId, materialId })
    .onConflictDoNothing();
}

export async function detachMaterialFromTemplateSubject(
  templateId: number,
  subjectId: number,
  materialId: number
) {
  const db = getDbClient();
  await db
    .delete(templateSubjectMaterial)
    .where(
      and(
        eq(templateSubjectMaterial.templateId, templateId),
        and(
          eq(templateSubjectMaterial.subjectId, subjectId),
          eq(templateSubjectMaterial.materialId, materialId)
        )
      )
    );
}

export async function listTemplateSubjectMaterials(
  templateId: number,
  subjectId: number
): Promise<Array<{ materialId: number; materialName: string }>> {
  const db = getDbClient();
  return db
    .select({ materialId: material.id, materialName: material.name })
    .from(templateSubjectMaterial)
    .innerJoin(material, eq(material.id, templateSubjectMaterial.materialId))
    .where(
      and(
        eq(templateSubjectMaterial.templateId, templateId),
        eq(templateSubjectMaterial.subjectId, subjectId)
      )
    )
    .orderBy(material.name);
}

export async function listMaterialsForTemplate(templateId: number) {
  const db = getDbClient();
  return db
    .select({
      templateId: templateSubjectMaterial.templateId,
      subjectId: templateSubjectMaterial.subjectId,
      materialId: templateSubjectMaterial.materialId,
      materialName: material.name,
    })
    .from(templateSubjectMaterial)
    .innerJoin(material, eq(material.id, templateSubjectMaterial.materialId))
    .where(eq(templateSubjectMaterial.templateId, templateId));
}
