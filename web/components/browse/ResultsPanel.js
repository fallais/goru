import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  MovieFilter,
  TvRounded,
  QuestionMark,
} from '@mui/icons-material';

function ResultsPanel({ plan, loading }) {
  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
        <Typography variant="h6" gutterBottom>
          Plan Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading plan results...
        </Typography>
      </Paper>
    );
  }

  if (!plan || !plan.changes || plan.changes.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2, height: 'fit-content' }}>
        <Typography variant="h6" gutterBottom>
          Plan Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No changes to display. Run Plan to see proposed file renames.
        </Typography>
      </Paper>
    );
  }

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'movie':
        return <MovieFilter />;
      case 'tv':
      case 'episode':
        return <TvRounded />;
      default:
        return <QuestionMark />;
    }
  };

  const getMediaTypeColor = (mediaType) => {
    switch (mediaType) {
      case 'movie':
        return '#1976d2';
      case 'tv':
      case 'episode':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2, height: 'fit-content', maxHeight: '70vh', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Plan Results
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Chip 
          label={`${plan.changes.length} file(s) to rename`} 
          color="primary" 
          size="small" 
        />
      </Box>

      <List dense>
        {plan.changes.map((change, index) => (
          <React.Fragment key={index}>
            <ListItem sx={{ px: 0, py: 1 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getMediaIcon(change.metadata?.type)}
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      ml: 1, 
                      color: getMediaTypeColor(change.metadata?.type),
                      fontWeight: 'bold'
                    }}
                  >
                    {change.metadata?.title || 'Unknown Title'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  <strong>From:</strong> {change.original_name}
                </Typography>
                
                <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                  <strong>To:</strong> {change.new_name}
                </Typography>

                {change.metadata?.year && (
                  <Chip 
                    label={change.metadata.year} 
                    size="small" 
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                
                {change.metadata?.season && change.metadata?.episode && (
                  <Chip 
                    label={`S${change.metadata.season.toString().padStart(2, '0')}E${change.metadata.episode.toString().padStart(2, '0')}`}
                    size="small" 
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                )}
              </Box>
            </ListItem>
            {index < plan.changes.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}

export default ResultsPanel;
