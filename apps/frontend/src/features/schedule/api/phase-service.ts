import { apiRequest } from '@/lib/api-client';

export type Phase = 'prep_afternoon' | 'prep_early' | 'locked' | 'next_cycle';

export interface PhaseResponse {
  phase: Phase;
  editable: boolean;
  nowISO: string;
  targetDateISO: string;
}

export async function fetchCurrentPhase(): Promise<PhaseResponse> {
  return apiRequest<PhaseResponse>('/phase', 'GET');
}
