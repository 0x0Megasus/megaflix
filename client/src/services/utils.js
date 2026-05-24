export function getFeaturedImage(item) {
  const media = item._embedded?.['wp:featuredmedia'];
  if (!media?.length) return '';
  const sizes = media[0]?.media_details?.sizes;
  return sizes?.full?.source_url
    || sizes?.large?.source_url
    || sizes?.medium_large?.source_url
    || sizes?.medium?.source_url
    || media[0]?.source_url
    || '';
}

export function getCategoryIds(item) {
  if (!item) return [];
  const ids = new Set();
  
  // 1. Check top-level categories array (standard WP REST API)
  if (Array.isArray(item.categories)) {
    item.categories.forEach(id => ids.add(Number(id)));
  }

  // 2. Check embedded terms
  const terms = item._embedded?.['wp:term'];
  if (terms) {
    terms.forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(term => {
          if (term?.id) ids.add(Number(term.id));
        });
      }
    });
  }

  return Array.from(ids);
}

export function detectType(item) {
  const cats = getCategoryIds(item);
  const isAnimeCat = cats.some(c => [5, 8].includes(c));
  const isTVCat = cats.some(c => [7, 9].includes(c));
  const isMovieCat = cats.some(c => [3, 4].includes(c));

  const title = (item.title?.rendered || '').toLowerCase();
  const hasAnimeKeyword = /انمي|anime|otaku/i.test(title);
  const hasTVKeyword = /مسلسل|series|season|الموسم|الحلقة|episode/i.test(title);
  const hasMovieKeyword = /فيلم|movie/i.test(title);

  // If it's anime, determine if it's a movie or series
  if (isAnimeCat) {
    // If it has movie categories or explicitly says "movie" and NOT "series/episode"
    if (isMovieCat || (hasMovieKeyword && !hasTVKeyword)) return 'Anime Movie';
    return 'Anime';
  }

  // PRIORITY 1: Explicit Category IDs
  if (isTVCat && !isAnimeCat) return 'TV Show';
  if (isTVCat) return 'TV Show';
  if (isMovieCat) return 'Movie';

  // PRIORITY 2: Strong Keywords
  if (hasAnimeKeyword) {
    if (hasMovieKeyword && !hasTVKeyword) return 'Anime Movie';
    return 'Anime';
  }
  if (hasTVKeyword) return 'TV Show';

  // PRIORITY 3: Fallback based on typical patterns
  return /season|episode|الموسم|الحلقة/i.test(title) ? 'TV Show' : 'Movie';
}

export function detectSeason(title) {
  const m = title.match(/season\s*(\d+)/i) || title.match(/الموسم\s*(\d+)/i);
  return m ? `S${m[1]}` : '';
}

export function extractQuality(title) {
  const m = title.match(/(\d+p)\s*(WEB-DL|BluRay|WEBRip|HDRip|DVD|BRRip|HDTV|WEB|CAM|TS|TC)/i)
    || title.match(/(WEB-DL|BluRay|WEBRip|HDRip|DVD|BRRip|HDTV|WEB|CAM|TS|TC)/i)
    || title.match(/(\d+p)/i);
  return m ? m[0] : '';
}

