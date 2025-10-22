import { apiRequest } from '@/lib/api-client';

export interface ChildDto {
  id: string;
  name: string;
}

export interface TemplateDto {
  id: string;
  childId: string;
  name: string;
}

export interface SubjectDto {
  id: number;
  name: string;
}

export interface MaterialDto {
  id: number;
  name: string;
}

export async function createChildApi(name: string): Promise<ChildDto> {
  return apiRequest<ChildDto>('/admin/children', 'POST', { body: { name } });
}

export async function updateChildApi(childId: string, name: string): Promise<ChildDto> {
  return apiRequest<ChildDto>(`/admin/children/${childId}`, 'PUT', { body: { name } });
}

export async function deleteChildApi(childId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/children/${childId}`, 'DELETE');
}

export async function createTemplateApi(childId: string, name: string): Promise<TemplateDto> {
  return apiRequest<TemplateDto>(`/admin/children/${childId}/templates`, 'POST', {
    body: { name },
  });
}

export async function updateTemplateApi(templateId: string, name: string): Promise<TemplateDto> {
  return apiRequest<TemplateDto>(`/admin/templates/${templateId}`, 'PUT', { body: { name } });
}

export async function deleteTemplateApi(templateId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/templates/${templateId}`, 'DELETE');
}

export async function listSubjectsApi(): Promise<SubjectDto[]> {
  const response = await apiRequest<{ subjects: SubjectDto[] }>('/admin/subjects', 'GET');
  return response.subjects;
}

export async function createSubjectApi(name: string): Promise<SubjectDto> {
  return apiRequest<SubjectDto>('/admin/subjects', 'POST', { body: { name } });
}

export async function updateSubjectApi(subjectId: number, name: string): Promise<SubjectDto> {
  return apiRequest<SubjectDto>(`/admin/subjects/${subjectId}`, 'PUT', { body: { name } });
}

export async function deleteSubjectApi(subjectId: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/subjects/${subjectId}`, 'DELETE');
}

export async function listMaterialsApi(): Promise<MaterialDto[]> {
  const response = await apiRequest<{ materials: MaterialDto[] }>('/admin/materials', 'GET');
  return response.materials;
}

export async function createMaterialApi(name: string): Promise<MaterialDto> {
  return apiRequest<MaterialDto>('/admin/materials', 'POST', { body: { name } });
}

export async function updateMaterialApi(materialId: number, name: string): Promise<MaterialDto> {
  return apiRequest<MaterialDto>(`/admin/materials/${materialId}`, 'PUT', { body: { name } });
}

export async function deleteMaterialApi(materialId: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/materials/${materialId}`, 'DELETE');
}

export interface BlockDto {
  id: number;
  versionId: number;
  blockOrder: number;
  subjectId: number;
  subjectName: string;
}

export interface TemplateMaterialDto {
  subjectId: number;
  materialId: number;
  materialName: string;
}

export async function listBlocksForTemplateApi(
  templateId: number
): Promise<{ blocks: BlockDto[]; versionId: number | null }> {
  return apiRequest<{ blocks: BlockDto[]; versionId: number | null }>(
    `/admin/templates/${templateId}/blocks`,
    'GET'
  );
}

export async function listMaterialsForTemplateApi(
  templateId: number
): Promise<TemplateMaterialDto[]> {
  const response = await apiRequest<{ materials: TemplateMaterialDto[] }>(
    `/admin/templates/${templateId}/materials`,
    'GET'
  );
  return response.materials;
}
