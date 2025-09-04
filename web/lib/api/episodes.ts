import { Episode } from '../../types/episode';
import { apiRequest } from './config';

export async function getEpisodes(query: string): Promise<Episode[]> {
  const searchParams = new URLSearchParams({ query });
  
  return apiRequest<Episode[]>(`/api/episodes?${searchParams}`);
}

export async function getTVShowEpisodes(showId: string): Promise<Episode[]> {
  return apiRequest<Episode[]>(`/api/tvshows/${showId}/episodes`);
}
