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
} from '@mui/material';
import {
  Movie,
  Tv,
  Star,
  Visibility,
  Download,
  PlaylistPlay,
} from '@mui/icons-material';

export default function SearchResultCard({ result, onView, onDownload, onViewEpisodes }) {
  const getTypeIcon = () => {
    return result.type === 'movie' ? <Movie /> : <Tv />;
  };

  const getTypeLabel = () => {
    return result.type === 'movie' ? 'Movie' : 'TV Show';
  };

  const formatYear = () => {
    if (result.release_date) {
      return new Date(result.release_date).getFullYear();
    }
    if (result.first_air_date) {
      return new Date(result.first_air_date).getFullYear();
    }
    return result.year || '';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Chip
            icon={getTypeIcon()}
            label={getTypeLabel()}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="h6" component="div" gutterBottom>
          {result.title || result.name || 'Untitled'}
        </Typography>

        {formatYear() && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formatYear()}
          </Typography>
        )}

        {result.genre_ids && result.genre_ids.length > 0 && (
          <Box sx={{ mb: 1 }}>
            {result.genre_ids.slice(0, 3).map((genreId, index) => (
              <Chip
                key={genreId}
                label={`Genre ${genreId}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}

        {result.vote_average && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              value={result.vote_average / 2}
              precision={0.1}
              size="small"
              readOnly
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({result.vote_average?.toFixed(1)})
            </Typography>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          {result.overview || result.description || 'No description available.'}
        </Typography>
      </CardContent>

      <CardActions>
        {result.type === 'tv' ? (
          <>
            <Button
              size="small"
              startIcon={<PlaylistPlay />}
              onClick={() => onViewEpisodes && onViewEpisodes(result)}
              variant="contained"
              color="primary"
            >
              View Episodes
            </Button>
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={() => onView && onView(result)}
            >
              Details
            </Button>
          </>
        ) : (
          <>
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={() => onView && onView(result)}
            >
              View Details
            </Button>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => onDownload && onDownload(result)}
            >
              Download
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
}
