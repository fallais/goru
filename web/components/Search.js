import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  TextField,
  Button,
  Grid2,
  Typography,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Movie,
  Tv,
  Clear,
} from '@mui/icons-material';
import SearchResultCard from './search/SearchResultCard';
import SearchFilters from './search/SearchFilters';
import { searchMovies, searchTVShows } from '../lib/api';

export default function Search({ searchType = 'all' }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 12;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      let results = [];
      
      // Use the new API functions instead of fetch
      if (searchType === 'movies' || searchType === 'movie') {
        const data = await searchMovies(searchQuery);
        results = data.movies || data.results || [];
      } else if (searchType === 'tv' || searchType === 'tvshows') {
        const data = await searchTVShows(searchQuery);
        results = data.tvshows || data.results || [];
      } else {
        // For 'all' type, search movies (could be enhanced to search both)
        const data = await searchMovies(searchQuery);
        results = data.movies || data.results || [];
      }
      
      setSearchResults(results);
      setFilteredResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.message || 'Search failed');
      setSearchResults([]);
      setFilteredResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    let filtered = [...searchResults];
    
    // Apply filters
    if (newFilters.year) {
      filtered = filtered.filter(item => {
        const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                    item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                    item.year;
        return year === parseInt(newFilters.year);
      });
    }
    
    if (newFilters.rating) {
      filtered = filtered.filter(item => 
        item.vote_average >= parseFloat(newFilters.rating)
      );
    }
    
    // Apply sorting
    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') {
      filtered.sort((a, b) => {
        switch (newFilters.sortBy) {
          case 'popularity':
            return (b.popularity || 0) - (a.popularity || 0);
          case 'rating':
            return (b.vote_average || 0) - (a.vote_average || 0);
          case 'release_date':
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateB - dateA;
          case 'title':
            const titleA = (a.title || a.name || '').toLowerCase();
            const titleB = (b.title || b.name || '').toLowerCase();
            return titleA.localeCompare(titleB);
          default:
            return 0;
        }
      });
    }
    
    setFilteredResults(filtered);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setFilteredResults([]);
    setError(null);
    setCurrentPage(1);
  };

  const handleViewDetails = (item) => {
    // TODO: Implement view details functionality
    console.log('View details for:', item);
  };

  const handleDownload = (item) => {
    // TODO: Implement download functionality
    console.log('Download:', item);
  };

  const handleViewEpisodes = (tvShow) => {
    // Navigate to TV show episodes page
    router.push({
      pathname: '/tv-show-episodes',
      query: {
        showId: tvShow.id,
        showTitle: tvShow.title || tvShow.name || 'TV Show'
      }
    });
  };

  const getSearchTypeLabel = () => {
    switch (searchType) {
      case 'tv':
        return 'TV Shows';
      case 'movies':
        return 'Movies';
      default:
        return 'All Content';
    }
  };

  const getSearchTypeIcon = () => {
    switch (searchType) {
      case 'tv':
        return <Tv />;
      case 'movies':
        return <Movie />;
      default:
        return <SearchIcon />;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = filteredResults.slice(startIndex, endIndex);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Search Header */}
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={getSearchTypeIcon()}
          label={`Searching: ${getSearchTypeLabel()}`}
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Search for ${getSearchTypeLabel().toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Button
                  onClick={clearSearch}
                  size="small"
                  startIcon={<Clear />}
                >
                  Clear
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!searchQuery.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
          sx={{ mr: 2 }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Box>

      {/* Advanced Filters */}
      {searchResults.length > 0 && (
        <SearchFilters 
          searchType={searchType} 
          onFiltersChange={handleFiltersChange} 
        />
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Summary */}
      {filteredResults.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Search Results ({filteredResults.length})
          </Typography>
          <Divider />
        </Box>
      )}

      {/* Search Results */}
      {currentResults.length > 0 && (
        <Box>
          <Grid2 container spacing={2}>
            {currentResults.map((result, index) => (
              <Grid2 xs={12} sm={6} md={4} lg={3} key={startIndex + index}>
                <SearchResultCard
                  result={result}
                  onView={handleViewDetails}
                  onDownload={handleDownload}
                  onViewEpisodes={handleViewEpisodes}
                />
              </Grid2>
            ))}
          </Grid2>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      )}

      {/* No Results */}
      {searchQuery && !loading && filteredResults.length === 0 && !error && searchResults.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No results match your current filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search filters or search terms.
          </Typography>
        </Box>
      )}

      {/* No Search Results */}
      {searchQuery && !loading && searchResults.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No results found for "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search terms or search in a different category.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
