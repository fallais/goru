export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface SearchParams {
  query: string;
  year?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
