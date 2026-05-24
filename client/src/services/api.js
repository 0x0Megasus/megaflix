import { matchTitle, parseEpisode, groupByShow, pickBiggestSeason, hasFullSeason, getCategoryIds } from './utils';

const API_BASE = (import.meta.env.VITE_API_PROXY_TARGET || '') + '/api/wp/v2/posts';
const REQUEST_CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(endpoint, params) {
  const key = `${endpoint}:${JSON.stringify(params)}`;
  return key;
}

function getFromCache(key) {
  const cached = REQUEST_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  REQUEST_CACHE.delete(key);
  return null;
}

export function setCache(key, data) {
  REQUEST_CACHE.set(key, { data, timestamp: Date.now() });
}

export function clearCache() {
  REQUEST_CACHE.clear();
}

// Clear cache on startup to purge any stale misclassified data
clearCache();

const FILTERS = {
  home: null,
  movies: '3,4',
  tv: '7,9',
  anime: '5,8'
};

export async function fetchPosts({ filter = 'home', search = '', page = 1, perPage = 50, categories = '' } = {}) {
  const cacheKey = getCacheKey('fetchPosts', { filter, search, page, perPage, categories });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('_embed', '');
  url.searchParams.set('page', String(page));

  const catIds = categories || FILTERS[filter];
  if (catIds) url.searchParams.set('categories', catIds);
  if (search) url.searchParams.set('search', search);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  setCache(cacheKey, data);
  return data;
}

export async function searchPosts(query) {
  if (!query.trim()) return [];

  const cacheKey = getCacheKey('searchPosts', { query });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const seen = new Set();
  const allMatches = [];

  try {
    const exact = await fetchPosts({ search: query, perPage: 100 }).catch(() => []);
    for (const item of Array.isArray(exact) ? exact : []) {
      if (!seen.has(item.id) && matchTitle(item, query)) {
        seen.add(item.id);
        allMatches.push(item);
      }
    }
  } catch {}

  // Only fallback if very few results
  if (allMatches.length < 5) {
    try {
      const results = await fetchPosts({ perPage: 100, page: 1 }).catch(() => []);
      for (const item of Array.isArray(results) ? results : []) {
        if (!seen.has(item.id) && matchTitle(item, query)) {
          seen.add(item.id);
          allMatches.push(item);
        }
      }
    } catch {}
  }

  setCache(cacheKey, allMatches);
  return allMatches;
}

export async function fetchImdbTop(type) {
  const res = await fetch((import.meta.env.VITE_API_PROXY_TARGET || '') + `/api/imdb-top/${type}`);
  if (!res.ok) throw new Error(`IMDB API error ${res.status}`);
  return res.json();
}

function exactMatchTitle(item, query) {
  const title = item.title?.rendered || ''
  return title.toLowerCase().includes(query.toLowerCase().trim())
}

export async function fetchShowEpisodes(showName, categoryIds) {
  const cacheKey = getCacheKey('fetchShowEpisodes', { showName, categoryIds });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const showLower = showName.toLowerCase().trim();
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('_embed', '');
  url.searchParams.set('page', '1');
  url.searchParams.set('search', showName);
  if (categoryIds) url.searchParams.set('categories', categoryIds);

  let firstPageData = [];
  let totalPages = 1;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
    firstPageData = await res.json();
  } catch (err) {
    console.error('Failed to fetch first page of episodes:', err);
    return [];
  }

  const allPosts = [...firstPageData];
  const seen = new Set(allPosts.map(p => p.id));

  if (totalPages > 1) {
    const remainingPages = Array.from({ length: Math.min(totalPages - 1, 7) }, (_, i) => i + 2);
    const results = await Promise.allSettled(remainingPages.map(async (page) => {
      try {
        const pageUrl = new URL(url.toString());
        pageUrl.searchParams.set('page', String(page));
        const res = await fetch(pageUrl);
        if (!res.ok) return []; // Silently ignore individual page errors
        return res.json();
      } catch {
        return []; // Silently ignore fetch failures
      }
    }));

    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        res.value.forEach(post => {
          if (!seen.has(post.id)) {
            allPosts.push(post);
            seen.add(post.id);
          }
        });
      }
    }
  }

  const matchedPosts = allPosts.filter(post => {
    const title = (post.title?.rendered || '').toLowerCase().trim();
    const { name: parsedName } = parseEpisode(post.title?.rendered || '')
    
    const normParsed = (parsedName || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
    const normTarget = showLower.replace(/[^a-z0-9\s]/g, '')

    return (parsedName && parsedName.toLowerCase().trim() === showLower) ||
           (normParsed === normTarget) ||
           (title.includes(showLower)) ||
           (showLower.includes(normParsed && normParsed.length > 3 ? normParsed : '____NOT_MATCH____'));
  });

  setCache(cacheKey, matchedPosts);
  return matchedPosts;
}

const MISSING_MATCHES = new Set();

