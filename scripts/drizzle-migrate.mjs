import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function getEnvVariable(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing required environment variable ' + name);
  return value;
}

function readJournalTags() {
  try {
    const journalPath = join(process.cwd(), 'drizzle', 'migrations', 'meta', '_journal.json');
    if (!existsSync(journalPath)) return [];
    const raw = readFileSync(journalPath, 'utf8');
    const json = JSON.parse(raw);
    return Array.isArray(json.entries) ? json.entries.map((e) => e.tag) : [];
  } catch {
    return [];
  }
}

async function run() {
  const shouldGenerate = process.argv.includes('--generate-first');
  if (shouldGenerate) {
    process.stdout.write('Running drizzle-kit generate before migrate\n');
    try {
      execSync('npx drizzle-kit generate', { stdio: 'inherit' });
    } catch (error) {
      process.stderr.write('Generation failed\n');
      process.exit(1);
    }
  }

  const beforeTags = readJournalTags();
  if (beforeTags.length) {
    process.stdout.write('Journal before migrate: ' + beforeTags.join(', ') + '\n');
  } else {
    process.stdout.write('No existing journal, fresh migration run\n');
  }

  const url = getEnvVariable('VITE_TURSO_DATABASE_URL');
  const authToken = getEnvVariable('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: 'drizzle/migrations' });

  const afterTags = readJournalTags();
  if (afterTags.length) {
    process.stdout.write('Journal after migrate: ' + afterTags.join(', ') + '\n');
  } else {
    process.stdout.write('No journal created by migrator\n');
  }
  const newTags = afterTags.filter((t) => !beforeTags.includes(t));
  if (newTags.length) {
    process.stdout.write('Applied migrations: ' + newTags.join(', ') + '\n');
  } else if (beforeTags.length) {
    process.stdout.write('No new migrations applied\n');
  }
  process.stdout.write('Drizzle migrations complete\n');
}

run().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
  process.exit(1);
});
