import { Plan, CreatePlanRequest, ApplyPlanRequest } from '../../types/plan';
import { apiRequest } from './config';

export async function createPlan(request: CreatePlanRequest): Promise<Plan> {
  const params = new URLSearchParams({
    directory: request.directory,
    type: request.type || 'auto',
    provider: request.provider || 'tmdb',
    recursive: request.recursive?.toString() || 'true'
  });
  
  return apiRequest<Plan>(`/api/plan/create?${params.toString()}`, {
    method: 'GET',
  });
}

export async function applyPlan(request: ApplyPlanRequest): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>('/api/plan/apply', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
