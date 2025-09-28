import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

function getEnvVariable(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable ' + name);
  return value;
}

async function dropTables(client, full) {
  const baseTables = [
    'checklist_item_state',
    'checklist_instance',
    'schedule_block',
    'schedule_version',
    'template_subject_material',
    'subject_requirement',
    'audit_event',
    'subject',
    'material',
    'schedule_template',
    'child',
  ];
  const tables = full ? [...baseTables, '__drizzle_migrations'] : baseTables;
  for (const tableName of tables) {
    try {
      await client.execute(`DROP TABLE IF EXISTS ${tableName};`);
      process.stdout.write(`Dropped table ${tableName}\n`);
    } catch (err) {
      process.stderr.write(
        `Error dropping ${tableName}: ${err instanceof Error ? err.message : String(err)}\n`
      );
    }
  }
}

async function run() {
  const full = process.argv.includes('--full');
  const url = getEnvVariable('VITE_TURSO_DATABASE_URL');
  const authToken = getEnvVariable('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  await dropTables(client, full);
  const db = drizzle(client);
  if (full) {
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
    process.stdout.write('Full reset including migrations table. Migrations re-applied.\n');
  } else {
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
    process.stdout.write('Domain reset preserving migrations history.\n');
  }
}

run().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exit(1);
});
