import { eq } from 'drizzle-orm';
import { child } from '../../db/schema';
import { getDbClient } from '../../db/client';

export interface CreateChildInput {
  name: string;
}

export async function createChild(input: CreateChildInput) {
  const db = getDbClient();
  const [inserted] = await db.insert(child).values({ name: input.name }).returning();
  return inserted;
}

export async function listChildren() {
  const db = getDbClient();
  return db.select().from(child).orderBy(child.name);
}

export async function getChildById(childId: number) {
  const db = getDbClient();
  const rows = await db.select().from(child).where(eq(child.id, childId)).limit(1);
  return rows[0] || null;
}

export async function deleteChild(childId: number) {
  const db = getDbClient();
  await db.delete(child).where(eq(child.id, childId));
}

export async function renameChild(childId: number, newName: string) {
  const db = getDbClient();
  const rows = await db
    .update(child)
    .set({ name: newName })
    .where(eq(child.id, childId))
    .returning();
  return rows[0] || null;
}
