import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'error', // 'error', 'warning', 'info', 'success'
    autoHideDuration: 3000,
  });

  const showNotification = (message, severity = 'error', autoHideDuration = 3000) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration,
    });
  };

  const showError = (message, autoHideDuration = 3000) => {
    showNotification(message, 'error', autoHideDuration);
  };

  const showSuccess = (message, autoHideDuration = 3000) => {
    showNotification(message, 'success', autoHideDuration);
  };

  const showWarning = (message, autoHideDuration = 3000) => {
    showNotification(message, 'warning', autoHideDuration);
  };

  const showInfo = (message, autoHideDuration = 3000) => {
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
