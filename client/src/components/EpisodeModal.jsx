import { useState, useEffect, useMemo } from 'react'
import { getFeaturedImage, extractGenres, stripArabic } from '../services/utils'

export default function EpisodeModal({ group, loading, onClose, onWatch }) {
  const [selectedSeason, setSelectedSeason] = useState(null)

  const seasons = useMemo(() => {
    const entries = Object.entries(group?.seasons || {})
    entries.sort(([a], [b]) => parseInt(a) - parseInt(b))
    return entries.map(([seasonNum, posts]) => ({
      seasonNum: parseInt(seasonNum),
      episodes: [...posts].sort((a, b) => (a.episode || 0) - (b.episode || 0))
    }))
  }, [group])

  const displayName = stripArabic(group?.displayName || '')
  const representative = group?.representative || (group?.posts ? group.posts[0] : null)
  const genres = representative ? extractGenres(representative) : []
  const rating = group?.imdbRating || representative?.imdbRating

  useEffect(() => {
    if (seasons.length === 1) setSelectedSeason(seasons[0].seasonNum)
  }, [seasons])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (selectedSeason && !loading) setSelectedSeason(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, selectedSeason, loading])

  const activeSeason = selectedSeason
    ? seasons.find(s => s.seasonNum === selectedSeason)
    : null

  const handleBack = () => setSelectedSeason(null)

  return (
    <div className="episode-modal">
      <div className="episode-modal__backdrop" onClick={handleBack} />
      <div className="episode-modal__panel">
        <div className="episode-modal__header">
          <div className="episode-modal__header-info">
            <h2 className="episode-modal__title">{displayName}</h2>
            <div className="episode-modal__meta">
              {rating && <span className="card__badge card__badge--imdb">★ {rating}</span>}
              {genres.map(g => (
                <span key={g} className="card__badge card__badge--genre">{g}</span>
              ))}
            </div>
          </div>
          <button className="episode-modal__close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="episode-modal__list">
            <div className="season-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="season-skeleton__card">
                  <div className="season-skeleton__num" />
                  <div className="season-skeleton__line" />
                </div>
              ))}
            </div>
          </div>
        ) : seasons.length === 0 ? (
          <div className="episode-modal__list">
            <p className="episode-modal__empty">No seasons found</p>
          </div>
        ) : !selectedSeason ? (
          <div className="episode-modal__list">
            {seasons.length > 1 && (
              <p className="episode-modal__hint">Select a season to browse episodes</p>
            )}
            <div className="season-grid">
              {seasons.map(s => (
                <div key={s.seasonNum} className="season-card" onClick={() => setSelectedSeason(s.seasonNum)}>
                  <div className="season-card__num">S{s.seasonNum}</div>
                  <div className="season-card__range">
                    {s.episodes.length > 1
                      ? `EP ${s.episodes[0].episode || 1}-${s.episodes[s.episodes.length - 1].episode || s.episodes.length}`
                      : `EP ${s.episodes[0].episode || 1}`}
                  </div>
                  <button className="season-card__btn">Browse</button>
                </div>
              ))}
            </div>
          </div>
        ) : activeSeason ? (
          <div className="episode-modal__list">
            <button className="episode-modal__back" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6" />
              </svg>
              All Seasons
            </button>
            <h3 className="episode-modal__season-title">
              Season {activeSeason.seasonNum}
              <span className="episode-modal__season-count">{activeSeason.episodes.length} episodes</span>
            </h3>
            {activeSeason.episodes.map((ep, i) => (
              <div key={ep.id || i} className="episode-card" onClick={() => onWatch(ep)}>
                <span className="episode-card__num">EP {ep.episode || i + 1}</span>
                <div className="episode-card__thumb">
                  {getFeaturedImage(ep, 'medium') ? (
                    <img src={getFeaturedImage(ep, 'medium')} alt={stripArabic(ep.title?.rendered || `Episode ${ep.episode || i + 1}`)} loading="lazy" decoding="async" />
                  ) : (
                    <div className="episode-card__thumb-placeholder" />
                  )}
                </div>
                <div className="episode-card__info">
                  <div className="episode-card__title">{stripArabic(ep.title?.rendered || `Episode ${ep.episode || i + 1}`)}</div>
                </div>
                <button className="episode-card__play" onClick={(e) => { e.stopPropagation(); onWatch(ep); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Play
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
