import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="not-found__content">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Lost your way?</h2>
        <p className="not-found__desc">
          The page you're looking for doesn't exist or was removed.
        </p>
        <Link to="/" className="not-found__btn">Back to Home</Link>
      </div>
    </section>
  )
}
