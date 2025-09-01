import { useState } from 'react';
import { useApiCall } from './useApiCall';
import { useNotification } from '../contexts/NotificationContext';

export const useTMDBSearch = () => {
  const apiCall = useApiCall();
  const { showError } = useNotification();
  
  const [tmdbResults, setTmdbResults] = useState([]);
  const [loadingTmdb, setLoadingTmdb] = useState(false);
  const [selectedTmdbItem, setSelectedTmdbItem] = useState(null);

  const searchTMDB = async (mediaType, query, year, season) => {
    if (!query.trim()) {
      showError('Please enter a search query');
      return;
    }

    setLoadingTmdb(true);
    
    let endpoint, params;
    
    if (mediaType === 'movie') {
      endpoint = '/api/search/movies';
      params = {
        query: query,
        ...(year && { year: year }),
      };
    } else {
      endpoint = '/api/search/tvshows';
      params = {
        query: query,
        ...(year && { year: year }),
        ...(season && { season: season }),
      };
    }

    const result = await apiCall.get(endpoint, {
      params: params,
      errorPrefix: `Failed to search ${mediaType === 'movie' ? 'movies' : 'TV shows'}`
    });
    
    if (result.success) {
      // Handle the new response structure
      if (mediaType === 'movie') {
        setTmdbResults(result.data.results || []);
      } else {
        // For TV shows, we might have both results and episodes
        const tvShowResults = result.data.results || [];
        // If episodes are present, add them to the first result for display
        if (result.data.episodes && result.data.episodes.length > 0 && tvShowResults.length > 0) {
          tvShowResults[0].episodes = result.data.episodes;
        }
        setTmdbResults(tvShowResults);
      }
    } else {
      // Clear results on failure
      setTmdbResults([]);
    }
    
    setLoadingTmdb(false);
  };

  const selectTmdbItem = (tmdbItem) => {
    setSelectedTmdbItem(tmdbItem);
  };

  const clearTmdbSelection = () => {
    setSelectedTmdbItem(null);
  };

  const clearResults = () => {
    setTmdbResults([]);
  };

  return {
    tmdbResults,
    loadingTmdb,
    selectedTmdbItem,
    searchTMDB,
    selectTmdbItem,
    clearTmdbSelection,
    clearResults,
  };
};
