import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

let cachedClient: ReturnType<typeof drizzle> | undefined;

export function getDbClient() {
  if (!cachedClient) {
    const url = import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined;
    const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined;
    if (!url) throw new Error('Missing VITE_TURSO_DATABASE_URL');
    if (!authToken) throw new Error('Missing VITE_TURSO_AUTH_TOKEN');
    const libsql = createClient({ url, authToken });
    cachedClient = drizzle(libsql, { schema });
  }
  return cachedClient;
}

export type DatabaseClient = ReturnType<typeof getDbClient>;
