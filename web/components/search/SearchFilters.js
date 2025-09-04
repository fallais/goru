import React, { useState } from 'react';
import {
  Box,
  TextField,
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

export default function SearchFilters({ searchType, onFiltersChange }) {
  const [filters, setFilters] = useState({
    year: '',
    genre: '',
    rating: '',
    sortBy: 'relevance',
  });

  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      year: '',
      genre: '',
      rating: '',
      sortBy: 'relevance',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'relevance');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const genres = searchType === 'tv' 
    ? ['Action & Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Kids', 'Mystery', 'News', 'Reality', 'Sci-Fi & Fantasy', 'Soap', 'Talk', 'War & Politics', 'Western']
    : ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'];

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="search-filters-content"
          id="search-filters-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography>Advanced Filters</Typography>
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
            <Grid2 xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <MenuItem value="">Any Year</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>

            <Grid2 xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={filters.genre}
                  label="Genre"
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                >
                  <MenuItem value="">Any Genre</MenuItem>
                  {genres.map(genre => (
                    <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>

            <Grid2 xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Minimum Rating</InputLabel>
                <Select
                  value={filters.rating}
                  label="Minimum Rating"
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                  <MenuItem value="">Any Rating</MenuItem>
                  <MenuItem value="7">7.0+</MenuItem>
                  <MenuItem value="8">8.0+</MenuItem>
                  <MenuItem value="9">9.0+</MenuItem>
                </Select>
              </FormControl>
            </Grid2>

            <Grid2 xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="relevance">Relevance</MenuItem>
                  <MenuItem value="popularity">Popularity</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="release_date">Release Date</MenuItem>
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
                  Clear All Filters
                </Button>
              </Grid2>
            )}
          </Grid2>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
