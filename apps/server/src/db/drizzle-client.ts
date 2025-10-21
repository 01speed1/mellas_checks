import { drizzle } from 'drizzle-orm/libsql';
import { getDb } from './client.js';
import * as schema from './schema.js';

let drizzleSingleton: ReturnType<typeof drizzle> | undefined;

export function getDrizzle() {
  if (!drizzleSingleton) {
    const libsql = getDb();
    drizzleSingleton = drizzle(libsql, { schema });
  }
  return drizzleSingleton;
}
