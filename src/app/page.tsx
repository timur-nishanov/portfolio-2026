import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { Header } from '@/components/header/Header';
import { Hero } from '@/components/hero/Hero';
import { CasesSection } from '@/components/cases/CasesSection';
import { AwardsSection } from '@/components/awards/AwardsSection';
import { RandomSection } from '@/components/random/RandomSection';
import { AboutBlock } from '@/components/random/AboutBlock';
import { LifeSection } from '@/components/life/LifeSection';
import { CareerSection } from '@/components/career/CareerSection';
import { Footer } from '@/components/ui/Footer';

export default function Home() {
  return (
    <SmoothScrollProvider>
      <Header />
      <main>
        <Hero />
        <CasesSection />
        {/* Awards after the cases; Random then sits after Awards. */}
        <AwardsSection />
        <RandomSection />
        {/* Statement block right after Random, then LIFE and CAREER. */}
        <AboutBlock />
        <LifeSection />
        <CareerSection />
      </main>
      <Footer />
    </SmoothScrollProvider>
  );
}
