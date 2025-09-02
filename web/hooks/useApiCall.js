import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';

export const useApiCall = () => {
  const { showError, showSuccess } = useNotification();

  const handleApiCall = async (
    apiFunction,
    {
      successMessage = null,
      errorPrefix = '',
      showSuccessNotification = false,
    } = {}
  ) => {
    try {
      const result = await apiFunction();
      
      if (showSuccessNotification && successMessage) {
        showSuccess(successMessage);
      }
      
      // Return just the response data, not the full Axios response object
      return { success: true, data: result.data };
    } catch (err) {
      let errorMessage = 'An unexpected error occurred';
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Backend server is not responding. Please check if the server is running.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check if the backend is properly configured.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      } else if (err.response?.status >= 400 && err.response?.status < 500) {
        errorMessage = err.response?.data?.error || `Request failed with status ${err.response.status}`;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (errorPrefix) {
        errorMessage = `${errorPrefix}: ${errorMessage}`;
      }
      
      showError(errorMessage);
      
      return { success: false, error: err };
    }
  };

  // Convenience methods for common HTTP methods
  const get = async (url, options = {}) => {
    return handleApiCall(() => axios.get(url, options), options);
  };

  const post = async (url, data = {}, options = {}) => {
    return handleApiCall(() => axios.post(url, data, options), options);
  };

  const put = async (url, data = {}, options = {}) => {
    return handleApiCall(() => axios.put(url, data, options), options);
  };

  const del = async (url, options = {}) => {
    return handleApiCall(() => axios.delete(url, options), options);
  };

  return {
    handleApiCall,
    get,
    post,
    put,
    delete: del,
  };
};

export default useApiCall;
