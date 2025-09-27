import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

function getEnvVariable(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable ' + name);
  return value;
}

async function dropAllTables(client) {
  const tables = [
    'checklist_item_state',
    'checklist_instance',
    'schedule_block',
    'schedule_version',
    'subject_material',
    'subject_requirement',
    'audit_event',
    'subject',
    'material',
    'schedule_template',
    'child',
  ];
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
  const url = getEnvVariable('VITE_TURSO_DATABASE_URL');
  const authToken = getEnvVariable('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  await dropAllTables(client);
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });
  process.stdout.write('Database reset and migrations re-applied\n');
}

run().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exit(1);
});
