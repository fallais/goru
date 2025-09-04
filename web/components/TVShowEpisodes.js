import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid2,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
} from '@mui/material';
import {
  Tv,
  FilterList,
} from '@mui/icons-material';
import EpisodeCard from './episodes/EpisodeCard';
import EpisodeFilters from './episodes/EpisodeFilters';
import { getTVShowEpisodes } from '../lib/api';

export default function TVShowEpisodes({ showId, showData }) {
  const [episodes, setEpisodes] = useState([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (showId) {
      fetchEpisodes();
    }
  }, [showId]);

  useEffect(() => {
    applyFilters();
  }, [episodes, selectedSeason, filters]);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new API function for getting TV show episodes
      const data = await getTVShowEpisodes(showId);
      const allEpisodes = data.episodes || data || [];
      
      // Extract unique seasons from episodes
      const uniqueSeasons = [...new Set(allEpisodes.map(ep => ep.season_number))].sort((a, b) => a - b);
      setSeasons(uniqueSeasons);
      setEpisodes(allEpisodes);

    } catch (err) {
      console.error('Failed to fetch episodes:', err);
      setError(err.message || 'Failed to fetch episodes');
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...episodes];

    // Filter by season
    if (selectedSeason !== 'all') {
      filtered = filtered.filter(episode => episode.season_number === parseInt(selectedSeason));
    }

    // Apply additional filters
    if (filters.minRating) {
      filtered = filtered.filter(episode => (episode.vote_average || 0) >= parseFloat(filters.minRating));
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'episode_number':
            return a.episode_number - b.episode_number;
          case 'air_date':
            return new Date(b.air_date || 0) - new Date(a.air_date || 0);
          case 'rating':
            return (b.vote_average || 0) - (a.vote_average || 0);
          case 'title':
            return (a.name || '').localeCompare(b.name || '');
          default:
            return 0;
        }
      });
    }

    setFilteredEpisodes(filtered);
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDownloadEpisode = (episode) => {
    // TODO: Implement episode download functionality
    console.log('Download episode:', episode);
  };

  const handleViewEpisodeDetails = (episode) => {
    // TODO: Implement episode details view
    console.log('View episode details:', episode);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Show Info */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Tv sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            {showData?.title || 'TV Show'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Total Episodes: {episodes.length} | Seasons: {seasons.length}
        </Typography>
      </Box>

      {/* Season Selector */}
      {seasons.length > 1 && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Season</InputLabel>
            <Select
              value={selectedSeason}
              label="Season"
              onChange={(e) => handleSeasonChange(e.target.value)}
            >
              <MenuItem value="all">All Seasons</MenuItem>
              {seasons.map(season => (
                <MenuItem key={season} value={season}>
                  Season {season}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedSeason !== 'all' && (
            <Chip
              label={`Season ${selectedSeason} (${filteredEpisodes.length} episodes)`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {/* Episode Filters */}
      <EpisodeFilters onFiltersChange={handleFiltersChange} />

      <Divider sx={{ my: 3 }} />

      {/* Episodes Grid */}
      {filteredEpisodes.length > 0 ? (
        <Grid2 container spacing={2}>
          {filteredEpisodes.map((episode, index) => (
            <Grid2 xs={12} sm={6} md={4} key={`${episode.season_number}-${episode.episode_number}`}>
              <EpisodeCard
                episode={episode}
                onDownload={handleDownloadEpisode}
                onViewDetails={handleViewEpisodeDetails}
              />
            </Grid2>
          ))}
        </Grid2>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No episodes found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedSeason !== 'all' 
              ? `No episodes found for Season ${selectedSeason}` 
              : 'No episodes available for this show'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
}
