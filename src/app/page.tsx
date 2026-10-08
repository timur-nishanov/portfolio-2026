import { SiteHeader } from '@/components/header/SiteHeader';
import { Hero } from '@/components/hero/Hero';
import { CaseShowcase } from '@/components/showcase/CaseShowcase';
import { AboutAwards } from '@/components/about/AboutAwards';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
// The older sections stay hidden until Timur brings them back. Code stays in
// place; restore these imports and the block below.
// import { Header } from '@/components/header/Header';
// import { CasesSection } from '@/components/cases/CasesSection';
// import { AwardsSection } from '@/components/awards/AwardsSection';
// import { RandomSection } from '@/components/random/RandomSection';
// import { AboutBlock } from '@/components/random/AboutBlock';
// import { LifeSection } from '@/components/life/LifeSection';
// import { CareerSection } from '@/components/career/CareerSection';
// import { Footer } from '@/components/ui/Footer';

export default function Home() {
  return (
    <SmoothScrollProvider>
      <SiteHeader />
      <main>
        <Hero />
        <CaseShowcase />
        <AboutAwards />
      </main>
      {/* Previous full page, not rendered yet:
      <SmoothScrollProvider>
        <Header />
        <main className="page-curtain">
          <Hero />
          <CasesSection />
          <AwardsSection />
          <RandomSection />
          <AboutBlock />
          <LifeSection />
          <CareerSection />
          <div aria-hidden="true" className="curtain-lift-sentinel" />
        </main>
        <Footer />
      </SmoothScrollProvider>
      */}
    </SmoothScrollProvider>
  );
}
