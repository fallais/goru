import axios from 'axios';

// Create axios interceptor for global error handling
export const setupAxiosInterceptors = (showError) => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // You can add global request headers here if needed
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Don't show notifications here since our useApiCall hook handles it
      // But you can add logging or other global error handling
      console.error('API Error:', error);
      return Promise.reject(error);
    }
  );
};

export default axios;
