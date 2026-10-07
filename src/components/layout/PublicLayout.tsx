import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { WhatsAppButton } from './WhatsAppButton'
import { LoadingScreen } from './LoadingScreen'

const HEADER_HEIGHT = 80

function HashScroll() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.replace(/^#/, ''))
    let cancelled = false
    let attempts = 0

    const tryScroll = () => {
      if (cancelled) return
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
        window.scrollTo({ top, behavior: 'smooth' })
        return
      }
      if (attempts++ < 40) requestAnimationFrame(tryScroll)
    }

    const t = window.setTimeout(tryScroll, 40)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [pathname, hash])

  return null
}

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <LoadingScreen />
      <Header />
      <HashScroll />
      <div style={{ paddingTop: 80 }}>
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
