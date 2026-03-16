import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Phone, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { ONBOARDING_STATUS_COLORS, ONBOARDING_TYPE_COLORS, PRIORITY_COLORS, getInitials, getAvatarColor } from '../../../lib/onboarding/constants';
import type { Onboarding, OnboardingChecklist, OnboardingDocument, OnboardingActivity } from '../../../lib/onboarding/types';
import ObOverviewTab from './tabs/ObOverviewTab';
import ObChecklistTab from './tabs/ObChecklistTab';
import ObDocumentsTab from './tabs/ObDocumentsTab';
import ObActivityTab from './tabs/ObActivityTab';

const TABS = ['Overview', 'Checklist', 'Documents', 'Activity'] as const;
type TabType = typeof TABS[number];

export default function OnboardingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ob, setOb] = useState<Onboarding | null>(null);
  const [checklist, setChecklist] = useState<OnboardingChecklist[]>([]);
  const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
  const [activities, setActivities] = useState<OnboardingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  const loadAll = useCallback(async () => {
    if (!user || !id) return;
    const [oRes, clRes, dRes, aRes] = await Promise.all([
      supabase.from('onboardings').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('onboarding_checklist').select('*').eq('onboarding_id', id).order('sort_order'),
      supabase.from('onboarding_documents').select('*').eq('onboarding_id', id).order('created_at', { ascending: false }),
      supabase.from('onboarding_activities').select('*').eq('onboarding_id', id).order('activity_date', { ascending: false }),
    ]);
    if (!oRes.data) { navigate('/dashboard/onboarding'); return; }
    setOb(oRes.data as Onboarding);
    setChecklist((clRes.data || []) as OnboardingChecklist[]);
    setDocuments((dRes.data || []) as OnboardingDocument[]);
    setActivities((aRes.data || []) as OnboardingActivity[]);
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading || !ob) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/dashboard/onboarding')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white mt-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(ob.full_name)} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
            {getInitials(ob.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{ob.full_name}</h1>
            <p className="text-gray-400">{ob.role}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-md border ${ONBOARDING_TYPE_COLORS[ob.onboarding_type] || ''}`}>{ob.onboarding_type}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${ONBOARDING_STATUS_COLORS[ob.status] || ''}`}>{ob.status}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${PRIORITY_COLORS[ob.priority] || ''}`}>{ob.priority}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {ob.phone && (
            <a href={`tel:${ob.phone}`} className="p-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Call"><Phone className="w-5 h-5" /></a>
          )}
          {ob.email && (
            <a href={`mailto:${ob.email}`} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Email"><Mail className="w-5 h-5" /></a>
          )}
          <button onClick={() => navigate(`/dashboard/onboarding/${id}/edit`)} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/5 -mx-1 px-1">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >{tab}</button>
        ))}
      </div>

      {activeTab === 'Overview' && <ObOverviewTab ob={ob} checklist={checklist} documents={documents} activities={activities} />}
      {activeTab === 'Checklist' && <ObChecklistTab obId={ob.id} checklist={checklist} onRefresh={loadAll} />}
      {activeTab === 'Documents' && <ObDocumentsTab obId={ob.id} documents={documents} onRefresh={loadAll} />}
      {activeTab === 'Activity' && <ObActivityTab obId={ob.id} activities={activities} onRefresh={loadAll} />}
    </div>
  );
}
