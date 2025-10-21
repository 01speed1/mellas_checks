import 'dotenv/config';

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SCHOOL_TIMEZONE: string;
  ALLOWED_ORIGIN: string;
  API_KEY?: string;
  LOG_LEVEL?: string;
  PORT?: string;
}

export function loadEnv(): Env {
  const required = [
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN',
    'SCHOOL_TIMEZONE',
    'ALLOWED_ORIGIN',
  ] as const;
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env ${key}`);
  }
  return {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL!,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN!,
    SCHOOL_TIMEZONE: process.env.SCHOOL_TIMEZONE!,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN!,
    API_KEY: process.env.API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    PORT: process.env.PORT,
  };
}
