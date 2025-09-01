import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
} from '@mui/material';
import { Search } from '@mui/icons-material';

const MovieSearch = ({ 
  searchQuery, 
  setSearchQuery, 
  searchYear, 
  setSearchYear, 
  onSearch, 
  loading 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Movie Title"
            placeholder="Enter movie title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Year (Optional)"
            placeholder="2023"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            onClick={onSearch}
            disabled={loading}
            startIcon={<Search />}
          >
            Search Movies
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MovieSearch;
