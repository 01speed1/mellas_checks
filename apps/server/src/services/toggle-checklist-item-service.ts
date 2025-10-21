import { eq } from 'drizzle-orm';
import { getDrizzle } from '../db/drizzle-client.js';
import { checklistItemState } from '../db/schema.js';

export async function toggleChecklistItem(itemId: number, checked: boolean) {
  const db = getDrizzle();
  const rows = await db
    .update(checklistItemState)
    .set({ isChecked: checked, checkedAt: checked ? new Date().toISOString() : null })
    .where(eq(checklistItemState.id, itemId))
    .returning({
      id: checklistItemState.id,
      isChecked: checklistItemState.isChecked,
      checkedAt: checklistItemState.checkedAt,
    });
  const row = rows[0];
  if (!row) return undefined;
  return { checklistItemId: row.id, checked: row.isChecked, checkedAt: row.checkedAt };
}
