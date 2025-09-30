import { createClient } from '@libsql/client'
import { loadEnv } from '../config/env'

let singleton: ReturnType<typeof createClient> | undefined

export function getDb() {
  if (!singleton) {
    const env = loadEnv()
    singleton = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  }
  return singleton
}