import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { child, subject, material, scheduleTemplate } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error('Missing env ' + name);
  return value;
}

async function main() {
  const url = getEnv('VITE_TURSO_DATABASE_URL');
  const authToken = getEnv('VITE_TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  try {
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    console.log(
      'Tables:',
      tables.rows.map((r) => r.name)
    );
  } catch (e) {
    console.error('Error listing tables', e);
  }
  try {
    const kids = await db.select().from(child);
    console.log('Children count:', kids.length);
    const juanita = kids.find((k) => k.name === 'Juanita Guerrero');
    console.log('Has Juanita:', Boolean(juanita));
  } catch (e) {
    console.error('Error selecting from child', e);
  }
  try {
    const subjects = await db.select().from(subject);
    console.log('Subjects count:', subjects.length);
  } catch (e) {
    console.error('Error selecting from subject', e);
  }
  try {
    const materials = await db.select().from(material);
    console.log('Materials count:', materials.length);
  } catch (e) {
    console.error('Error selecting from material', e);
  }
  try {
    const templates = await db.select().from(scheduleTemplate);
    console.log('Templates count:', templates.length);
    console.log(
      'Template names:',
      templates.map((t) => t.name)
    );
  } catch (e) {
    console.error('Error selecting from schedule_template', e);
  }
}

main().catch((e) => {
  console.error('Fatal', e);
  process.exit(1);
});
