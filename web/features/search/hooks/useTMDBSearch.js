import { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { searchMovies, searchTVShows } from '@/lib/api';

export const useTMDBSearch = () => {
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
    
    try {
      let apiResponse;
      
      if (mediaType === 'movie') {
        apiResponse = await searchMovies(query, year);
      } else {
        apiResponse = await searchTVShows(query, year);
      }

      console.log('API Response:', apiResponse); // Debug log
      
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
    } catch (error) {
      console.error('API call failed:', error);
      showError(`Failed to search ${mediaType === 'movie' ? 'movies' : 'TV shows'}`);
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
