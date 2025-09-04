export interface Episode {
  id: string;
  name: string;
  overview?: string;
  air_date?: string;
  episode_number: number;
  season_number: number;
  still_path?: string;
  vote_average?: number;
  vote_count?: number;
  production_code?: string;
  runtime?: number;
  show_id?: string;
  crew?: CrewMember[];
  guest_stars?: GuestStar[];
}

export interface CrewMember {
  id: number;
  credit_id: string;
  name: string;
  department: string;
  job: string;
  gender?: number;
  profile_path?: string;
}

export interface GuestStar {
  id: number;
  name: string;
  credit_id: string;
  character: string;
  order: number;
  gender?: number;
  profile_path?: string;
}
