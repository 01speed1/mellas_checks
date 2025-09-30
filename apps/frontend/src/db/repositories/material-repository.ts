import { eq } from 'drizzle-orm';
import { material } from '../../db/schema';
import { getDbClient } from '../../db/client';

export interface CreateMaterialInput {
  name: string;
}

export async function createMaterial(input: CreateMaterialInput) {
  const db = getDbClient();
  const [inserted] = await db.insert(material).values({ name: input.name }).returning();
  return inserted;
}

export async function listMaterials() {
  const db = getDbClient();
  return db.select().from(material).orderBy(material.name);
}

export async function renameMaterial(materialId: number, newName: string) {
  const db = getDbClient();
  const rows = await db
    .update(material)
    .set({ name: newName })
    .where(eq(material.id, materialId))
    .returning();
  return rows[0] || null;
}

export async function deleteMaterial(materialId: number) {
  const db = getDbClient();
  await db.delete(material).where(eq(material.id, materialId));
}
