// Proxy for the current directory API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/current`);
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying current directory request:', error);
    res.status(500).json({ error: 'Failed to load current directory' });
  }
}
