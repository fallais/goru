import { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { setupAxiosInterceptors } from '../lib/axios';

const AxiosSetup = () => {
  const { showError } = useNotification();

  useEffect(() => {
    setupAxiosInterceptors(showError);
  }, [showError]);

  return null;
};

export default AxiosSetup;
