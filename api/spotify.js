// Vercel serverless function: GET /api/spotify
// Returns the 20 most recently played tracks from Spotify

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=20';

// In-memory token cache
let tokenCache = {
    access_token: null,
    expiresAt: 0
};

async function getAccessToken() {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

    // Validate required environment variables
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
        throw new Error('Missing required Spotify environment variables');
    }

    // Check if we have a valid cached token
    const now = Date.now();
    if (tokenCache.access_token && tokenCache.expiresAt > now) {
        return { access_token: tokenCache.access_token };
    }

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

    const data = await res.json();

    // Cache the token with buffer time (expires in 1 hour, cache for 50 minutes)
    if (data.access_token) {
        tokenCache.access_token = data.access_token;
        tokenCache.expiresAt = Date.now() + (50 * 60 * 1000);
    }

    return data;
}

export default async function handler(req, res) {
    // CORS — use specific origin from env or same origin only
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
    const origin = req.headers.origin || '';

    // If ALLOWED_ORIGIN is set, only allow that origin; otherwise allow same origin
    if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    } else if (origin) {
        // Allow same-origin requests
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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
        const message = err.message.includes('Missing required') ? 'Configuration error' : 'Internal server error';
        return res.status(500).json({ error: message });
    }
}
