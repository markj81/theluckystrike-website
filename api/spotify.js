// Vercel serverless function: GET /api/spotify
// Returns the 20 most recently played tracks from Spotify

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=20';

async function getAccessToken() {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
    });

    return res.json();
}

export default async function handler(req, res) {
    // CORS — allow same origin only
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        const { access_token } = await getAccessToken();

        const spotifyRes = await fetch(RECENTLY_PLAYED_URL, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!spotifyRes.ok) {
            return res.status(spotifyRes.status).json({ error: 'Spotify API error' });
        }

        const data = await spotifyRes.json();

        // Deduplicate by album ID and return the relevant fields
        const seen = new Set();
        const albums = [];

        for (const item of data.items) {
            const album = item.track.album;
            if (!seen.has(album.id)) {
                seen.add(album.id);
                albums.push({
                    id: album.id,
                    name: album.name,
                    artist: item.track.artists.map(a => a.name).join(', '),
                    image: album.images[0]?.url,
                    url: album.external_urls.spotify,
                });
            }
        }

        // Cache for 5 minutes at the edge
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ albums });
    } catch (err) {
        console.error('Spotify handler error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
