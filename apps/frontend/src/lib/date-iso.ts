export function getTodayIso(): string {
  const now = new Date();
  return formatLocalYmd(now);
}

export function getYesterdayIsoFrom(dateIso: string): string {
  const parts = dateIso.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() - 1);
  return formatLocalYmd(date);
}

export function getTomorrowIso(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return formatLocalYmd(now);
}

function pad(value: number): string {
  return value < 10 ? '0' + value : String(value);
}

function formatLocalYmd(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function extractDateOnly(isoTimestamp: string): string {
  return isoTimestamp.split('T')[0];
}

export function formatDateForDisplay(dateIso: string): string {
  const cleanDate = dateIso.includes('T') ? dateIso.split('T')[0] : dateIso;
  const parts = cleanDate.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('es-MX', options);
}
