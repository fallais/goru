import { TVShow } from '../../types/tvshow';
import { apiRequest } from './config';

export async function getTVShows(query: string, year?: number): Promise<TVShow[]> {
  const searchParams = new URLSearchParams({ query });
  if (year) {
    searchParams.append('year', year.toString());
  }
  
  return apiRequest<TVShow[]>(`/api/tvshows?${searchParams}`);
}

export async function getTVShow(id: string): Promise<TVShow> {
  return apiRequest<TVShow>(`/api/tvshows/${id}`);
}
