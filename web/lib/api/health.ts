import { apiRequest } from './config';

export interface HealthStatus {
  status: string;
  timestamp: string;
  version?: string;
}

export async function getHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/api/health');
}
