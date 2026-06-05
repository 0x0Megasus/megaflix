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

// ── Allowed origins for URL validation ──
const ALLOWED_IMDB_ORIGINS = [
  'https://imdb-api.com',
  'https://api.imdb.com',
  'https://imdb226.p.rapidapi.com',
  'https://tv-api.com',
  'https://imdb-top-100-movies.p.rapidapi.com',
];

const IMDB_TOP_URLS = {
  movies: process.env.IMDB_MOVIES_URL,
  tv: process.env.IMDB_TV_URL,
  anime: process.env.IMDB_ANIME_URL,
};

// ── In-memory IMDB cache (1-hour TTL) ──
const IMDB_CACHE = new Map();
const IMDB_CACHE_TTL = 60 * 60 * 1000;

function getImdbCache(type) {
  const entry = IMDB_CACHE.get(type);
  if (entry && Date.now() - entry.timestamp < IMDB_CACHE_TTL) return entry.data;
  IMDB_CACHE.delete(type);
  return null;
}

function setImdbCache(type, data) {
  IMDB_CACHE.set(type, { data, timestamp: Date.now() });
}

// ── Best-content cache (30-min TTL) ──
const BEST_CONTENT_CACHE = new Map();
const BEST_CONTENT_CACHE_TTL = 30 * 60 * 1000;

function getBestContentCache(type) {
  const entry = BEST_CONTENT_CACHE.get(type);
  if (entry && Date.now() - entry.timestamp < BEST_CONTENT_CACHE_TTL) return entry.data;
  BEST_CONTENT_CACHE.delete(type);
  return null;
}

function setBestContentCache(type, data) {
  BEST_CONTENT_CACHE.set(type, { data, timestamp: Date.now() });
}

function isValidImdbUrl(url) {
  try {
    const u = new URL(url);
    return ALLOWED_IMDB_ORIGINS.some(origin => url.startsWith(origin));
  } catch {
    return false;
  }
}

// ── Server-side helper: decode HTML entities ──
function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

// ── Server-side category validation ──
const CAT_ANIME = new Set([5, 8]);
const CAT_TV = new Set([7, 9]);
const CAT_MOVIE = new Set([3, 4]);
const CONFLICT_MAP = {
  anime: CAT_TV,
  tv: CAT_ANIME,
  movies: CAT_TV,
};

function getPostCats(post) {
  const cats = new Set();
  if (Array.isArray(post.categories)) post.categories.forEach(c => cats.add(Number(c)));
  const terms = post._embedded?.['wp:term'];
  if (terms) terms.forEach(group => { if (Array.isArray(group)) group.forEach(t => { if (t?.id) cats.add(Number(t.id)); }); });
  return cats;
}

function hasConflictCats(post, type) {
  const conflict = CONFLICT_MAP[type];
  if (!conflict) return false;
  const cats = getPostCats(post);
  return [...conflict].some(c => cats.has(c));
}

// ── Server-side title matching (simplified, covers 90%+ of cases) ──
function matchTitleServer(renderedTitle, query) {
  const title = decodeHtml(renderedTitle || '').toLowerCase();
  const q = query.toLowerCase().trim();
  if (title.includes(q)) return true;

  const tNorm = title.replace(/[^a-z0-9\s]/g, '').trim();
  const qNorm = q.replace(/[^a-z0-9\s]/g, '').trim();
  if (tNorm.includes(qNorm)) return true;

  const tTokens = tNorm.split(/\s+/).filter(Boolean);
  const qTokens = qNorm.split(/\s+/).filter(Boolean);
  const matchingTokens = qTokens.filter(qt =>
    tTokens.some(tt => (tt.includes(qt) || qt.includes(tt)) && qt.length >= 3)
  );
  if (matchingTokens.length === 0) return false;
  if (qTokens.length === 1) return true;
  return matchingTokens.length >= 2;
}

// ── IMDB proxy (with URL validation + caching) ──
app.get('/api/imdb-top/:type', async (req, res) => {
  const url = IMDB_TOP_URLS[req.params.type];
  if (!url) return res.status(400).json({ error: 'Invalid type' });
  if (!isValidImdbUrl(url)) return res.status(403).json({ error: 'Blocked URL origin' });

  const cached = getImdbCache(req.params.type);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`IMDB API error ${response.status}`);
    const data = await response.json();
    setImdbCache(req.params.type, data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'IMDB proxy error', message: err.message });
  }
});

