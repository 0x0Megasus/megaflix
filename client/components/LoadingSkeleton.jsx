export default function LoadingSkeleton({ title = '', count = 6 }) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <section className="row">
      {title && <h2 className="row__title">{title}</h2>}
      <div className="row__container">
        <div className="row__cards">
          {items.map(i => (
            <div key={i} className="card card--skeleton">
              <div className="card__img-wrap">
                <div className="skeleton skeleton--img" />
              </div>
              <div className="card__body">
                <div className="skeleton skeleton--text" />
                <div className="skeleton skeleton--text skeleton--short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
