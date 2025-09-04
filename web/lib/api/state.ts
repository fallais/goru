import { apiRequest } from './config';

export interface StateEntry {
  id: string;
  path: string;
  operation: string;
  timestamp: string;
  status: string;
}

export interface StateParams {
  active?: boolean;
  limit?: number;
}

export async function getState(params?: StateParams): Promise<StateEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined) {
    searchParams.append('active', params.active.toString());
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString());
  }
  
  const query = searchParams.toString();
  const endpoint = query ? `/api/state?${query}` : '/api/state';
  
  return apiRequest<StateEntry[]>(endpoint);
}

export async function revertState(): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>('/api/state/revert', {
    method: 'POST',
  });
}
