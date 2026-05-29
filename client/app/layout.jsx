import { Cairo } from 'next/font/google'
import PlayerProvider from '@/components/PlayerProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import '@/styles/base.css'
import '@/styles/nav.css'
import '@/styles/hero.css'
import '@/styles/rows.css'
import '@/styles/modals.css'
import '@/styles/search.css'
import '@/styles/pages.css'
import '@/styles/responsive.css'

export const viewport = {
  themeColor: '#141414',
}

const cairo = Cairo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'MegaFlix - Stream Movies, TV Shows & Anime Free Online',
  description: 'Watch free movies, TV shows, and anime online in HD. MegaFlix offers the latest streaming content with no registration required.',
  keywords: 'free movies online, stream TV shows, watch anime free, online streaming, MegaFlix',
  robots: 'index, follow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'MegaFlix - Stream Movies, TV Shows & Anime Free Online',
    description: 'Watch free movies, TV shows, and anime online in HD. No registration required.',
    type: 'website',
    url: 'https://www.megaflix.cc/',
    images: [{ url: 'https://www.megaflix.cc/og-image.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MegaFlix - Stream Movies, TV Shows & Anime Free Online',
    description: 'Watch free movies, TV shows, and anime online in HD. No registration required.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={cairo.className}>
        <PlayerProvider>
          <Navbar />
          {children}
          <Footer />
        </PlayerProvider>
      </body>
    </html>
  )
}
