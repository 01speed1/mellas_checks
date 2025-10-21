import { inArray, eq } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client';
import { material } from '../db/schema';

export interface MaterialRow {
  id: number;
  name: string;
}

export async function getMaterialsByIds(ids: number[]): Promise<MaterialRow[]> {
  if (ids.length === 0) return [];
  const db = getDrizzle();
  const rows = await db
    .select({ id: material.id, name: material.name })
    .from(material)
    .where(inArray(material.id, ids));
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function listMaterials(): Promise<MaterialRow[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ id: material.id, name: material.name })
    .from(material)
    .orderBy(material.name);
  return rows;
}

export async function createMaterial(name: string): Promise<number> {
  const db = getDrizzle();
  const result = await db.insert(material).values({ name }).returning({ id: material.id });
  return result[0].id;
}

export async function updateMaterialName(materialId: number, name: string): Promise<void> {
  const db = getDrizzle();
  await db
    .update(material)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(material.id, materialId));
}

export async function deleteMaterialById(materialId: number): Promise<void> {
  const db = getDrizzle();
  await db.delete(material).where(eq(material.id, materialId));
}
