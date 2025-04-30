export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = 'https://api.openrouteservice.org/v2/directions/cycling-regular/geojson';
  const apiKey = process.env.ORS_API_KEY; // Set this in Vercel's environment variables

  try {
    const orsRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await orsRes.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(orsRes.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
} 