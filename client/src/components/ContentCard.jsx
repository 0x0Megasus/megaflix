import { getFeaturedImage, detectType, extractQuality, extractGenres, getCleanTitle, parseEpisode, stripArabic } from '../services/utils'

export default function ContentCard({ item, onWatch }) {
  const title = stripArabic(getCleanTitle(item))
  const image = getFeaturedImage(item)
  const type = detectType(item)
  const quality = extractQuality(item.title?.rendered || '')
  const genres = extractGenres(item)
  const { season, episode } = parseEpisode(item.title?.rendered || '')

  return (
    <article className="card" onClick={() => onWatch(item)}>
      <div className="card__img-wrap">
        {image ? (
          <img className="card__img" src={image} alt={title} loading="lazy" />
        ) : (
          <div className="card__placeholder" />
        )}
        <div className="card__overlay">
          <button className="card__watch-btn" onClick={(e) => { e.stopPropagation(); onWatch(item); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Play
          </button>
        </div>
      </div>
      <div className="card__body">
        <h3 className="card__title">{title}</h3>
        <div className="card__meta">
          <span className="card__badge card__badge--type">{type}</span>
          {season > 0 && <span className="card__badge">S{season}</span>}
          {episode > 0 && <span className="card__badge">EP{episode}</span>}
          {quality && <span className="card__badge card__badge--quality">{quality}</span>}
          {item.imdbRating && <span className="card__badge card__badge--imdb">★ {item.imdbRating}</span>}
          {genres.slice(0, 2).map(g => (
            <span key={g} className="card__badge card__badge--genre">{g}</span>
          ))}
        </div>
      </div>
    </article>
  )
}
