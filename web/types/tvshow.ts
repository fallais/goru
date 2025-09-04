export interface TVShow {
  id: string;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: Genre[];
  origin_country?: string[];
  original_language?: string;
  adult?: boolean;
  in_production?: boolean;
  languages?: string[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  tagline?: string;
  type?: string;
  homepage?: string;
  created_by?: Creator[];
  episode_run_time?: number[];
  networks?: Network[];
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  spoken_languages?: SpokenLanguage[];
  seasons?: Season[];
}

export interface Creator {
  id: number;
  credit_id: string;
  name: string;
  gender?: number;
  profile_path?: string;
}

export interface Network {
  id: number;
  name: string;
  logo_path?: string;
  origin_country?: string;
}

export interface Season {
  id: number;
  air_date?: string;
  episode_count: number;
  name: string;
  overview?: string;
  poster_path?: string;
  season_number: number;
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
