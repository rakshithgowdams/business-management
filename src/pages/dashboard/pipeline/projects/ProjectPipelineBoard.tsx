import { useEffect, useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { PROJECT_PIPELINE_STAGES, PROJECT_STAGE_HEADER_COLORS, DEAL_PRIORITY_COLORS } from '../../../../lib/pipeline/constants';
import type { ProjectPipelineEntry, ProjectPipelineDependency, ProjectPipelineMilestone } from '../../../../lib/pipeline/types';
import ProjectKanbanBoard from './ProjectKanbanBoard';
import ProjectPipelineEntryFormModal from './ProjectPipelineEntryFormModal';

export default function ProjectPipelineBoard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ProjectPipelineEntry[]>([]);
  const [milestones, setMilestones] = useState<ProjectPipelineMilestone[]>([]);
  const [dependencies, setDependencies] = useState<ProjectPipelineDependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: ents }, { data: ms }, { data: deps }] = await Promise.all([
      supabase.from('project_pipeline_entries').select('*').eq('user_id', user.id).order('sort_order').order('created_at', { ascending: false }),
      supabase.from('project_pipeline_milestones').select('*').eq('user_id', user.id),
      supabase.from('project_pipeline_dependencies').select('*').eq('user_id', user.id),
    ]);
    const enriched = (ents || []).map((e) => {
      const entryMs = (ms || []).filter((m) => m.entry_id === e.id);
      return { ...e, milestone_count: entryMs.length, milestone_done: entryMs.filter((m) => m.status === 'Completed').length };
    });
    setEntries(enriched);
    setMilestones(ms || []);
    setDependencies(deps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const totalBudget = entries.filter((e) => e.stage !== 'Done').reduce((s, e) => s + e.budget, 0);
  const overdueCount = entries.filter((e) => e.target_end_date && new Date(e.target_end_date) < new Date() && e.stage !== 'Done').length;
  const blockedMilestones = milestones.filter((m) => m.status === 'Blocked').length;

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {PROJECT_PIPELINE_STAGES.map((s) => {
            const cnt = entries.filter((e) => e.stage === s).length;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${PROJECT_STAGE_HEADER_COLORS[s]}`}>{s}</span>
                <span className="text-xs text-gray-500 font-semibold">{cnt}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 gradient-orange text-white text-sm font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><FolderKanban className="w-4 h-4 text-blue-400" /><p className="text-xs text-gray-400">Total Projects</p></div>
          <p className="text-xl font-bold text-white">{entries.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><FolderKanban className="w-4 h-4 text-brand-400" /><p className="text-xs text-gray-400">Pipeline Budget</p></div>
          <p className="text-xl font-bold text-white">{formatINR(totalBudget)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><FolderKanban className="w-4 h-4 text-emerald-400" /><p className="text-xs text-gray-400">Completed</p></div>
          <p className="text-xl font-bold text-emerald-400">{entries.filter((e) => e.stage === 'Done').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><FolderKanban className={`w-4 h-4 ${overdueCount > 0 || blockedMilestones > 0 ? 'text-red-400' : 'text-gray-400'}`} /><p className="text-xs text-gray-400">Issues</p></div>
          <p className={`text-xl font-bold ${overdueCount > 0 || blockedMilestones > 0 ? 'text-red-400' : 'text-gray-400'}`}>{overdueCount + blockedMilestones}</p>
          {(overdueCount > 0 || blockedMilestones > 0) && <p className="text-[10px] text-gray-500">{overdueCount} overdue · {blockedMilestones} blocked</p>}
        </div>
      </div>

      <ProjectKanbanBoard entries={entries} dependencies={dependencies} onRefresh={load} />

      {showForm && <ProjectPipelineEntryFormModal entry={null} onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}
