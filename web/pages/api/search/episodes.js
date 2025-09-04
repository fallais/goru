// Proxy for episode search API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tvshow_id, season } = req.query;
    
    if (!tvshow_id) {
      return res.status(400).json({ error: 'tvshow_id parameter is required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    // Build query string
    const queryParams = new URLSearchParams({ tvshow_id });
    if (season) {
      queryParams.append('season', season);
    }
    
    const response = await fetch(`${backendUrl}/api/episodes?${queryParams}`, {
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
    console.error('Error proxying episode search request:', error);
    res.status(500).json({ error: 'Failed to search episodes' });
  }
}
