import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Calendar, Link2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import { MILESTONE_STATUSES, MILESTONE_STATUS_COLORS, PROJECT_PIPELINE_STAGES, PROJECT_STAGE_HEADER_COLORS } from '../../../../lib/pipeline/constants';
import type { ProjectPipelineEntry, ProjectPipelineMilestone, ProjectPipelineDependency } from '../../../../lib/pipeline/types';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

interface Props {
  entry: ProjectPipelineEntry;
  allEntries: ProjectPipelineEntry[];
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function ProjectPipelineEntryDetailModal({ entry, allEntries, onClose, onEdit, onRefresh }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'milestones' | 'dependencies' | 'notes'>('milestones');
  const [milestones, setMilestones] = useState<ProjectPipelineMilestone[]>([]);
  const [dependencies, setDependencies] = useState<ProjectPipelineDependency[]>([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mForm, setMForm] = useState({ title: '', due_date: '', status: 'Pending', description: '' });
  const [notes, setNotes] = useState(entry.notes || '');
  const [selectedDep, setSelectedDep] = useState('');

  const loadData = async () => {
    const [{ data: ms }, { data: deps }] = await Promise.all([
      supabase.from('project_pipeline_milestones').select('*').eq('entry_id', entry.id).order('sort_order').order('created_at'),
      supabase.from('project_pipeline_dependencies').select('*').eq('entry_id', entry.id),
    ]);
    setMilestones(ms || []);
    setDependencies(deps || []);
  };

  useEffect(() => { loadData(); }, [entry.id]);

  const addMilestone = async () => {
    if (!user || !mForm.title.trim()) { toast.error('Title required'); return; }
    const { data } = await supabase.from('project_pipeline_milestones').insert({ entry_id: entry.id, user_id: user.id, ...mForm, due_date: mForm.due_date || null, sort_order: milestones.length }).select().maybeSingle();
    if (data) setMilestones((p) => [...p, data]);
    setMForm({ title: '', due_date: '', status: 'Pending', description: '' });
    setShowAddMilestone(false);
  };

  const updateMilestoneStatus = async (id: string, status: string) => {
    await supabase.from('project_pipeline_milestones').update({ status }).eq('id', id);
    setMilestones((p) => p.map((m) => m.id === id ? { ...m, status } : m));
  };

  const deleteMilestone = async (id: string) => {
    await supabase.from('project_pipeline_milestones').delete().eq('id', id);
    setMilestones((p) => p.filter((m) => m.id !== id));
  };

  const addDependency = async () => {
    if (!user || !selectedDep) return;
    const { error } = await supabase.from('project_pipeline_dependencies').insert({ entry_id: entry.id, depends_on_id: selectedDep, user_id: user.id });
    if (error) { toast.error('Could not add dependency'); return; }
    setSelectedDep('');
    loadData();
  };

  const removeDependency = async (id: string) => {
    await supabase.from('project_pipeline_dependencies').delete().eq('id', id);
    setDependencies((p) => p.filter((d) => d.id !== id));
  };

  const saveNotes = async () => {
    await supabase.from('project_pipeline_entries').update({ notes }).eq('id', entry.id);
    toast.success('Notes saved');
    onRefresh();
  };

  const doneCount = milestones.filter((m) => m.status === 'Completed').length;
  const totalCount = milestones.length;
  const blockedCount = milestones.filter((m) => m.status === 'Blocked').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-[500px] max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-dark-800 z-10">
          <div>
            <h2 className="text-base font-semibold">{entry.title}</h2>
            {entry.client_name && <p className="text-xs text-gray-400 mt-0.5">{entry.client_name}</p>}
          </div>
          <div className="flex gap-2 shrink-0 ml-3">
            <button onClick={onEdit} className="px-3 py-1 text-xs rounded-lg border border-white/10 hover:bg-white/5 text-gray-300">Edit</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-5 pt-3 pb-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded font-medium ${PROJECT_STAGE_HEADER_COLORS[entry.stage]}`}>{entry.stage}</span>
            {entry.budget > 0 && <span className="text-gray-400">Budget: {formatINR(entry.budget)}</span>}
            {entry.target_end_date && <span className={`flex items-center gap-1 ${new Date(entry.target_end_date) < new Date() && entry.stage !== 'Done' ? 'text-red-400' : 'text-gray-400'}`}><Calendar className="w-3 h-3" />{formatDate(entry.target_end_date)}</span>}
            {totalCount > 0 && <span className="text-gray-400">{doneCount}/{totalCount} milestones</span>}
          </div>
        </div>

        <div className="flex gap-1 px-5 pb-2 border-b border-white/5">
          {(['milestones', 'dependencies', 'notes'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${tab === t ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{t}</button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'milestones' && (
            <>
              {blockedCount > 0 && (
                <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{blockedCount} milestone{blockedCount > 1 ? 's' : ''} blocked</p>
                </div>
              )}

              <div className="space-y-2">
                {milestones.map((m) => {
                  const isOverdue = m.due_date && new Date(m.due_date) < new Date() && m.status !== 'Completed';
                  return (
                    <div key={m.id} className="flex items-start gap-2 p-3 bg-dark-700/30 rounded-xl group">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${m.status === 'Completed' ? 'line-through text-gray-500' : 'text-white'}`}>{m.title}</p>
                        {m.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{m.description}</p>}
                        {m.due_date && <p className={`text-[10px] mt-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>{formatDate(m.due_date)}{isOverdue ? ' — Overdue' : ''}</p>}
                      </div>
                      <select value={m.status} onChange={(e) => updateMilestoneStatus(m.id, e.target.value)} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium bg-transparent cursor-pointer ${MILESTONE_STATUS_COLORS[m.status]}`}>
                        {MILESTONE_STATUSES.map((s) => <option key={s} value={s} className="bg-dark-800 text-white">{s}</option>)}
                      </select>
                      <button onClick={() => deleteMilestone(m.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {showAddMilestone ? (
                <div className="p-3 bg-dark-700/30 rounded-xl space-y-2 border border-white/5">
                  <input value={mForm.title} onChange={(e) => setMForm((p) => ({ ...p, title: e.target.value }))} placeholder="Milestone title" className={ic} autoFocus />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={mForm.due_date} onChange={(e) => setMForm((p) => ({ ...p, due_date: e.target.value }))} className={ic} />
                    <select value={mForm.status} onChange={(e) => setMForm((p) => ({ ...p, status: e.target.value }))} className={ic}>
                      {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <textarea value={mForm.description} onChange={(e) => setMForm((p) => ({ ...p, description: e.target.value }))} rows={1} placeholder="Description (optional)" className={`${ic} resize-none`} />
                  <div className="flex gap-2">
                    <button onClick={addMilestone} className="px-3 py-1.5 gradient-orange text-white text-xs rounded-lg font-medium">Add</button>
                    <button onClick={() => setShowAddMilestone(false)} className="px-3 py-1.5 border border-white/10 text-xs rounded-lg text-gray-400">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddMilestone(true)} className="w-full py-2 rounded-lg border border-dashed border-white/10 text-xs text-gray-500 hover:text-gray-300 hover:border-white/20 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Add Milestone
                </button>
              )}
            </>
          )}

          {tab === 'dependencies' && (
            <div className="space-y-3">
              <div className="space-y-2">
                {dependencies.map((dep) => {
                  const depEntry = allEntries.find((e) => e.id === dep.depends_on_id);
                  return (
                    <div key={dep.id} className="flex items-center gap-2 p-2 bg-dark-700/30 rounded-xl">
                      <Link2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{depEntry?.title || 'Unknown'}</p>
                        {depEntry && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PROJECT_STAGE_HEADER_COLORS[depEntry.stage]}`}>{depEntry.stage}</span>}
                      </div>
                      <button onClick={() => removeDependency(dep.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })}
                {dependencies.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No dependencies</p>}
              </div>
              <div className="flex gap-2">
                <select value={selectedDep} onChange={(e) => setSelectedDep(e.target.value)} className={`${ic} flex-1`}>
                  <option value="">Select project to depend on...</option>
                  {allEntries.filter((e) => e.id !== entry.id && !dependencies.some((d) => d.depends_on_id === e.id)).map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
                <button onClick={addDependency} disabled={!selectedDep} className="px-4 py-2 gradient-orange text-white text-sm rounded-xl disabled:opacity-40">Add</button>
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Project notes..." className={`${ic} resize-none`} />
              <button onClick={saveNotes} className="px-4 py-2 gradient-orange text-white text-sm font-semibold rounded-xl">Save Notes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
