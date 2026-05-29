export default function LoadingSkeleton({ count = 6, title = '', grid = false }) {
  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title || <>&nbsp;</>}</h2>
      </div>
      <div className={grid ? "row__grid" : "skeleton-row__container"}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card__img" />
            <div className="skeleton-card__body">
              <div className="skeleton-card__line" />
              <div className="skeleton-card__line skeleton-card__line--short" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
