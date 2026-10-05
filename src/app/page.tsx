import { SiteHeader } from '@/components/header/SiteHeader';
import { Hero } from '@/components/hero/Hero';
// Hidden for now — the site is one screen until Timur brings the sections
// back. Code stays in place; restore these imports and the block below.
// import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
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
    <>
      <SiteHeader />
      <main>
        <Hero />
      </main>
      {/* Previous full page, not rendered while only the first screen is live
          (also drop `one-screen` in layout.tsx when restoring):
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
    </>
  );
}