export function cleanExcerpt(item) {
  const html = item.excerpt?.rendered || item.content?.rendered || '';
  if (!html) return 'No description available';
  const d = document.createElement('div');
  d.innerHTML = html;
  const text = (d.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'No description available';
  return text.length > 200 ? text.slice(0, 200) + '…' : text;
}

export function parseEpisode(title) {
  if (!title) return { name: '', season: 0, episode: 0 }

  let t = title.trim()

  const ARABIC_ORDINALS = {
    'الأول': 1, 'الاول': 1,
    'الثاني': 2, 'التاني': 2,
    'الثالث': 3, 'التالت': 3,
    'الرابع': 4,
    'الخامس': 5,
    'السادس': 6,
    'السابع': 7,
    'الثامن': 8,
    'التاسع': 9,
    'العاشر': 10,
  }

  const ordinalPattern = Object.keys(ARABIC_ORDINALS).join('|')

  // 1. Strip content type prefix
  t = t.replace(/^(مسلسل|انمي|series|anime|فيلم|movie)\s+/i, '').trim()

  // 2. Strip quality tags
  t = t.replace(/\d{3,4}p(?:\s*(?:WEB-DL|BluRay|WEBRip|HDRip|DVD|BRRip|HDTV|WEB|CAM|TS|TC))?/gi, '').trim()
  t = t.replace(/(?:WEB-DL|BluRay|WEBRip|HDRip|DVD|BRRip|HDTV|WEB|CAM|TS|TC)\s*\d*p?/gi, '').trim()

  // 3. Strip Arabic suffixes
  t = t.replace(/\s*مترجم\s*اون\s*لاين\s*/gi, ' ').trim()
  t = t.replace(/\s*مترجمة\s*/gi, ' ').trim()
  t = t.replace(/\s*مترجم\s+$/gi, ' ').trim()
  t = t.replace(/\s*والاخيرة\s*/gi, ' ').trim()
  t = t.replace(/\s{2,}/g, ' ').trim()

  let season = 0
  let episode = 0

  // English SxxExx pattern
  const sxeMatch = t.match(/S(\d+)\s*E(\d+)/i)
  if (sxeMatch) {
    season = parseInt(sxeMatch[1])
    episode = parseInt(sxeMatch[2])
    const sxeIndex = t.search(/S\d+\s*E\d+/i)
    return { name: t.slice(0, sxeIndex).trim(), season, episode }
  }

  // English AxB pattern
  const axbMatch = t.match(/(\d+)\s*x\s*(\d+)/i)
  if (axbMatch) {
    season = parseInt(axbMatch[1])
    episode = parseInt(axbMatch[2])
    const axbIndex = t.search(/\d+\s*x\s*\d+/i)
    return { name: t.slice(0, axbIndex).trim(), season, episode }
  }

  // Arabic: locate first structural marker for name extraction
  let markerIndex = t.length

  const seasonMatch = t.match(new RegExp(`الموسم\\s+(${ordinalPattern})`, 'i'))
  if (seasonMatch) {
    season = ARABIC_ORDINALS[seasonMatch[1]]
    if (seasonMatch.index < markerIndex) markerIndex = seasonMatch.index
  } else {
    const seasonDigit = t.match(/الموسم\s*(\d+)/i)
    if (seasonDigit) {
      season = parseInt(seasonDigit[1])
      if (seasonDigit.index < markerIndex) markerIndex = seasonDigit.index
    }
  }

  const episodeMatch = t.match(/الحلقة\s*(\d+)/i)
  if (episodeMatch) {
    episode = parseInt(episodeMatch[1])
    if (episodeMatch.index < markerIndex) markerIndex = episodeMatch.index
  }

  const name = t.slice(0, markerIndex).trim()

  return { name, season, episode }
}

export function getCleanTitle(item) {
  const raw = item.title?.rendered || ''
  if (!raw) return 'Untitled'
  const { name } = parseEpisode(raw)
  if (!name) return 'Untitled'
  let clean = name
    .replace(/\d{3,4}p(?:\s*(?:WEB-DL|BluRay|WEBRip|HDRip|DVD|BRRip|HDTV|WEB|CAM|TS|TC))?/gi, '')
    .replace(/(?:WEB-DL|BluRay|WEBRip|HDRip|DVD|BRRip|HDTV|WEB|CAM|TS|TC)\s*\d*p?/gi, '')
    .replace(/\b\d{4}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean || name
}

function stripSubtitle(name) {
  return name.replace(/\s*[:|\u2013\u2014\-–—|]\s*.*$/, '').trim()
}

function showKey(name) {
  return name.toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function groupByShow(posts) {
  const map = {}
  const baseMap = {}
  const seen = new Set()

  posts.forEach(post => {
    if (seen.has(post.id)) return
    seen.add(post.id)

    const { name, season, episode } = parseEpisode(post.title?.rendered || '')
    if (!name) return
    const key = showKey(name)
    const base = showKey(stripSubtitle(name))

    let groupKey = key
    if (!map[key] && baseMap[base]) {
      groupKey = baseMap[base]
    }

    if (!map[groupKey]) {
      map[groupKey] = { displayName: name, posts: [], seasons: {}, hasRealSeasons: false }
      baseMap[base] = groupKey
    }

    const group = map[groupKey]
    if (name.length > group.displayName.length) {
      group.displayName = name
    }
    group.posts.push(post)

    const s = season || 1
    if (!group.seasons[s]) group.seasons[s] = []
    group.seasons[s].push({ ...post, season: s, episode })
    if (season > 0) group.hasRealSeasons = true
  })

  return Object.values(map)
}

export function pickBiggestSeason(group) {
  const seasons = Object.entries(group.seasons)
  if (!seasons.length) return { seasonNum: 0, episodeCount: 0, posts: [], representative: null, totalEpisodeCount: 0 }

  const completeSeasons = seasons.filter(([, posts]) => posts.length > 1)
  const candidateSeasons = completeSeasons.length > 0 ? completeSeasons : seasons

  let best = { seasonNum: 0, episodeCount: 0, posts: [], representative: null }
  for (const [s, posts] of candidateSeasons) {
    const sn = parseInt(s)
    if (posts.length > best.episodeCount || (posts.length === best.episodeCount && sn > best.seasonNum)) {
      const sorted = [...posts].sort((a, b) => (b.episode || 0) - (a.episode || 0))
      best = { seasonNum: sn, episodeCount: posts.length, posts, representative: sorted[0] }
    }
  }

  if (!group.hasRealSeasons) best.seasonNum = 0
  best.totalEpisodeCount = best.episodeCount
  return best
}

export function hasFullSeason(group) {
  const seasons = Object.values(group.seasons || {})
  return seasons.some(posts => posts.length > 1)
}

export function scoreGroup(group) {
  const displayName = group.displayName || ''
  let score = 0
  if (/netflix/i.test(displayName)) score += 50
  const seasons = Object.values(group.seasons)
  const totalEps = seasons.reduce((sum, posts) => sum + posts.length, 0)
  score += Math.min(totalEps, 30)
  const dates = seasons.flat().map(p => new Date(p.date || 0).getTime()).filter(Boolean)
  if (dates.length) {
    const latest = Math.max(...dates)
    const daysAgo = (Date.now() - latest) / 86400000
    if (daysAgo < 7) score += 20
    else if (daysAgo < 30) score += 10
    else if (daysAgo < 90) score += 5
  }
  return score
}

export function normalizeText(text) {
  return text.toLowerCase()
    .replace(/[أإآا]/g, 'a')
    .replace(/ى/g, 'y')
    .replace(/ؤ/g, 'w')
    .replace(/ئ/g, 'e')
    .replace(/ة/g, 'h')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function tokenize(text) {
  return text.toLowerCase().split(/\s+/).filter(Boolean)
}

const GENRE_SYNONYMS = {
  action: ['action', 'اكشن', 'أكشن', 'حركة', 'حركه'],
  comedy: ['comedy', 'كوميدي', 'كوميدى', 'كوميديا', 'ضحك', 'مضحك'],
  romance: ['romance', 'رومانسي', 'رومانسى', 'رومانسية', 'حب', 'غرام', 'عشق'],
  horror: ['horror', 'رعب', 'مرعب', 'مخيف'],
  drama: ['drama', 'دراما'],
  thriller: ['thriller', 'اثارة', 'إثارة', 'تشويق'],
  adventure: ['adventure', 'مغامرة', 'مغامرات'],
}

function textContainsAny(text, terms) {
  const lower = text.toLowerCase()
  return terms.some(t => lower.includes(t))
}

const GENRE_KEYWORDS = {
  'سيرة ذاتية': 'Biography',
  'خيال علمي': 'Sci-Fi',
  'اكشن': 'Action',
  'أكشن': 'Action',
  'كوميدي': 'Comedy',
  'كوميدى': 'Comedy',
  'كوميديا': 'Comedy',
  'دراما': 'Drama',
  'درامي': 'Drama',
  'درامية': 'Drama',
  'رعب': 'Horror',
  'مرعب': 'Horror',
  'رومانسي': 'Romance',
  'رومانسى': 'Romance',
  'رومانسية': 'Romance',
  'اثارة': 'Thriller',
  'إثارة': 'Thriller',
  'تشويق': 'Thriller',
  'مغامرة': 'Adventure',
  'مغامرات': 'Adventure',
  'جريمة': 'Crime',
  'غموض': 'Mystery',
  'وثائقي': 'Documentary',
  'تاريخي': 'Historical',
  'عائلي': 'Family',
  'فانتازيا': 'Fantasy',
  'موسيقي': 'Musical',
  'بوليسي': 'Crime',
  'رياضة': 'Sports',
  'رياضي': 'Sports',
  'حرب': 'War',
}

export function extractGenres(item) {
  const html = item.content?.rendered || item.excerpt?.rendered || ''
  if (!html) return []

  const d = document.createElement('div')
  d.innerHTML = html
  const text = d.textContent || ''

  const found = []
  const seen = new Set()

  const sorted = Object.entries(GENRE_KEYWORDS).sort(([a], [b]) => b.length - a.length)

  for (const [arabic, english] of sorted) {
    if (seen.has(english)) continue
    const regex = new RegExp(arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (regex.test(text)) {
      seen.add(english)
      found.push(english)
    }
  }

  return found
}

export function matchTitle(item, query) {
  const title = item.title?.rendered || ''
  const q = query.toLowerCase().trim()

  if (title.toLowerCase().includes(q)) return true

  const normalizedTitle = normalizeText(title)
  const normalizedQuery = normalizeText(query)
  if (normalizedTitle.includes(normalizedQuery)) return true

  const titleTokens = tokenize(title)
  const queryTokens = tokenize(q)
  if (queryTokens.some(qt => titleTokens.some(tt => tt.includes(qt) || qt.includes(tt)))) return true

  const synonyms = GENRE_SYNONYMS[q]
  if (synonyms && textContainsAny(title, synonyms)) return true

  return false
}
