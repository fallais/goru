import { DirectoryResponse, DirectoryParams } from '../../types/directory';
import { apiRequest } from './config';

export async function getDirectory(params: DirectoryParams): Promise<DirectoryResponse> {
  const searchParams = new URLSearchParams({ path: params.path });
  
  return apiRequest<DirectoryResponse>(`/api/directory?${searchParams}`);
}

export async function getDefaultDirectory(): Promise<string> {
  return apiRequest<string>('/api/directory/default');
}
