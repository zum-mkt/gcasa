import { Header } from './Header'
import { Footer } from './Footer'
import { WhatsAppButton } from './WhatsAppButton'
import { TopBanner } from './TopBanner'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      {/* 80px spacer so content starts below the fixed header */}
      <div style={{ paddingTop: 80 }}>
        <TopBanner />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
