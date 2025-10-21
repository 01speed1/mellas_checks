import { getDrizzle } from '../db/drizzle-client';
import { subject } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface SubjectRow {
  id: number;
  name: string;
}

export async function listSubjects(): Promise<SubjectRow[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ id: subject.id, name: subject.name })
    .from(subject)
    .orderBy(subject.name);
  return rows;
}

export async function createSubject(name: string): Promise<number> {
  const db = getDrizzle();
  const result = await db.insert(subject).values({ name }).returning({ id: subject.id });
  return result[0].id;
}

export async function updateSubjectName(subjectId: number, name: string): Promise<void> {
  const db = getDrizzle();
  await db
    .update(subject)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(subject.id, subjectId));
}

export async function deleteSubjectById(subjectId: number): Promise<void> {
  const db = getDrizzle();
  await db.delete(subject).where(eq(subject.id, subjectId));
}
