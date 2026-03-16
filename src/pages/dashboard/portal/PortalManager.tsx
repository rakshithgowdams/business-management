import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Image, FileText, MessageSquareQuote, Briefcase, Users, FolderKanban, BarChart3, Eye, Megaphone, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { ClientPortal } from '../../../lib/portal/types';
import PortalSettingsTab from './tabs/PortalSettingsTab';
import PortalPortfolioTab from './tabs/PortalPortfolioTab';
import PortalCaseStudiesTab from './tabs/PortalCaseStudiesTab';
import PortalTestimonialsTab from './tabs/PortalTestimonialsTab';
import PortalServicesTab from './tabs/PortalServicesTab';
import PortalTeamTab from './tabs/PortalTeamTab';
import PortalDocumentsTab from './tabs/PortalDocumentsTab';
import PortalProjectsTab from './tabs/PortalProjectsTab';
import PortalAnalyticsTab from './tabs/PortalAnalyticsTab';
import PortalAnnouncementsTab from './tabs/PortalAnnouncementsTab';
import PortalFAQTab from './tabs/PortalFAQTab';

const TABS = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'portfolio', label: 'Portfolio', icon: Image },
  { id: 'case-studies', label: 'Case Studies', icon: FileText },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'documents', label: 'Documents', icon: FolderKanban },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PortalManager() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  const loadPortal = useCallback(async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('client_portals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) { navigate('/dashboard/client-portal'); return; }
    setPortal(data as ClientPortal);
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  if (loading || !portal) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/client-portal')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{portal.portal_name}</h1>
            <p className="text-sm text-gray-400">Manage portal content and settings</p>
          </div>
        </div>
        <a
          href={`${window.location.origin}/portal/${portal.portal_slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview Portal
        </a>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/5 -mx-1 px-1 pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && <PortalSettingsTab portal={portal} onUpdate={loadPortal} />}
      {activeTab === 'portfolio' && <PortalPortfolioTab portal={portal} />}
      {activeTab === 'case-studies' && <PortalCaseStudiesTab portal={portal} />}
      {activeTab === 'testimonials' && <PortalTestimonialsTab portal={portal} />}
      {activeTab === 'services' && <PortalServicesTab portal={portal} />}
      {activeTab === 'team' && <PortalTeamTab portal={portal} />}
      {activeTab === 'documents' && <PortalDocumentsTab portal={portal} />}
      {activeTab === 'projects' && <PortalProjectsTab portal={portal} />}
      {activeTab === 'announcements' && <PortalAnnouncementsTab portal={portal} />}
      {activeTab === 'faq' && <PortalFAQTab portal={portal} />}
      {activeTab === 'analytics' && <PortalAnalyticsTab portal={portal} />}
    </div>
  );
}
