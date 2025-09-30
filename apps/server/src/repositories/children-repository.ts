// Drizzle-based repository implementation
import { getDrizzle } from '../db/drizzle-client';
import { child } from '../db/schema';

export interface ChildRow {
  id: string;
  name: string;
}

export async function listChildren(): Promise<ChildRow[]> {
  const db = getDrizzle();
  const rows = await db.select({ id: child.id, name: child.name }).from(child).orderBy(child.name);
  // Maintain string id shape expected by callers
  return rows.map((r) => ({ id: String(r.id), name: r.name }));
}
