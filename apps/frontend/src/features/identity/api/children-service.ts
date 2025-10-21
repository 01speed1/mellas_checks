import { apiRequest } from '@/lib/api-client';

export interface ChildDto {
  id: string;
  name: string;
  createdAt?: string;
}

interface ChildrenResponse {
  children: ChildDto[];
}

export async function fetchChildren(): Promise<ChildDto[]> {
  const response = await apiRequest<ChildrenResponse>('/children');
  return response.children;
}
