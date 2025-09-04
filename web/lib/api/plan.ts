import { Plan, CreatePlanRequest, ApplyPlanRequest } from '../../types/plan';
import { apiRequest } from './config';

export async function createPlan(request: CreatePlanRequest): Promise<Plan> {
  return apiRequest<Plan>('/api/plan/create', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function applyPlan(request: ApplyPlanRequest): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>('/api/plan/apply', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
