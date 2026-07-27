import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { Header } from '@/components/header/Header';
import { Hero } from '@/components/hero/Hero';
import { CasesSection } from '@/components/cases/CasesSection';
import { AwardsSection } from '@/components/awards/AwardsSection';
import { Placeholder } from '@/components/ui/Placeholder';
import { Footer } from '@/components/ui/Footer';

export default function Home() {
  return (
    <SmoothScrollProvider>
      <Header />
      <main>
        <Hero />
        <CasesSection />
        {/* RANDOM sits between WORKS and AWARDS in the nav order (TZ §4). */}
        <Placeholder id="random" label="RANDOM — COMING SOON" />
        <AwardsSection />
        <Placeholder id="life" label="LIFE — COMING SOON" />
      </main>
      <Footer />
    </SmoothScrollProvider>
  );
}
