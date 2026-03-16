import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { getPortalData, getStoredPortalSession, validatePortalSession, portalLogout, clearPortalSession } from '../../lib/portal/api';
import type { PortalPublicData, PortalSections } from '../../lib/portal/types';
import PortalHeroSection from './sections/PortalHeroSection';
import PortalPortfolioSection from './sections/PortalPortfolioSection';
import PortalCaseStudiesSection from './sections/PortalCaseStudiesSection';
import PortalTestimonialsSection from './sections/PortalTestimonialsSection';
import PortalServicesSection from './sections/PortalServicesSection';
import PortalTeamSection from './sections/PortalTeamSection';
import PortalDocumentsSection from './sections/PortalDocumentsSection';
import PortalProjectsSection from './sections/PortalProjectsSection';

const SECTION_ORDER: (keyof PortalSections)[] = [
  'portfolio', 'case_studies', 'project_progress', 'services',
  'testimonials', 'team', 'documents',
];

export default function PortalView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PortalPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showNav, setShowNav] = useState(false);

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
    trackSection(section);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { portal, owner } = data;
  const sections = portal.sections;
  const color = portal.color || '#FF6B00';

  const SECTION_LABELS: Record<string, string> = {
    portfolio: 'Portfolio',
    case_studies: 'Case Studies',
    project_progress: 'Projects',
    services: 'Services',
    testimonials: 'Testimonials',
    team: 'Our Team',
    documents: 'Documents',
  };

  const visibleSections = SECTION_ORDER.filter(s => sections[s]);

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-40 bg-dark-800/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {portal.logo ? (
                <img src={portal.logo} alt="" className="h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: color }}>
                  {(owner.business_name || portal.name || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-sm font-semibold">{portal.name}</h1>
                {owner.business_name && <p className="text-[11px] text-gray-500">{owner.business_name}</p>}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {visibleSections.map(s => (
                <button
                  key={s}
                  onClick={() => handleSectionChange(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeSection === s ? 'text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                  style={activeSection === s ? { backgroundColor: `${color}20`, color } : undefined}
                >
                  {SECTION_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowNav(!showNav)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 text-sm text-gray-300"
                >
                  {SECTION_LABELS[activeSection]}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNav ? 'rotate-180' : ''}`} />
                </button>
                {showNav && (
                  <div className="absolute right-0 top-full mt-1 bg-dark-700 border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[180px] z-50">
                    {visibleSections.map(s => (
                      <button
                        key={s}
                        onClick={() => handleSectionChange(s)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          activeSection === s ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {SECTION_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <PortalHeroSection portal={portal} owner={owner} color={color} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
          <PortalDocumentsSection items={data.documents} color={color} />
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-6">
        <p className="text-center text-xs text-gray-600">
          Powered by MyDesignNexus Client Portal
        </p>
      </footer>
    </div>
  );
}
