export function getRequiredEnvVariable(variableName: string): string {
  const value = process.env[variableName];
  if (!value) throw new Error(`Missing required environment variable ${variableName}`);
  return value;
}
