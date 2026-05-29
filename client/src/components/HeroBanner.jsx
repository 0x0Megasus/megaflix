import { useState, useRef } from 'react'
import { getFeaturedImage, getCleanTitle, detectType, groupByShow } from '../services/utils'
import { fetchShowEpisodes } from '../services/api'
import EpisodeModal from './EpisodeModal'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect fill="%231a1a2e" width="800" height="400"/%3E%3Ctext fill="%23444" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMegaFlix%3C/text%3E%3C/svg%3E'

export default function HeroBanner({ item, onWatch, loading }) {
  const [showSeasons, setShowSeasons] = useState(false)
  const [episodeGroup, setEpisodeGroup] = useState(null)
  const [seasonLoading, setSeasonLoading] = useState(false)
  const fetchRef = useRef(false)

  if (loading) {
    return (
      <section className="hero hero--loading">
        <div className="hero__skeleton" />
        <div className="hero__gradient" />
      </section>
    )
  }

  if (!item) return null

  const title = item.imdbTitle || getCleanTitle(item)
  const image = getFeaturedImage(item) || FALLBACK_IMG
  const type = detectType(item)
  const isShowType = type === 'TV Show' || type === 'Anime'

  const handleShowSeasons = async () => {
    if (episodeGroup && episodeGroup.posts?.length > 1) {
      setShowSeasons(true)
      return
    }
    if (fetchRef.current) return
    fetchRef.current = true
    setSeasonLoading(true)
    setShowSeasons(true)

    try {
      const catIds = type === 'Anime' ? '5,8' : '7,9'
      const cleanTitle = getCleanTitle(item)
      const episodes = await fetchShowEpisodes(cleanTitle, catIds)
      if (episodes?.length > 0) {
        const regrouped = groupByShow(episodes)
        const best = regrouped.find(g =>
          g.displayName.toLowerCase().includes(cleanTitle.toLowerCase())
        ) || regrouped[0]
        if (best) setEpisodeGroup(best)
      }
    } catch {
      // episodes failed to load — user can still browse normally
    } finally {
      setSeasonLoading(false)
    }
  }

  return (
    <section className="hero">
      <div className="hero__bg">
        <img className="hero__bg-img" src={image} alt={title} fetchpriority="high" />
        <div className="hero__bg-fallback" style={{ backgroundImage: `url(${image})` }} />
      </div>
      <div className="hero__gradient" />
      <div className="hero__content">
        <span className="hero__type">{type}</span>
        <h1 className="hero__title">{title}</h1>
        <p className="hero__desc">Featured content ready to stream. Click below to start watching.</p>
        <button className="hero__btn" onClick={isShowType ? handleShowSeasons : () => onWatch(item)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {isShowType ? 'All Seasons' : 'Play'}
        </button>
      </div>
      {isShowType && showSeasons && (
        <EpisodeModal
          group={episodeGroup}
          loading={seasonLoading && !episodeGroup}
          onClose={() => { setShowSeasons(false); fetchRef.current = false }}
          onWatch={onWatch}
        />
      )}
    </section>
  )
}
