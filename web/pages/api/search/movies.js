// Proxy for movie search API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, year } = req.query;
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    // Build URL with query parameters
    const searchParams = new URLSearchParams({ query });
    if (year) {
      searchParams.append('year', year.toString());
    }
    
    const response = await fetch(`${backendUrl}/api/search/movies?${searchParams}`, {
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
    console.error('Error proxying movie search request:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
}
