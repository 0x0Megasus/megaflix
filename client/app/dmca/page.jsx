'use client'

import SEO from '@/components/SEO'
import Link from 'next/link'

export default function DMCA() {
  return (
    <>
      <SEO title="DMCA" path="/dmca" />
      <main className="legal-page">
        <div className="legal-container">
          <h1>DMCA Notice</h1>
          <p>MegaFlix respects the intellectual property rights of others.</p>
          <p>
            If you believe that any content available through our service infringes upon any copyright,
            please contact us at <a href="mailto:megaflix@proton.me">megaflix@proton.me</a>
            {' '}with the following information:
          </p>
          <ul>
            <li>A physical or electronic signature of the copyright owner or authorized agent</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material that is claimed to be infringing</li>
            <li>Your contact information (address, phone, email)</li>
            <li>A statement that you have a good faith belief the use is not authorized</li>
            <li>A statement that the information is accurate and you are authorized to act</li>
          </ul>
          <Link href="/">Back to Home</Link>
        </div>
      </main>
    </>
  )
}
