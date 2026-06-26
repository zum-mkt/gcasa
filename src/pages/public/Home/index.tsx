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

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <QuemSomosSection />
      <Benefits />
      <AssociatesSection />
      <EventsSection />
      <TestimonialsSection />
      <PartnersSection />
      <BlogSection />
      <CTASection />
    </>
  )
}
