import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

function getEnvVariable(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable ' + name);
  return value;
}

async function run() {
  const url = getEnvVariable('VITE_TURSO_DATABASE_URL');
  const authToken = getEnvVariable('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });
  process.stdout.write('Drizzle migrations complete\n');
}

run().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exit(1);
});
