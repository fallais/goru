export interface Plan {
  id?: string;
  changes: PlanChange[];
  errors: PlanError[];
  created_at?: string;
  status?: string;
}

export interface PlanChange {
  id: string;
  action: string;
  before: VideoFile;
  after: VideoFile;
  conflict_ids?: string[];
}

export interface VideoFile {
  id: string;
  path: string;
  filename: string;
  file_type: string;
  media_type: string;
  metadata?: any;
  conflict_strategy: string;
}

export interface PlanError {
  file: string;
  error: string;
}

export interface CreatePlanRequest {
  directory: string;
  type?: string;     // "movie", "tv", "auto"
  provider?: string; // "tmdb", "tvdb", "anidb"
  recursive?: boolean;
}

export interface PlanOptions {
  dryRun?: boolean;
  backup?: boolean;
  overwrite?: boolean;
}

export interface ApplyPlanRequest {
  planId: string;
  options?: PlanOptions;
}
