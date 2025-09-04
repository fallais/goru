import { Movie } from '../../types/movie';
import { apiRequest } from './config';

export async function getMovies(query: string, year?: number): Promise<Movie[]> {
  const searchParams = new URLSearchParams({ query });
  if (year) {
    searchParams.append('year', year.toString());
  }
  
  return apiRequest<Movie[]>(`/api/movies?${searchParams}`);
}

export async function getMovie(id: string): Promise<Movie> {
  return apiRequest<Movie>(`/api/movies/${id}`);
}
