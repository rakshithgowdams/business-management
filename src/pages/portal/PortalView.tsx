import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { getPortalData, getStoredPortalSession, validatePortalSession, portalLogout, clearPortalSession, trackDocumentDownload, getDocumentDownloadUrl } from '../../lib/portal/api';
import type { PortalPublicData, PortalSections } from '../../lib/portal/types';
import { usePortalTheme } from '../../context/PortalThemeContext';
import PortalHeroSection from './sections/PortalHeroSection';
import PortalPortfolioSection from './sections/PortalPortfolioSection';
import PortalCaseStudiesSection from './sections/PortalCaseStudiesSection';
import PortalTestimonialsSection from './sections/PortalTestimonialsSection';
import PortalServicesSection from './sections/PortalServicesSection';
import PortalTeamSection from './sections/PortalTeamSection';
import PortalDocumentsSection from './sections/PortalDocumentsSection';
import PortalProjectsSection from './sections/PortalProjectsSection';
import PortalAnnouncementsSection from './sections/PortalAnnouncementsSection';
import PortalFAQSection from './sections/PortalFAQSection';

const SECTION_ORDER: (keyof PortalSections)[] = [
  'announcements', 'portfolio', 'case_studies', 'project_progress', 'services',
  'testimonials', 'team', 'documents', 'faq',
];

const SECTION_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  case_studies: 'Case Studies',
  project_progress: 'Projects',
  services: 'Services',
  testimonials: 'Testimonials',
  team: 'Our Team',
  documents: 'Documents',
  announcements: 'Updates',
  faq: 'FAQ',
};

export default function PortalView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = usePortalTheme();
  const [data, setData] = useState<PortalPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showNav, setShowNav] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [sectionKey, setSectionKey] = useState(0);

  useEffect(() => {
    const init = async () => {
      const stored = getStoredPortalSession();
      if (!stored || stored.slug !== slug) {
        navigate(`/portal/${slug}`, { replace: true });
        return;
      }

      try {
        await validatePortalSession(stored.token);
        const res = await getPortalData(stored.token);
        setData(res.data);

        const sections = res.data.portal.sections as PortalSections;
        const first = SECTION_ORDER.find(s => sections[s]);
        if (first) setActiveSection(first);
      } catch {
        clearPortalSession();
        navigate(`/portal/${slug}`, { replace: true });
      } finally {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      }
    };
    init();
  }, [slug, navigate]);

  const handleLogout = async () => {
    const stored = getStoredPortalSession();
    if (stored) {
      try { await portalLogout(stored.token); } catch { /* */ }
    }
    clearPortalSession();
    navigate(`/portal/${slug}`, { replace: true });
  };

  const trackSection = async (section: string) => {
    const stored = getStoredPortalSession();
    if (!stored) return;
    try { await getPortalData(stored.token, section); } catch { /* */ }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setShowNav(false);
    setSectionKey(k => k + 1);
    trackSection(section);
  };

  const handleDocumentDownload = async (documentId: string): Promise<string | null> => {
    const stored = getStoredPortalSession();
    if (!stored) return null;
    try {
      const [urlRes] = await Promise.all([
        getDocumentDownloadUrl(stored.token, documentId),
        trackDocumentDownload(stored.token, documentId).catch(() => {}),
      ]);
      return urlRes?.url || null;
    } catch {
      return null;
    }
  };

  if (loading || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'currentcolor', borderTopColor: 'transparent' }} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading portal...</p>
        </div>
      </div>
    );
  }

  const { portal, owner } = data;
  const sections = portal.sections;
  const color = portal.color || '#FF6B00';
  const visibleSections = SECTION_ORDER.filter(s => sections[s]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-gray-900/90 border-white/[0.06]' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {portal.logo ? (
                <img src={portal.logo} alt="" className="h-7 sm:h-8 object-contain shrink-0" />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0" style={{ backgroundColor: color }}>
                  {(owner.business_name || portal.name || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-semibold truncate">{portal.name}</h1>
                {owner.business_name && <p className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{owner.business_name}</p>}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {visibleSections.map(s => (
                <button
                  key={s}
                  onClick={() => handleSectionChange(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                    activeSection === s
                      ? 'font-medium shadow-sm'
                      : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  style={activeSection === s ? { backgroundColor: `${color}15`, color } : undefined}
                >
                  {SECTION_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'}`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowNav(!showNav)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  <span className="truncate max-w-[80px]">{SECTION_LABELS[activeSection]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showNav ? 'rotate-180' : ''}`} />
                </button>
                {showNav && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNav(false)} />
                    <div className={`absolute right-0 top-full mt-1 border rounded-xl overflow-hidden shadow-xl min-w-[180px] z-50 ${isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'}`}>
                      {visibleSections.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSectionChange(s)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            activeSection === s
                              ? 'font-medium'
                              : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          style={activeSection === s ? { color, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } : undefined}
                        >
                          {SECTION_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleLogout}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'}`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <PortalHeroSection portal={portal} owner={owner} color={color} />

      <main
        key={sectionKey}
        className={`max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {activeSection === 'announcements' && sections.announcements && (
          <PortalAnnouncementsSection items={data.announcements} color={color} />
        )}
        {activeSection === 'portfolio' && sections.portfolio && (
          <PortalPortfolioSection items={data.portfolio} color={color} />
        )}
        {activeSection === 'case_studies' && sections.case_studies && (
          <PortalCaseStudiesSection items={data.case_studies} color={color} />
        )}
        {activeSection === 'project_progress' && sections.project_progress && (
          <PortalProjectsSection items={data.shared_projects} color={color} />
        )}
        {activeSection === 'services' && sections.services && (
          <PortalServicesSection items={data.services} color={color} />
        )}
        {activeSection === 'testimonials' && sections.testimonials && (
          <PortalTestimonialsSection items={data.testimonials} color={color} />
        )}
        {activeSection === 'team' && sections.team && (
          <PortalTeamSection items={data.team} color={color} />
        )}
        {activeSection === 'documents' && sections.documents && (
          <PortalDocumentsSection items={data.documents} color={color} onDownload={handleDocumentDownload} />
        )}
        {activeSection === 'faq' && sections.faq && (
          <PortalFAQSection items={data.faq} color={color} />
        )}
      </main>

      <footer className={`border-t py-6 sm:py-8 transition-colors duration-300 ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {portal.logo ? (
                <img src={portal.logo} alt="" className="h-6 object-contain opacity-50" />
              ) : (
                <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px] opacity-50" style={{ backgroundColor: color }}>
                  {(owner.business_name || portal.name || '?')[0].toUpperCase()}
                </div>
              )}
              <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {owner.business_name || portal.name}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
              Powered by MyDesignNexus Client Portal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
