// Proxy for the state revert API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/state/revert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Forward the exact status and error from backend
      return res.status(response.status).json(data);
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error proxying state revert request:', error);
    res.status(500).json({ error: 'Failed to revert state' });
  }
}
