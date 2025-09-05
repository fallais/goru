import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration: number;
}

interface NotificationContextType {
  notification: NotificationState;
  showNotification: (message: string, severity?: 'error' | 'warning' | 'info' | 'success', autoHideDuration?: number) => void;
  showError: (message: string, autoHideDuration?: number) => void;
  showSuccess: (message: string, autoHideDuration?: number) => void;
  showWarning: (message: string, autoHideDuration?: number) => void;
  showInfo: (message: string, autoHideDuration?: number) => void;
  hideNotification: () => void;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'error', // 'error', 'warning', 'info', 'success'
    autoHideDuration: 3000,
  });

  const showNotification = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error', autoHideDuration = 3000) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration,
    });
  };

  const showError = (message: string, autoHideDuration = 3000) => {
    showNotification(message, 'error', autoHideDuration);
  };

  const showSuccess = (message: string, autoHideDuration = 3000) => {
    showNotification(message, 'success', autoHideDuration);
  };

  const showWarning = (message: string, autoHideDuration = 3000) => {
    showNotification(message, 'warning', autoHideDuration);
  };

  const showInfo = (message: string, autoHideDuration = 3000) => {
    showNotification(message, 'info', autoHideDuration);
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        hideNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
