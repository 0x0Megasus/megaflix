'use client'

export default function HeroBanner({ item, loading }) {
  if (loading || !item) return null

  const image = item._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
  const title = item.title?.rendered || ''

  return (
    <section className="hero">
      <div className="hero__bg">
        <img className="hero__bg-img" src={image} alt={title} />
        <div className="hero__gradient" />
      </div>
      <div className="hero__content">
        <h1 className="hero__title">{title}</h1>
        <p className="hero__desc" dangerouslySetInnerHTML={{ __html: item.excerpt?.rendered || '' }} />
      </div>
    </section>
  )
}
