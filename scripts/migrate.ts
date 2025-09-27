import { readdirSync, readFileSync } from 'fs';
import 'dotenv/config';
import { join } from 'path';
import { createClient, Client } from '@libsql/client';
import { getRequiredEnvVariable } from './env-util';

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.execute(`CREATE TABLE IF NOT EXISTS migration_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL
  )`);
}

async function listAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.execute('SELECT name FROM migration_log ORDER BY id');
  return new Set(result.rows.map((r) => r.name as string));
}

function splitSqlStatements(fullSql: string): string[] {
  const statements: string[] = [];
  let buffer = '';
  for (let indexCounter = 0; indexCounter < fullSql.length; indexCounter++) {
    const character = fullSql[indexCounter];
    buffer += character;
    if (character === ';') {
      const trimmed = buffer.trim();
      if (trimmed.length > 1) statements.push(trimmed);
      buffer = '';
    }
  }
  const tail = buffer.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

async function applyMigration(client: Client, filePath: string, fileName: string): Promise<void> {
  const sqlContent = readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(sqlContent);
  await client.execute('BEGIN');
  try {
    for (let statementIndex = 0; statementIndex < statements.length; statementIndex++) {
      const statement = statements[statementIndex];
      try {
        await client.execute(statement);
      } catch (singleError) {
        throw new Error(
          `Migration ${fileName} failed at statement ${statementIndex + 1}/${statements.length}: ${
            singleError instanceof Error ? singleError.message : String(singleError)
          }\nStatement snippet: ${statement.slice(0, 120)}`
        );
      }
    }
    await client.execute({
      sql: 'INSERT INTO migration_log (name, applied_at) VALUES (?, datetime("now"))',
      args: [fileName],
    });
    await client.execute('COMMIT');
    process.stdout.write(`Applied migration ${fileName}\n`);
  } catch (error) {
    await client.execute('ROLLBACK');
    throw error;
  }
}

async function run(): Promise<void> {
  const url = getRequiredEnvVariable('VITE_TURSO_DATABASE_URL');
  const authToken = getRequiredEnvVariable('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  await ensureMigrationsTable(client);
  const applied = await listAppliedMigrations(client);
  const migrationsDir = join(process.cwd(), 'migrations');
  const allFiles = readdirSync(migrationsDir)
    .filter((f) => /^(\d+)_.*\.sql$/.test(f))
    .sort((a, b) => a.localeCompare(b));
  for (const fileName of allFiles) {
    if (applied.has(fileName)) continue;
    const filePath = join(migrationsDir, fileName);
    await applyMigration(client, filePath, fileName);
  }
  process.stdout.write('Migrations complete\n');
}

run().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exit(1);
});