export async function fetchBestContent(type, limit = 10, validation = true) {
  const list = await fetchImdbTop(type);
  if (!Array.isArray(list)) return [];

  const catFilter = type === 'movies' ? 'movies' : type === 'tv' ? 'tv' : 'anime';
  const catIds = FILTERS[catFilter] || '';

  // AGGRESSIVE BLACKLIST for Anime fetch: titles that are definitely NOT anime
  let skipTitles = new Set();
  if (type === 'anime') {
    const NOT_ANIME = [
      'breaking bad', 'the wire', 'the sopranos', 'game of thrones', 'chernobyl', 
      'sherlock', 'better call saul', 'the office', 'friends', 'black mirror',
      'succession', 'the mandalorian', 'the crown', 'stranger things', 'ted lasso'
    ];
    NOT_ANIME.forEach(t => skipTitles.add(t));
  }
  
  if (type === 'tv') {
    const animePosts = await fetchPosts({ filter: 'anime', perPage: 100 }).catch(() => []);
    if (Array.isArray(animePosts)) {
      for (const item of list) {
        const t = (item["Movie Name"] || item["Show Name"] || "").toLowerCase();
        if (!t) continue;
        for (const post of animePosts) {
          if (exactMatchTitle(post, t)) { skipTitles.add(t); break; }
        }
      }
    }
  }

  const matched = [];
  const seen = new Set();

  // Optimized: Increase batch size to 40 for ultra-fast parallel lookups
  for (let i = 0; i < list.length && matched.length < limit; i += 40) {
    const batch = list.slice(i, i + 40);
    const results = await Promise.all(batch.map(async (item) => {
      const title = item["Movie Name"] || item["Show Name"];
      const rating = parseFloat(item["IMDb Rating"]);
      if (!title || isNaN(rating) || skipTitles.has(title.toLowerCase())) return null;

      // Skip if we already searched and failed to find this title on our site recently
      if (MISSING_MATCHES.has(`${catFilter}:${title.toLowerCase()}`)) return null;

      const posts = await fetchPosts({ search: title, perPage: 50, categories: catIds }).catch(() => []);
      if (!Array.isArray(posts) || posts.length === 0) {
        MISSING_MATCHES.add(`${catFilter}:${title.toLowerCase()}`);
        return null;
      }

      const match = posts.find(p => {
        const { name } = parseEpisode(p.title?.rendered || '');
        const clean = name ? name.replace(/\b\d{4}\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase() : '';
        const normalizedTitle = title.toLowerCase().trim();
        
        // ABSOLUTE POSITIVE CHECK: Must have the correct categories for the type
        const pCats = getCategoryIds(p)
        const isAnimePost = pCats.some(id => [5, 8].includes(id))
        const isTVPost = pCats.some(id => [7, 9].includes(id))
        
        if (type === 'tv' && !isTVPost) return false;
        if (type === 'anime' && !isAnimePost) return false;
        // Special case: Breaking Bad should NOT be anime
        if (type === 'anime' && title.toLowerCase().includes('breaking bad')) return false;

        if (clean && clean === normalizedTitle) return true;
        return matchTitle(p, title);
      });
      if (!match) return null;

      return { post: match, rating, title };
    }));

    for (const r of results) {
      if (!r || seen.has(r.post.id)) continue;
      seen.add(r.post.id);

      if (catIds && type !== 'movies' && validation) {
        const episodes = await fetchShowEpisodes(r.title, catIds).catch(() => []);
        if (episodes.length > 0) {
          const groups = groupByShow(episodes)
          const fullGroups = groups.filter(hasFullSeason)
          const bestGroup = fullGroups.reduce((current, next) => {
            if (!current) return next
            return (next.posts.length || 0) > (current.posts.length || 0) ? next : current
          }, fullGroups[0])

          if (bestGroup) {
            const season = pickBiggestSeason(bestGroup)
            const representative = season.representative || bestGroup.representative || bestGroup.posts[0]
            if (representative) {
              matched.push({
                ...representative,
                imdbRating: r.rating,
                imdbTitle: r.title,
                seasonNum: season.seasonNum,
                episodeCount: season.episodeCount,
                totalEpisodeCount: season.totalEpisodeCount,
              })
              if (matched.length >= limit) break;
              continue
            }
          }
        }
        continue
      } else {
        matched.push({ ...r.post, imdbRating: r.rating, imdbTitle: r.title });
      }
      if (matched.length >= limit) break;
    }
  }

  return matched.sort((a, b) => b.imdbRating - a.imdbRating);
}

export async function fetchTopRatedContent(type, filter, search = '') {
  return fetchBestContent(type);
}

export async function fetchContent(filter, search = '', page = 1, categories = '') {
  const [page1, page2] = await Promise.all([
    fetchPosts({ filter, search, page, categories, perPage: 50 }),
    search ? Promise.resolve([]) : fetchPosts({ filter, search, page: page + 1, categories, perPage: 50 }),
  ]);
  const items = [...(Array.isArray(page1) ? page1 : []), ...(Array.isArray(page2) ? page2 : [])];

  if (!search) return items;

  const matched = items.filter(item => matchTitle(item, search));
  if (matched.length >= 5) return matched;

  const seen = new Set(items.map(i => i.id));
  const all = await fetchPosts({ filter, page: 1, categories, perPage: 100 });
  if (Array.isArray(all)) {
    all.forEach(item => {
      if (!seen.has(item.id) && matchTitle(item, search)) {
        seen.add(item.id);
        items.push(item);
      }
    });
  }

  return items.filter(item => matchTitle(item, search));
}


