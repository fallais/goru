// Proxy for the directory API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;
    const backendUrl = process.env.BACKEND_URL;
    
    // Build the URL with query parameters
    const url = new URL(`${backendUrl}/api/directory`);
    if (path) {
      url.searchParams.append('path', path);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying directory request:', error);
    res.status(500).json({ error: 'Failed to load directory' });
  }
}
