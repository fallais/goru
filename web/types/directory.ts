export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedDate?: string;
}

export interface DirectoryResponse {
  path: string;
  files: DirectoryEntry[];
}

export interface DirectoryParams {
  path: string;
}
