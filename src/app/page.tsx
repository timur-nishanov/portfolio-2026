import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { Header } from '@/components/header/Header';
import { Hero } from '@/components/hero/Hero';
import { CasesSection } from '@/components/cases/CasesSection';
import { AwardsSection } from '@/components/awards/AwardsSection';
// Random is parked, not removed — uncomment here and in the JSX (and restore
// its entry in data/nav.ts) to bring it back.
// import { RandomSection } from '@/components/random/RandomSection';
import { AboutBlock } from '@/components/random/AboutBlock';
import { LifeSection } from '@/components/life/LifeSection';
import { CareerSection } from '@/components/career/CareerSection';
import { Footer } from '@/components/ui/Footer';

export default function Home() {
  return (
    <SmoothScrollProvider>
      <Header />
      {/* page-curtain: the background plate that slides up off the footer. */}
      <main className="page-curtain">
        <Hero />
        <CasesSection />
        {/* Awards after the cases; Random then sits after Awards. */}
        <AwardsSection />
        {/* <RandomSection /> — parked, see the import note above. */}
        {/* Statement block right after Random, then LIFE and CAREER. */}
        <AboutBlock />
        <LifeSection />
        <CareerSection />
        {/* Zero-height marker whose travel across the screen drives the
            curtain's lift-off effect — see "the lift" in globals.css. */}
        <div aria-hidden="true" className="curtain-lift-sentinel" />
      </main>
      <Footer />
    </SmoothScrollProvider>
  );
}
