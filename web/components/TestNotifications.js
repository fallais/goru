import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNotification } from '../contexts/NotificationContext';

const TestNotifications = () => {
  const { showError, showSuccess, showWarning, showInfo } = useNotification();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Test Notifications
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => showError('Backend server is not responding')}
        >
          Test Error
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => showSuccess('Changes applied successfully!')}
        >
          Test Success
        </Button>
        <Button 
          variant="contained" 
          color="warning"
          onClick={() => showWarning('This is a warning message')}
        >
          Test Warning
        </Button>
        <Button 
          variant="contained" 
          color="info"
          onClick={() => showInfo('This is an info message')}
        >
          Test Info
        </Button>
        <Button 
          variant="contained"
          onClick={() => showError('API endpoint not found. Please check if the backend is properly configured.')}
        >
          Test Network Error
        </Button>
      </Box>
    </Box>
  );
};

export default TestNotifications;
