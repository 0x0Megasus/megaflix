import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <SEO title="Page Not Found" description="The page you are looking for does not exist or was removed." />
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
