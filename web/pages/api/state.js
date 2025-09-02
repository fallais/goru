// Proxy for the state API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL;
    const url = new URL(`${backendUrl}/api/state`);
    
    // Forward query parameters
    if (req.query.active) {
      url.searchParams.append('active', req.query.active);
    }
    if (req.query.limit) {
      url.searchParams.append('limit', req.query.limit);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying state request:', error);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
}
