import React from 'react';
import {
  Paper,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
} from '@mui/icons-material';

function ActionsPanel({ 
  loading,
  currentPath,
  onPlan,
  onApply,
  planExists
}) {
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: '#4caf50', 
            '&:hover': { backgroundColor: '#45a049' },
            fontWeight: 'bold',
            minWidth: 120
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
          onClick={onPlan}
          disabled={loading || !currentPath || !currentPath.trim()}
        >
          Plan
        </Button>
        
        <Button
          variant="contained"
          sx={{ 
            backgroundColor: '#ff9800', 
            '&:hover': { backgroundColor: '#f57c00' },
            fontWeight: 'bold',
            minWidth: 120
          }}
          startIcon={<CheckCircle />}
          onClick={onApply}
          disabled={loading || !planExists}
        >
          Apply
        </Button>
      </Box>
    </Paper>
  );
}

export default ActionsPanel;
