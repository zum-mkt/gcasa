import { Hero } from './Hero'
import { Stats } from './Stats'
import { QuemSomosSection } from './QuemSomosSection'
import { Benefits } from './Benefits'
import { AssociatesSection } from './AssociatesSection'
import { EventsSection } from './EventsSection'
import { TestimonialsSection } from './TestimonialsSection'
import { PartnersSection } from './PartnersSection'
import { BlogSection } from './BlogSection'
import { CTASection } from './CTASection'
import { TopBanner } from '@/components/layout/TopBanner'
import { SectionDivider } from '@/components/layout/SectionDivider'

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <TopBanner />
      <QuemSomosSection />
      <Benefits />
      <AssociatesSection />
      <EventsSection />
      <SectionDivider from="light" />
      <TestimonialsSection />
      <SectionDivider from="dark" />
      <PartnersSection />
      <BlogSection />
      <SectionDivider from="light" />
      <CTASection />
    </>
  )
}
