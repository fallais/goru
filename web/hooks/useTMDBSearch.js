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
    
    console.log('API Response:', result); // Debug log
    
    if (result.success) {
      // result.data now contains the actual API response: { results: [...], status: "success" }
      const apiResponse = result.data;
      console.log('API Response data:', apiResponse); // Debug log
      
      if (apiResponse && apiResponse.results) {
        if (mediaType === 'movie') {
          setTmdbResults(apiResponse.results);
        } else {
          // For TV shows
          const tvShowResults = apiResponse.results;
          console.log('TV Show results:', tvShowResults); // Debug log
          // If episodes are present, add them to the first result for display
          if (apiResponse.episodes && apiResponse.episodes.length > 0 && tvShowResults.length > 0) {
            tvShowResults[0].episodes = apiResponse.episodes;
          }
          setTmdbResults(tvShowResults);
        }
      } else {
        console.warn('Unexpected API response structure:', apiResponse);
        setTmdbResults([]);
      }
    } else {
      console.error('API call failed:', result.error);
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
