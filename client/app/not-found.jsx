'use client'

import SEO from '@/components/SEO'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <>
      <SEO title="Page Not Found" path="/404" />
      <main className="not-found-page">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <p className="not-found-text">Page not found</p>
          <Link href="/" className="not-found-link">Back to Home</Link>
        </div>
      </main>
    </>
  )
}