// ── Best-content endpoint (server-side IMDB cross-reference) ──
const FILTERS_SERVER = { movies: '3,4', tv: '7,9', anime: '5,8' };

app.get('/api/best-content/:type', async (req, res) => {
  const { type } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);
  const url = IMDB_TOP_URLS[type];
  if (!url) return res.status(400).json({ error: 'Invalid type' });

  const cached = getBestContentCache(type);
  if (cached) return res.json(cached);

  const catIds = FILTERS_SERVER[type] || '';

  const execute = async () => {
    const imdbRes = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!imdbRes.ok) throw new Error(`IMDB API error ${imdbRes.status}`);
    const list = await imdbRes.json();
    if (!Array.isArray(list)) return [];

    const matched = [];
    const seen = new Set();
    const failedSearches = new Set();
    const headers = { 'Accept': 'application/json', 'User-Agent': 'MegaFlix/2.0', 'Origin': WP_ORIGIN, 'Referer': WP_ORIGIN + '/' };

    for (let i = 0; i < list.length && matched.length < limit; i += 10) {
      const batch = list.slice(i, i + 10);
      const results = await Promise.allSettled(batch.map(async (item) => {
        const title = item.name || item["Movie Name"] || item["Show Name"];
        const rating = parseFloat(item["IMDb Rating"]);
        if (!title || isNaN(rating)) return null;

        const cacheKey = `${catIds}:${title.toLowerCase()}`;
        if (failedSearches.has(cacheKey)) return null;

        const su = new URL(WP_BASE + '/posts');
        su.searchParams.set('per_page', '50');
        su.searchParams.set('_embed', 'wp:featuredmedia,wp:term');
        su.searchParams.set('search', title);
        if (catIds) su.searchParams.set('categories', catIds);

        try {
          const wr = await fetch(su.toString(), { headers, signal: AbortSignal.timeout(10000) });
          if (!wr.ok) return null;
          const posts = await wr.json();
          if (!Array.isArray(posts) || posts.length === 0) { failedSearches.add(cacheKey); return null; }
          const match = posts.find(p => matchTitleServer(p.title?.rendered || '', title) && !hasConflictCats(p, type));
          if (!match) { failedSearches.add(cacheKey); return null; }
          return { post: match, rating, title };
        } catch { return null; }
      }));

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        const r = result.value;
        if (seen.has(r.post.id)) continue;
        seen.add(r.post.id);

        matched.push({ ...r.post, imdbRating: r.rating, imdbTitle: r.title });
        if (matched.length >= limit) break;
      }
    }

    const sorted = matched.sort((a, b) => b.imdbRating - a.imdbRating);
    setBestContentCache(type, sorted);
    return sorted;
  };

  try {
    const result = await Promise.race([
      execute(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 8000))
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Best content error', message: err.message });
  }
});

// ── WP Posts proxy ──
app.use('/api/wp/v2/posts', async (req, res) => {
  try {
    const queryPart = req.url.startsWith('/') ? req.url : '/' + req.url;
    const url = new URL(WP_BASE + '/posts' + queryPart);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MegaFlix/2.0',
        'Origin': WP_ORIGIN,
        'Referer': WP_ORIGIN + '/'
      },
      signal: AbortSignal.timeout(20000)
    });

    const total = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');
    if (total) res.set('X-WP-Total', total);
    if (totalPages) res.set('X-WP-TotalPages', totalPages);

    if (!response.ok) return res.status(response.status).json({ error: `API error ${response.status}` });
    const data = await response.json();
    const seen = new Set();
    const deduped = Array.isArray(data) ? data.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }) : data;
    res.json(deduped);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// ── Pre-warm IMDB cache on startup ──
async function preWarmImdb() {
  for (const type of ['movies', 'tv', 'anime']) {
    try {
      const url = IMDB_TOP_URLS[type];
      if (!url || !isValidImdbUrl(url)) continue;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const data = await response.json();
        setImdbCache(type, data);
        console.log(`✓ Pre-warmed IMDB ${type} cache (${Array.isArray(data) ? data.length : '?'} items)`);
      }
    } catch (err) {
      console.error(`✗ Pre-warm IMDB ${type} failed: ${err.message}`);
    }
  }
}

app.listen(PORT, () => {
  console.log(`◉ MegaFlix server running on http://localhost:${PORT}`);
  preWarmImdb();
});
