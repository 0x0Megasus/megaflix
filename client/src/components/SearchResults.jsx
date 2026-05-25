import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { detectType, groupByShow, pickBiggestSeason, hasFullSeason, getCleanTitle, parseEpisode } from '../services/utils'
import { fetchPosts, fetchShowEpisodes, searchPosts } from '../services/api'
import ShowCard from './ShowCard'
import ContentCard from './ContentCard'

const SEARCH_TYPES = [
  { key: '', label: 'All', catFilter: '' },
  { key: 'movies', label: 'Movies', catFilter: 'movies' },
  { key: 'tv', label: 'TV Shows', catFilter: 'tv' },
  { key: 'anime', label: 'Anime', catFilter: 'anime' },
]

export default function SearchResults({ onWatch }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || ''

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichedGroups, setEnrichedGroups] = useState(null)

  const activeType = SEARCH_TYPES.find(t => t.key === typeParam) || null
  const catFilter = activeType?.catFilter || ''

  const setSearch = (newType, newQuery) => {
    const params = new URLSearchParams()
    if (newQuery !== undefined) params.set('q', newQuery)
    else if (query) params.set('q', query)
    
    if (newType !== undefined) {
      if (newType) params.set('type', newType)
    } else if (typeParam) {
      params.set('type', typeParam)
    }
    
    navigate(`/search?${params.toString()}`, { replace: true })
  }

  useEffect(() => {
    if (!query.trim() || !activeType) {
      setResults(null)
      setLoading(false)
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        let data
        if (catFilter) {
          const page = await fetchPosts({ filter: catFilter, search: query, perPage: 100 })
          data = Array.isArray(page) ? page : []
        } else {
          data = await searchPosts(query)
        }
        setResults(data)
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [query, activeType, catFilter])

  const grouped = useMemo(() => {
    if (!results || results.length === 0) return null
    const raw = groupByShow(results)
    const tv = []
    const anime = []
    const movie = []
    
    for (const group of raw) {
      const rep = group.representative || group.posts[0]
      if (!rep) continue
      
      const type = detectType(rep)
      const season = pickBiggestSeason(group)
      
      const entry = { 
        ...group, 
        representative: season.representative || group.posts[0],
        episodeCount: season.episodeCount || group.posts.length,
        totalEpisodeCount: season.totalEpisodeCount || group.posts.length,
        seasonNum: season.seasonNum || 1
      }
      
      if (Object.keys(entry.seasons).length === 0) {
        entry.seasons[entry.seasonNum] = entry.posts
      }

      if (type === 'TV Show') tv.push(entry)
      else if (type === 'Anime') anime.push(entry)
      else movie.push(entry)
    }
    return { tvGroups: tv, movieGroups: movie, animeGroups: anime }
  }, [results])

  useEffect(() => {
    setEnrichedGroups(grouped)
    setEnriching(false)
  }, [grouped])

  const { tvGroups, movieGroups, animeGroups } = enrichedGroups || grouped || { tvGroups: [], movieGroups: [], animeGroups: [] }
  const totalCount = tvGroups.length + movieGroups.length + animeGroups.length

  const showSearchBar = !!activeType
  const hasQuery = !!query.trim()

  return (
    <section className="search-results">
      <SEO title={query ? `Search: ${query}` : 'Search'} description={`Search for movies, TV shows, and anime on MegaFlix.`} path="/search" />
      <div className="search-results__header">
        <div className="search-results__header-left">
          <div className="search-results__type-selector">
            {SEARCH_TYPES.map(t => (
              <button
                key={t.key}
                className={`search-results__type-btn${activeType?.key === t.key ? ' active' : ''}`}
                onClick={() => {
                  if (activeType?.key === t.key) return
                  setSearch(t.key, '')
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button className="search-results__close" onClick={() => navigate('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Close
        </button>
      </div>

      {showSearchBar && (
        <div className="search-results__input-wrap">
          <input
            className="search-results__input"
            type="text"
            placeholder={activeType.key === '' ? 'Search movies, TV shows & anime...' : `Search ${activeType.label}...`}
            value={query}
            onChange={e => setSearch(activeType.key, e.target.value)}
            autoFocus={!hasQuery}
          />
        </div>
      )}

      {!activeType ? (
        <p className="search-results__none">
          Select a category above to start searching
        </p>
      ) : loading ? (
        <div className="search-results__grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="search-card search-card--skeleton" />
          ))}
        </div>
      ) : hasQuery && totalCount === 0 ? (
        activeType.key === '' ? (
          <p className="search-results__none">
            No results found for &ldquo;{query}&rdquo;. Try a different search term.
          </p>
        ) : (
          <p className="search-results__none">
            No results found for &ldquo;{query}&rdquo; in {activeType.label}. Try a different search term.
          </p>
        )
      ) : hasQuery ? (
        <>
          {enriching && (
            <div className="search-results__loading">
              <div className="search-results__spinner" />
              Loading episodes…
            </div>
          )}
          {tvGroups.length > 0 && (
            <section className="search-section">
              <h2 className="search-section__title">TV Shows</h2>
              <div className="search-results__grid search-results__grid--groups">
                {tvGroups.map((group, i) => (
                  <ShowCard key={group.displayName || i} group={group} onWatch={onWatch} />
                ))}
              </div>
            </section>
          )}
          {movieGroups.length > 0 && (
            <section className="search-section">
              <h2 className="search-section__title">Movies</h2>
              <div className="search-results__grid search-results__grid--groups">
                {movieGroups.map((group, i) => {
                  const post = group.representative || group.posts[0]
                  return <ContentCard key={post?.id || i} item={post} onWatch={onWatch} />
                })}
              </div>
            </section>
          )}
          {animeGroups.length > 0 && (
            <section className="search-section">
              <h2 className="search-section__title">Anime</h2>
              <div className="search-results__grid search-results__grid--groups">
                {animeGroups.map((group, i) => {
                  const item = group.representative || group.posts[0]
                  const type = detectType(item)
                  if (type === 'Anime Movie') {
                    return <ContentCard key={item.id || i} item={item} onWatch={onWatch} />
                  }
                  return <ShowCard key={group.displayName || i} group={group} onWatch={onWatch} />
                })}
              </div>
            </section>
          )}
        </>
      ) : null}
    </section>
  )
}
