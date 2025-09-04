// Proxy for TV show episodes API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    // Use the new endpoint for getting TV show episodes
    const response = await fetch(`${backendUrl}/api/tvshows/${id}/episodes`, {
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
