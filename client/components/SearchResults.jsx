'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { detectType, groupByShow, pickBiggestSeason } from '@/services/utils'
import { fetchPosts, searchPosts } from '@/services/api'
import ShowCard from './ShowCard'
import ContentCard from './ContentCard'

const SEARCH_TYPES = [
  { key: '', label: 'All', catFilter: '' },
  { key: 'movies', label: 'Movies', catFilter: 'movies' },
  { key: 'tv', label: 'TV Shows', catFilter: 'tv' },
  { key: 'anime', label: 'Anime', catFilter: 'anime' },
]

export default function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || ''

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const activeType = SEARCH_TYPES.find(t => t.key === typeParam) || SEARCH_TYPES[0]
  const catFilter = activeType?.catFilter || ''
  const { debounced: debouncedQuery, flush: flushDebounce } = useDebounce(query, 1500)

  const setSearch = (newType, newQuery) => {
    const params = new URLSearchParams()
    if (newQuery !== undefined) params.set('q', newQuery)
    else if (query) params.set('q', query)
    if (newType !== undefined) { if (newType) params.set('type', newType) }
    else if (typeParam) params.set('type', typeParam)
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  const doSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) { setResults(null); setLoading(false); return }
    setLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    ;(async () => {
      try {
        let data
        if (catFilter) {
          const page = await fetchPosts({ filter: catFilter, search: searchQuery, perPage: 100 })
          data = Array.isArray(page) ? page : []
        } else {
          data = await searchPosts(searchQuery)
        }
        setResults(data)
      } catch { setResults([]) }
      setLoading(false)
    })()
  }, [catFilter])

  const handleSearchBtn = useCallback(() => {
    if (!query.trim()) return
    flushDebounce()
    doSearch(query)
  }, [query, doSearch, flushDebounce])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null)
      setLoading(false)
      return
    }
    doSearch(debouncedQuery)
  }, [debouncedQuery, doSearch])

  const grouped = useMemo(() => {
    if (!results || results.length === 0) return null
    const raw = groupByShow(results)
    const tv = [], anime = [], movie = []

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
      if (Object.keys(entry.seasons).length === 0) entry.seasons[entry.seasonNum] = entry.posts

      if (type === 'TV Show') tv.push(entry)
      else if (type === 'Anime') anime.push(entry)
      else movie.push(entry)
    }
    return { tvGroups: tv, movieGroups: movie, animeGroups: anime }
  }, [results])

  const { tvGroups, movieGroups, animeGroups } = grouped || { tvGroups: [], movieGroups: [], animeGroups: [] }
  const totalCount = tvGroups.length + movieGroups.length + animeGroups.length

  return (
    <section className="search-results">
      <div className="search-results__header">
        <div className="search-results__header-left">
          <div className="search-results__type-selector">
            {SEARCH_TYPES.map(t => (
              <button
                key={t.key}
                className={`search-results__type-btn${activeType?.key === t.key ? ' active' : ''}`}
                onClick={() => { if (activeType?.key !== t.key) setSearch(t.key, '') }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button className="search-results__close" onClick={() => router.push('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Close
        </button>
      </div>

      {activeType && (
        <div className="search-results__input-wrap">
          <input
            className="search-results__input"
            type="text"
            placeholder={activeType.key === '' ? 'Search movies, TV shows & anime...' : `Search ${activeType.label}...`}
            value={query}
            onChange={e => setSearch(activeType.key, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchBtn()}
            autoFocus={!query.trim()}
          />
        </div>
      )}

      {!activeType ? (
        <p className="search-results__none">Select a category above to start searching</p>
      ) : loading ? (
        <div className="search-results__grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="search-card search-card--skeleton" />)}
        </div>
      ) : query.trim() && totalCount === 0 ? (
        <p className="search-results__none">
          No results found for &ldquo;{query}&rdquo;{activeType.key ? ` in ${activeType.label}` : ''}. Try a different search term.
        </p>
      ) : query.trim() ? (
        <>
          {tvGroups.length > 0 && (
            <section className="search-section">
              <h2 className="search-section__title">TV Shows</h2>
              <div className="search-results__grid search-results__grid--groups">
                {tvGroups.map((group, i) => <ShowCard key={group.displayName || i} group={group} />)}
              </div>
            </section>
          )}
          {movieGroups.length > 0 && (
            <section className="search-section">
              <h2 className="search-section__title">Movies</h2>
              <div className="search-results__grid search-results__grid--groups">
                {movieGroups.map((group, i) => {
                  const post = group.representative || group.posts[0]
                  return <ContentCard key={post?.id || i} item={post} />
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
                  if (type === 'Anime Movie') return <ContentCard key={item.id || i} item={item} />
                  return <ShowCard key={group.displayName || i} group={group} />
                })}
              </div>
            </section>
          )}
        </>
      ) : null}
    </section>
  )
}
