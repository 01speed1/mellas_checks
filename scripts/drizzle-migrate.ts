import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { getRequiredEnvVariable } from './env-util';

async function run(): Promise<void> {
  const url = getRequiredEnvVariable('VITE_TURSO_DATABASE_URL');
  const authToken = getRequiredEnvVariable('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });
  process.stdout.write('Drizzle migrations complete\n');
}

run().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exit(1);
});
