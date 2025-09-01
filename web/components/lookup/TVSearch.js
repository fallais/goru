import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
} from '@mui/material';
import { Search } from '@mui/icons-material';

const TVSearch = ({ 
  searchQuery, 
  setSearchQuery, 
  searchYear, 
  setSearchYear, 
  searchSeason, 
  setSearchSeason, 
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
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="TV Show Title"
            placeholder="Enter TV show title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        <Grid item xs={4} md={2}>
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
        <Grid item xs={4} md={2}>
          <TextField
            fullWidth
            size="small"
            label="Season (Optional)"
            placeholder="1"
            value={searchSeason}
            onChange={(e) => setSearchSeason(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        <Grid item xs={4} md={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={onSearch}
            disabled={loading}
            startIcon={<Search />}
          >
            Search TV Shows
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TVSearch;
