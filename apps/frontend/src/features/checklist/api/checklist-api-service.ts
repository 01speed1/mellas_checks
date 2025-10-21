import { apiRequest } from '../../../lib/api-client';

export interface ChecklistItemDto {
  checklistItemId: number;
  materialId: number;
  materialName: string;
  checked: boolean;
  checkedAt?: string | null;
}

export interface ChecklistSubjectDto {
  subjectId: number;
  subjectName: string;
  hasMaterials: boolean;
  materials: ChecklistItemDto[];
}

export interface ChecklistTemplateDto {
  id: number;
  name: string;
}

export interface EnsureChecklistResponse {
  checklistInstanceId: number;
  targetDateISO: string;
  phase: string;
  editable: boolean;
  template: ChecklistTemplateDto;
  subjects: ChecklistSubjectDto[];
  aggregates: {
    total: number;
    checked: number;
    allReady: boolean;
  };
}

export async function ensureChecklistForTemplate(
  childId: number,
  templateId: number
): Promise<EnsureChecklistResponse> {
  return apiRequest<EnsureChecklistResponse>('/checklist/ensure', 'POST', {
    body: { childId, templateId },
  });
}

export interface LoadChecklistResponse {
  checklistInstanceId: number;
  targetDateISO: string;
  phase: string;
  editable: boolean;
  template: ChecklistTemplateDto;
  subjects: ChecklistSubjectDto[];
  aggregates: {
    total: number;
    checked: number;
    allReady: boolean;
  };
}

export async function loadChecklistForChild(childId: number): Promise<LoadChecklistResponse> {
  return apiRequest<LoadChecklistResponse>('/checklist', 'GET', {
    query: { childId },
  });
}

export interface ToggleChecklistItemResponse {
  id: number;
  checked: number;
  checkedAt: string | null;
}

export async function toggleChecklistItemState(
  itemId: number,
  checked: boolean
): Promise<ToggleChecklistItemResponse> {
  return apiRequest<ToggleChecklistItemResponse>('/checklist/item/toggle', 'POST', {
    body: { itemId, checked },
  });
}

export interface ReselectTemplateResponse {
  checklistInstanceId: number;
  targetDateISO: string;
  phase: string;
  editable: boolean;
  template: ChecklistTemplateDto;
  subjects: ChecklistSubjectDto[];
  aggregates: {
    total: number;
    checked: number;
    allReady: boolean;
  };
}

export async function reselectChecklistTemplate(
  childId: number,
  templateId: number
): Promise<ReselectTemplateResponse> {
  return apiRequest<ReselectTemplateResponse>('/checklist/reselect', 'POST', {
    body: { childId, templateId },
  });
}

export interface ChecklistSummaryResponse {
  phase: string;
  editable: boolean;
  checklistInstanceId: number;
  targetDateISO: string;
  templateName: string;
  allReady: boolean;
  totalItems: number;
  checkedItems: number;
}

export async function fetchChecklistSummary(childId: number): Promise<ChecklistSummaryResponse> {
  return apiRequest<ChecklistSummaryResponse>('/checklist/summary', 'GET', {
    query: { childId },
  });
}
