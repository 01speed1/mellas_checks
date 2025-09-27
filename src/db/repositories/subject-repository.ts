import { and, eq } from 'drizzle-orm';
import { subject, subjectMaterial, material } from '../../db/schema';
import { getDbClient } from '../../db/client';

export interface CreateSubjectInput {
  name: string;
}

export async function createSubject(input: CreateSubjectInput) {
  const db = getDbClient();
  const [inserted] = await db.insert(subject).values({ name: input.name }).returning();
  return inserted;
}

export async function listSubjects() {
  const db = getDbClient();
  return db.select().from(subject).orderBy(subject.name);
}

export async function renameSubject(subjectId: number, newName: string) {
  const db = getDbClient();
  const rows = await db
    .update(subject)
    .set({ name: newName })
    .where(eq(subject.id, subjectId))
    .returning();
  return rows[0] || null;
}

export async function deleteSubject(subjectId: number) {
  const db = getDbClient();
  await db.delete(subject).where(eq(subject.id, subjectId));
}

export async function attachMaterialToSubject(subjectId: number, materialId: number) {
  const db = getDbClient();
  await db.insert(subjectMaterial).values({ subjectId, materialId }).onConflictDoNothing();
}

export async function detachMaterialFromSubject(subjectId: number, materialId: number) {
  const db = getDbClient();
  await db
    .delete(subjectMaterial)
    .where(
      and(eq(subjectMaterial.subjectId, subjectId), eq(subjectMaterial.materialId, materialId))
    );
}

export async function listSubjectMaterials(subjectId: number) {
  const db = getDbClient();
  return db
    .select({ materialId: material.id, materialName: material.name })
    .from(subjectMaterial)
    .innerJoin(material, eq(material.id, subjectMaterial.materialId))
    .where(eq(subjectMaterial.subjectId, subjectId))
    .orderBy(material.name);
}
