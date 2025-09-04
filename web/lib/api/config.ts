const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8080';

export { BASE_URL };

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new ApiError(`Request failed: ${response.statusText}`, response.status);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API request failed:', error);
    throw new ApiError('Network error or server unavailable');
  }
}
