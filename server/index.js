import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const WP_BASE = process.env.WP_API_BASE;
const WP_ORIGIN = process.env.WP_ORIGIN;

app.use(cors({
  exposedHeaders: ['X-WP-Total', 'X-WP-TotalPages']
}));

const IMDB_TOP_URLS = {
  movies: process.env.IMDB_MOVIES_URL,
  tv: process.env.IMDB_TV_URL,
  anime: process.env.IMDB_ANIME_URL,
};

app.get('/api/imdb-top/:type', async (req, res) => {
  const url = IMDB_TOP_URLS[req.params.type];
  if (!url) return res.status(400).json({ error: 'Invalid type' });
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`IMDB API error ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'IMDB proxy error', message: err.message });
  }
});

app.use('/api/wp/v2/posts', async (req, res) => {
  try {
    // Normalize URL to avoid double slashes
    const queryPart = req.url.startsWith('/') ? req.url : '/' + req.url;
    const url = new URL(WP_BASE + '/posts' + queryPart);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MegaFlix/2.0',
        'Origin': WP_ORIGIN,
        'Referer': WP_ORIGIN + '/'
      }
    });

    // Forward pagination headers
    const total = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');
    if (total) res.set('X-WP-Total', total);
    if (totalPages) res.set('X-WP-TotalPages', totalPages);

    if (!response.ok) {
      return res.status(response.status).json({ error: `API error ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`◉ MegaFlix server running on http://localhost:${PORT}`);
});
