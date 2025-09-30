import { inArray } from 'drizzle-orm';
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
