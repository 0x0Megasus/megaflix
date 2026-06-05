import { useState, useRef } from 'react'
import { getFeaturedImage, detectType, extractQuality, groupByShow, extractGenres, stripArabic } from '../services/utils'
import { fetchShowEpisodes } from '../services/api'
import EpisodeModal from './EpisodeModal'

export default function ShowCard({ group, onWatch }) {
  const [showModal, setShowModal] = useState(false)
  const [episodeGroup, setEpisodeGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchRef = useRef(false)

  // Defensive check: handle if group is just a post
  const posts = group?.posts || (group?.id ? [group] : [])
  const post = group?.representative || posts[0]
  
  if (!post) return null

  const title = stripArabic(group?.displayName || post.title?.rendered || 'Untitled')
  const image = getFeaturedImage(post, 'medium')
  const type = detectType(post)
  const quality = extractQuality(post.title?.rendered || '')
  const genres = extractGenres(post)
  const rating = group?.imdbRating || post.imdbRating

  const handleClick = async () => {
    if (episodeGroup && episodeGroup.posts.length > 1) {
      setShowModal(true)
      return
    }

    // Even if we have one post, if it's a TV/Anime type, we should try to fetch all episodes
    const existingSeasons = Object.values(group.seasons || {})
    const hasFullData = existingSeasons.some(posts => posts.length > 1)
    
    if (hasFullData && episodeGroup) {
      setShowModal(true)
      return
    }

    if (fetchRef.current) return
    fetchRef.current = true
    setLoading(true)
    setShowModal(true)

    try {
      const detectedType = detectType(post)
      const catIds = detectedType === 'Anime' ? '5,8' : detectedType === 'TV Show' ? '7,9' : ''
      
      // Prepare a safe fallback group
      const safeGroup = { ...group }
      const currentSNum = group.seasonNum || 1
      if (!safeGroup.seasons || Object.keys(safeGroup.seasons).length === 0) {
        safeGroup.seasons = { [currentSNum]: [post] }
      }

      if (!catIds) {
        setEpisodeGroup(safeGroup)
        setLoading(false)
        return
      }
      
      const episodes = await fetchShowEpisodes(title, catIds)
      if (episodes && episodes.length > 0) {
        const regrouped = groupByShow(episodes)
        const best = regrouped.find(g => g.displayName.toLowerCase().includes(title.toLowerCase())) || regrouped[0]
        if (best) {
          // Merge or set best
          setEpisodeGroup(best)
        } else {
          setEpisodeGroup(safeGroup)
        }
      } else {
        setEpisodeGroup(safeGroup)
      }
    } catch (err) {
      console.error('Failed to fetch episodes:', err)
      const currentSNum = group.seasonNum || 1
      const safeGroup = { ...group }
      if (!safeGroup.seasons || Object.keys(safeGroup.seasons).length === 0) {
        safeGroup.seasons = { [currentSNum]: [post] }
      }
      setEpisodeGroup(safeGroup)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <article className="card show-card" onClick={handleClick}>
        <div className="card__img-wrap">
          {image ? (
            <img className="card__img" src={image} alt={title} loading="lazy" decoding="async" />
          ) : (
            <div className="card__placeholder" />
          )}
          <div className="card__overlay">
            <button className="card__watch-btn" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Episodes
            </button>
          </div>
        </div>
        <div className="card__body">
          <h3 className="card__title">{title}</h3>
          <div className="card__meta">
            <span className="card__badge card__badge--type">{type}</span>
            {quality && <span className="card__badge card__badge--quality">{quality}</span>}
            {rating && <span className="card__badge card__badge--imdb">★ {rating}</span>}
            {genres.slice(0, 2).map(g => (
              <span key={g} className="card__badge card__badge--genre">{g}</span>
            ))}
          </div>
        </div>
      </article>
      {showModal && (
        <EpisodeModal
          group={episodeGroup}
          loading={loading && !episodeGroup}
          onClose={() => { setShowModal(false); fetchRef.current = false }}
          onWatch={onWatch}
        />
      )}
    </>
  )
}
