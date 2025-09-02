// Proxy for TV show episodes API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId } = req.query;
    
    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    const response = await fetch(`${backendUrl}/api/tv-shows/${showId}/episodes`, {
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
    console.error('Error proxying TV show episodes request:', error);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
}
