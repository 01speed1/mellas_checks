// Drizzle-based repository implementation
import { getDrizzle } from '../db/drizzle-client.js';
import { child } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface ChildRow {
  id: string;
  name: string;
}

export async function listChildren(): Promise<ChildRow[]> {
  const db = getDrizzle();
  const rows = await db.select({ id: child.id, name: child.name }).from(child).orderBy(child.name);
  return rows.map((r) => ({ id: String(r.id), name: r.name }));
}

export async function createChild(name: string): Promise<number> {
  const db = getDrizzle();
  const result = await db.insert(child).values({ name }).returning({ id: child.id });
  return result[0].id;
}

export async function updateChildName(childId: number, name: string): Promise<void> {
  const db = getDrizzle();
  await db
    .update(child)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(child.id, childId));
}

export async function deleteChildById(childId: number): Promise<void> {
  const db = getDrizzle();
  await db.delete(child).where(eq(child.id, childId));
}
