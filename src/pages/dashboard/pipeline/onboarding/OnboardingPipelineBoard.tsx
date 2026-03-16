import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { ONBOARDING_PIPELINE_STAGES, ONBOARDING_STAGE_HEADER_COLORS } from '../../../../lib/pipeline/constants';
import type { OnboardingPipelineEntry, OnboardingStageChecklist } from '../../../../lib/pipeline/types';
import OnboardingKanbanBoard from './OnboardingKanbanBoard';
import OnboardingEntryFormModal from './OnboardingEntryFormModal';

export default function OnboardingPipelineBoard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<OnboardingPipelineEntry[]>([]);
  const [checklists, setChecklists] = useState<OnboardingStageChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: ents }, { data: checks }] = await Promise.all([
      supabase.from('onboarding_pipeline_entries').select('*').eq('user_id', user.id).order('sort_order').order('created_at', { ascending: false }),
      supabase.from('onboarding_pipeline_stage_checklist').select('*').eq('user_id', user.id),
    ]);
    setEntries(ents || []);
    setChecklists(checks || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const stageCount = ONBOARDING_PIPELINE_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = entries.filter((e) => e.current_stage === s).length;
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_PIPELINE_STAGES.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${ONBOARDING_STAGE_HEADER_COLORS[s]}`}>{s}</span>
              <span className="text-xs text-gray-500 font-semibold">{stageCount[s] || 0}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 gradient-orange text-white text-sm font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-400" /><p className="text-xs text-gray-400">Total in Pipeline</p></div>
          <p className="text-xl font-bold text-white">{entries.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-emerald-400" /><p className="text-xs text-gray-400">Completed</p></div>
          <p className="text-xl font-bold text-emerald-400">{stageCount['Complete'] || 0}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-amber-400" /><p className="text-xs text-gray-400">Active</p></div>
          <p className="text-xl font-bold text-amber-400">{entries.filter((e) => e.current_stage !== 'Complete').length}</p>
        </div>
      </div>

      <OnboardingKanbanBoard entries={entries} checklists={checklists} onRefresh={load} />

      {showForm && <OnboardingEntryFormModal entry={null} onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}
