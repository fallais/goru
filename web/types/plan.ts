export interface Plan {
  id?: string;
  files: PlanFile[];
  created_at?: string;
  status?: string;
}

export interface PlanFile {
  originalPath: string;
  newPath: string;
  operation: 'move' | 'rename' | 'copy';
  status?: 'pending' | 'completed' | 'failed';
}

export interface CreatePlanRequest {
  path: string;
  files: string[];
  options?: PlanOptions;
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
