import { useState, useEffect } from 'react';
import type { WebsiteSection, WebsiteProject, SectionAnimation } from '../../lib/websiteBuilder/types';
import AnimatedSection from './AnimatedSection';
import PublicHeader from './sections/PublicHeader';
import PublicFooter from './sections/PublicFooter';
import PublicHero from './sections/PublicHero';
import PublicServices from './sections/PublicServices';
import PublicAbout from './sections/PublicAbout';
import PublicTeam from './sections/PublicTeam';
import PublicTestimonials from './sections/PublicTestimonials';
import PublicPricing from './sections/PublicPricing';
import PublicFAQ from './sections/PublicFAQ';
import PublicGallery from './sections/PublicGallery';
import PublicBlog from './sections/PublicBlog';
import PublicContact from './sections/PublicContact';
import PublicCTA from './sections/PublicCTA';
import PublicStats from './sections/PublicStats';
import PublicFreeCall from './sections/PublicFreeCall';

const NO_ANIMATE = new Set(['header', 'footer']);
const DEFAULT_ANIMATION: SectionAnimation = { type: 'fadeUp', duration: 600, delay: 0, easing: 'ease-out' };

interface Props {
  sections: WebsiteSection[];
  project: WebsiteProject | null;
}

export default function PublicWebsiteRenderer({ sections, project }: Props) {
  const primary = project?.theme_color || '#f97316';
  const font = project?.font_family || 'Inter';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const googleFontsUrl = font && !['Inter', 'system-ui'].includes(font)
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800&display=swap`
    : null;

  const sorted = [...sections].sort((a, b) => a.order_index - b.order_index);

  const renderSection = (section: WebsiteSection) => {
    const props = { section, project, primary, scrolled };
    switch (section.section_type) {
      case 'header':       return <PublicHeader key={section.id} {...props} />;
      case 'hero':         return <PublicHero key={section.id} {...props} />;
      case 'stats':        return <PublicStats key={section.id} {...props} />;
      case 'services':     return <PublicServices key={section.id} {...props} />;
      case 'about':        return <PublicAbout key={section.id} {...props} />;
      case 'team':         return <PublicTeam key={section.id} {...props} />;
      case 'testimonials': return <PublicTestimonials key={section.id} {...props} />;
      case 'pricing':      return <PublicPricing key={section.id} {...props} />;
      case 'faq':          return <PublicFAQ key={section.id} {...props} />;
      case 'gallery':      return <PublicGallery key={section.id} {...props} />;
      case 'blog':         return <PublicBlog key={section.id} {...props} />;
      case 'contact':      return <PublicContact key={section.id} {...props} />;
      case 'cta':          return <PublicCTA key={section.id} {...props} />;
      case 'free_call':    return <PublicFreeCall key={section.id} {...props} />;
      case 'footer':       return <PublicFooter key={section.id} {...props} />;
      default:             return null;
    }
  };

  return (
    <div style={{ fontFamily: `'${font}', sans-serif` }} className="min-h-screen bg-[#080a0f]">
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
      {project?.custom_css && <style>{project.custom_css}</style>}

      {sorted.map(section => {
        const content = renderSection(section);
        if (!content) return null;
        if (NO_ANIMATE.has(section.section_type)) return content;
        const anim = section.animation || DEFAULT_ANIMATION;
        return (
          <AnimatedSection key={section.id} animation={anim} id={section.section_type}>
            {content}
          </AnimatedSection>
        );
      })}
    </div>
  );
}
