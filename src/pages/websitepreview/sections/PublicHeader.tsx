import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props {
  section: WebsiteSection;
  project: WebsiteProject | null;
  primary: string;
  scrolled: boolean;
}

export default function PublicHeader({ section, project, primary, scrolled }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const links = (c.nav_links as { label: string; href: string }[]) || [];
  const isSticky = c.sticky !== false;
  const isTransparent = c.transparent !== false;
  const showCta = c.show_cta !== false;
  const ctaHref = (c.cta_href as string) || '#contact';
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = (href: string, label: string) => {
    setActiveLink(label);
    setMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else if (href.startsWith('http')) {
      window.open(href, '_blank');
    }
  };

  const handleCta = () => {
    if (ctaHref.startsWith('tel:')) {
      window.location.href = ctaHref;
    } else if (ctaHref.startsWith('#')) {
      const el = document.getElementById(ctaHref.slice(1));
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else {
      window.open(ctaHref, '_blank');
    }
  };

  const headerClasses = isSticky
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? scrolled
            ? 'bg-[#0a0c10]/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/[0.06]'
            : 'bg-transparent'
          : 'bg-[#0a0c10]/95 backdrop-blur-xl border-b border-white/[0.06]'
      }`
    : `relative z-10 transition-all duration-300 ${
        isTransparent ? 'bg-transparent' : 'bg-[#0a0c10] border-b border-white/[0.06]'
      }`;

  return (
    <>
      <header style={{ fontFamily: `'${font}', sans-serif` }} className={headerClasses}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {c.logo_url ? (
              <img src={c.logo_url as string} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span
                style={{ background: `linear-gradient(135deg, ${primary}, ${primary}bb)` }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg"
              >
                B
              </span>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l, i) => (
              <button
                key={i}
                onClick={() => handleNavClick(l.href, l.label)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeLink === l.label ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                }`}
                style={activeLink === l.label ? { color: primary } : {}}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {showCta && (
              <button
                onClick={handleCta}
                style={{ backgroundColor: primary }}
                className="hidden md:block text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
              >
                {(c.cta_text as string) || 'Get Started'}
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-[#0d1117] border-l border-white/[0.08] transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl`}
          style={{ fontFamily: `'${font}', sans-serif` }}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            {c.logo_url ? (
              <img src={c.logo_url as string} alt="Logo" className="h-7 w-auto object-contain" />
            ) : (
              <span style={{ background: `linear-gradient(135deg, ${primary}, ${primary}bb)` }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm">B</span>
            )}
            <button onClick={() => setMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {links.map((l, i) => (
              <button
                key={i}
                onClick={() => handleNavClick(l.href, l.label)}
                className="w-full text-left flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all group"
              >
                <span style={{ backgroundColor: primary }} className="w-1 h-4 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                {l.label}
              </button>
            ))}
          </nav>

          {showCta && (
            <div className="absolute bottom-8 left-4 right-4">
              <button
                onClick={handleCta}
                style={{ backgroundColor: primary }}
                className="w-full text-white text-sm font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
              >
                {(c.cta_text as string) || 'Get Started'}
              </button>
            </div>
          )}
        </div>
      </div>

      {isSticky && <div className="h-[72px]" />}
    </>
  );
}
