import { Movie } from '../../types/movie';
import { TVShow } from '../../types/tvshow';
import { Episode } from '../../types/episode';
import { apiRequest } from './config';

export async function searchMovies(query: string, year?: number): Promise<Movie[]> {
  const searchParams = new URLSearchParams({ query });
  if (year) {
    searchParams.append('year', year.toString());
  }
  
  return apiRequest<Movie[]>(`/api/movies?${searchParams}`);
}

export async function searchTVShows(query: string, year?: number): Promise<TVShow[]> {
  const searchParams = new URLSearchParams({ query });
  if (year) {
    searchParams.append('year', year.toString());
  }
  
  return apiRequest<TVShow[]>(`/api/tvshows?${searchParams}`);
}

export async function searchEpisodes(query: string): Promise<Episode[]> {
  const searchParams = new URLSearchParams({ query });
  
  return apiRequest<Episode[]>(`/api/episodes?${searchParams}`);
}
