import { Header } from './Header'
import { Footer } from './Footer'
import { WhatsAppButton } from './WhatsAppButton'
import { LoadingScreen } from './LoadingScreen'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <LoadingScreen />
      <Header />
      <div style={{ paddingTop: 80 }}>
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
