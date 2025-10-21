import { apiRequest } from '@/lib/api-client';

export interface TemplateDto {
  id: number;
  name: string;
  childId: number;
  createdAt?: string;
}

interface TemplatesResponse {
  templates: TemplateDto[];
}

export async function fetchTemplatesByChild(childId: number): Promise<TemplateDto[]> {
  const response = await apiRequest<TemplatesResponse>(`/children/${childId}/templates`);
  return response.templates;
}
