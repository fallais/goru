import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { Movie, Tv } from '@mui/icons-material';
import MovieSearch from './MovieSearch';
import TVSearch from './TVSearch';
import TMDBResults from './TMDBResults';

const TMDBSearch = ({ 
  movieQuery,
  setMovieQuery,
  movieYear,
  setMovieYear,
  tvQuery,
  setTvQuery,
  tvYear,
  setTvYear,
  tvSeason,
  setTvSeason,
  tmdbResults,
  loadingTmdb,
  selectedTmdbItem,
  onSearch,
  onSelectItem,
}) => {
  const [tmdbTab, setTmdbTab] = useState(0); // 0 = Movie, 1 = TV Show

  const handleMovieSearch = () => {
    onSearch('movie', movieQuery, movieYear);
  };

  const handleTVSearch = () => {
    onSearch('tv', tvQuery, tvYear, tvSeason);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        TMDB Search
      </Typography>
      
      <Tabs value={tmdbTab} onChange={(e, newValue) => setTmdbTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Movie" icon={<Movie />} />
        <Tab label="TV Show" icon={<Tv />} />
      </Tabs>

      {/* Movie Search Tab */}
      {tmdbTab === 0 && (
        <MovieSearch
          searchQuery={movieQuery}
          setSearchQuery={setMovieQuery}
          searchYear={movieYear}
          setSearchYear={setMovieYear}
          onSearch={handleMovieSearch}
          loading={loadingTmdb}
        />
      )}

      {/* TV Show Search Tab */}
      {tmdbTab === 1 && (
        <TVSearch
          searchQuery={tvQuery}
          setSearchQuery={setTvQuery}
          searchYear={tvYear}
          setSearchYear={setTvYear}
          searchSeason={tvSeason}
          setSearchSeason={setTvSeason}
          onSearch={handleTVSearch}
          loading={loadingTmdb}
        />
      )}

      {/* Search Results */}
      <Box sx={{ mt: 2, maxHeight: '400px', overflow: 'auto' }}>
        <TMDBResults
          results={tmdbResults}
          loading={loadingTmdb}
          selectedItem={selectedTmdbItem}
          onSelectItem={onSelectItem}
          tvSearchSeason={tvSeason}
        />
      </Box>
    </Paper>
  );
};

export default TMDBSearch;
