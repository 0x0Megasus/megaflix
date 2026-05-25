import { getFeaturedImage, detectType } from '../services/utils'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect fill="%231a1a2e" width="800" height="400"/%3E%3Ctext fill="%23444" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMegaFlix%3C/text%3E%3C/svg%3E'

export default function HeroBanner({ item, onWatch, loading }) {
  if (loading) {
    return (
      <section className="hero hero--loading">
        <div className="hero__skeleton" />
        <div className="hero__gradient" />
      </section>
    )
  }

  if (!item) return null

  const title = item.title?.rendered || 'Untitled'
  const image = getFeaturedImage(item) || FALLBACK_IMG
  const type = detectType(item)

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
        <button className="hero__btn" onClick={() => onWatch(item)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Play
        </button>
      </div>
    </section>
  )
}
