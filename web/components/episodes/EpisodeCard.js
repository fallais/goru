import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Rating,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Download,
  Visibility,
  CalendarToday,
} from '@mui/icons-material';

export default function EpisodeCard({ episode, onDownload, onViewDetails }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        {/* Episode Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Chip
            label={`S${episode.season_number}E${episode.episode_number}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {episode.vote_average > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                value={episode.vote_average / 2}
                precision={0.1}
                size="small"
                readOnly
              />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                ({episode.vote_average?.toFixed(1)})
              </Typography>
            </Box>
          )}
        </Box>

        {/* Episode Title */}
        <Typography variant="h6" component="div" gutterBottom sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '3rem'
        }}>
          {episode.name || `Episode ${episode.episode_number}`}
        </Typography>

        {/* Episode Metadata */}
        <Box sx={{ mb: 2 }}>
          {episode.air_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(episode.air_date)}
              </Typography>
            </Box>
          )}
          
          {episode.runtime && (
            <Typography variant="caption" color="text.secondary" display="block">
              Runtime: {formatRuntime(episode.runtime)}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Episode Overview */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {episode.overview || 'No description available.'}
        </Typography>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<Download />}
          onClick={() => onDownload && onDownload(episode)}
          variant="contained"
          color="primary"
        >
          Download
        </Button>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onViewDetails && onViewDetails(episode)}
        >
          Details
        </Button>
      </CardActions>
    </Card>
  );
}
