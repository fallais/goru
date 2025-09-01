// DEPRECATED: This endpoint is deprecated. Use /api/search/movies or /api/search/tvshows instead.
// Proxy for TMDB search API
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.warn('DEPRECATED: /api/tmdb/search is deprecated. Use /api/search/movies or /api/search/tvshows instead.');
    
    let query, mediaType;
    
    if (req.method === 'GET') {
      query = req.query.query;
      mediaType = req.query.mediaType;
    } else {
      query = req.body.query;
      mediaType = req.body.mediaType;
    }
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Redirect to the new endpoints based on mediaType
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    let endpoint;
    
    if (mediaType === 'movie') {
      endpoint = '/api/search/movies';
    } else if (mediaType === 'tv') {
      endpoint = '/api/search/tvshows';
    } else {
      return res.status(400).json({ error: 'Invalid mediaType. Use "movie" or "tv"' });
    }
    
    const searchParams = new URLSearchParams({ query });
    
    const response = await fetch(`${backendUrl}${endpoint}?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying TMDB search request:', error);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
}
