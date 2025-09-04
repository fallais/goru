// Unified search API that handles both movies and TV shows
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, type = 'all', year } = req.query;
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    let results = [];

    // Handle different search types
    switch (type) {
      case 'movies':
        results = await searchMovies(backendUrl, query, year);
        break;
      case 'tv':
        results = await searchTVShows(backendUrl, query, year);
        break;
      case 'all':
      default:
        // Search both movies and TV shows
        const [movieResults, tvResults] = await Promise.allSettled([
          searchMovies(backendUrl, query, year),
          searchTVShows(backendUrl, query, year)
        ]);
        
        results = [
          ...(movieResults.status === 'fulfilled' ? movieResults.value : []),
          ...(tvResults.status === 'fulfilled' ? tvResults.value : [])
        ];
        break;
    }

    res.status(200).json({ results, total: results.length });
  } catch (error) {
    console.error('Error in unified search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
}

async function searchMovies(backendUrl, query, year) {
  try {
    const searchParams = new URLSearchParams({ query });
    if (year) {
      searchParams.append('year', year.toString());
    }
    
    const response = await fetch(`${backendUrl}/api/movies?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Movies search failed with ${response.status}`);
    }
    
    const data = await response.json();
    // Add type identifier to results - data.movies contains the movie array
    return (data.movies || []).map(item => ({
      ...item,
      type: 'movie'
    }));
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

async function searchTVShows(backendUrl, query, year) {
  try {
    const searchParams = new URLSearchParams({ query });
    if (year) {
      searchParams.append('year', year.toString());
    }
    
    const url = `${backendUrl}/api/tvshows?${searchParams}`;
    console.log('Calling TV shows API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('TV shows API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`TV shows search failed with ${response.status}`);
    }
    
    const data = await response.json();
    console.log('TV shows API response data:', data);
    // Add type identifier to results - data.tvshows contains the TV show array
    return (data.tvshows || []).map(item => ({
      ...item,
      type: 'tv'
    }));
  } catch (error) {
    console.error('Error searching TV shows:', error);
    return [];
  }
}
