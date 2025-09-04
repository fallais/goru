export interface Movie {
  id: string;
  title: string;
  year?: number;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  budget?: number;
  revenue?: number;
  imdb_id?: string;
  tagline?: string;
  status?: string;
  homepage?: string;
  original_language?: string;
  original_title?: string;
  popularity?: number;
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  spoken_languages?: SpokenLanguage[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path?: string;
  origin_country?: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  iso_639_1: string;
  name: string;
}
