import { SiteHeader } from '@/components/header/SiteHeader';
import { Hero } from '@/components/hero/Hero';
import { CaseShowcase } from '@/components/showcase/CaseShowcase';
import { AboutAwards } from '@/components/about/AboutAwards';
import { RandomCollage } from '@/components/random/RandomCollage';
import { Outro } from '@/components/outro/Outro';
import { CaseLayer } from '@/components/case/CaseLayer';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

export default function Home() {
  return (
    <SmoothScrollProvider>
      <SiteHeader />
      <main>
        <Hero />
        <CaseShowcase />
        <AboutAwards />
        <RandomCollage />
        <Outro />
      </main>
      {/* A case opens over the page, out of its card. */}
      <CaseLayer />
    </SmoothScrollProvider>
  );
}
