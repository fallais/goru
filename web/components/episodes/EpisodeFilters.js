import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid2,
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
} from '@mui/icons-material';

export default function EpisodeFilters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    minRating: '',
    sortBy: 'episode_number',
  });

  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      minRating: '',
      sortBy: 'episode_number',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.minRating || (filters.sortBy && filters.sortBy !== 'episode_number');

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="episode-filters-content"
          id="episode-filters-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography>Episode Filters</Typography>
            {hasActiveFilters && (
              <Chip
                size="small"
                label="Active"
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Minimum Rating</InputLabel>
                <Select
                  value={filters.minRating}
                  label="Minimum Rating"
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                >
                  <MenuItem value="">Any Rating</MenuItem>
                  <MenuItem value="5">5.0+</MenuItem>
                  <MenuItem value="6">6.0+</MenuItem>
                  <MenuItem value="7">7.0+</MenuItem>
                  <MenuItem value="8">8.0+</MenuItem>
                  <MenuItem value="9">9.0+</MenuItem>
                </Select>
              </FormControl>
            </Grid2>

            <Grid2 xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="episode_number">Episode Number</MenuItem>
                  <MenuItem value="air_date">Air Date</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                </Select>
              </FormControl>
            </Grid2>

            {hasActiveFilters && (
              <Grid2 xs={12}>
                <Button
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  variant="outlined"
                  size="small"
                >
                  Clear Filters
                </Button>
              </Grid2>
            )}
          </Grid2>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
