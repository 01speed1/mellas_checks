import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error('Missing env ' + name);
  return v;
}

async function main() {
  const url = getEnv('VITE_TURSO_DATABASE_URL');
  const authToken = getEnv('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  const tables = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
  const tableNames = tables.rows.map((r) => String(r.name));
  if (!tableNames.includes('checklist_item_state')) {
    const sql0000 = readFileSync('drizzle/migrations/0000_silent_kat_farrell.sql', 'utf8');
    for (const stmt of sql0000.split(/;\n/)) {
      const trimmed = stmt.trim();
      if (trimmed) await client.execute(trimmed);
    }
  }
  if (!tableNames.includes('checklist_item_state_set_updated_at')) {
    try {
      const sql0001 = readFileSync(
        'drizzle/migrations/0001_checklist_item_state_trigger.sql',
        'utf8'
      );
      await client.execute(sql0001);
    } catch {}
  }
  const hasChildId = await client.execute('PRAGMA table_info(schedule_template)');
  const childIdCol = hasChildId.rows.some((r) => r.name === 'child_id');
  const hasTemplateSubjectMaterial = tableNames.includes('template_subject_material');
  if (!childIdCol || !hasTemplateSubjectMaterial) {
    const sql0002 = readFileSync('drizzle/migrations/0002_child_scoped_templates.sql', 'utf8');
    for (const raw of sql0002.split(/;\n/)) {
      const s = raw.trim();
      if (s) await client.execute(s);
    }
  }
  process.stdout.write('Manual migrations applied if needed\n');
}

main().catch((e) => {
  process.stderr.write(String(e.stack || e) + '\n');
  process.exit(1);
});
