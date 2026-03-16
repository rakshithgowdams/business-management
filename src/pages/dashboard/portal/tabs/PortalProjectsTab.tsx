import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, FolderKanban, X } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { ClientPortal, PortalSharedProject } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Project { id: string; name: string; status: string; }
interface Props { portal: ClientPortal; }

export default function PortalProjectsTab({ portal }: Props) {
  const { user } = useAuth();
  const [shared, setShared] = useState<PortalSharedProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [showTimeline, setShowTimeline] = useState(true);
  const [showBudget, setShowBudget] = useState(false);
  const [showDeliverables, setShowDeliverables] = useState(true);
  const [showProgress, setShowProgress] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [sRes, pRes] = await Promise.all([
      supabase.from('portal_shared_projects').select('*, projects(id, name, status, budget, start_date, end_date, description)').eq('portal_id', portal.id),
      supabase.from('projects').select('id, name, status').eq('user_id', user.id).order('name'),
    ]);
    setShared((sRes.data || []) as PortalSharedProject[]);
    setProjects((pRes.data || []) as Project[]);
    setLoading(false);
  }, [user, portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!selectedProject || !user) return;
    const exists = shared.find(s => s.project_id === selectedProject);
    if (exists) { toast.error('Project already shared'); return; }

    await supabase.from('portal_shared_projects').insert({
      user_id: user.id, portal_id: portal.id, project_id: selectedProject,
      show_timeline: showTimeline, show_budget: showBudget,
      show_deliverables: showDeliverables, show_progress: showProgress,
    });

    setShowAdd(false);
    setSelectedProject('');
    load();
    toast.success('Project shared');
  };

  const handleRemove = async (id: string) => {
    await supabase.from('portal_shared_projects').delete().eq('id', id);
    setShared(prev => prev.filter(s => s.id !== id));
    toast.success('Removed');
  };

  const toggleVisibility = async (item: PortalSharedProject) => {
    await supabase.from('portal_shared_projects').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setShared(prev => prev.map(s => s.id === item.id ? { ...s, is_visible: !s.is_visible } : s));
  };

  const toggleField = async (item: PortalSharedProject, field: 'show_timeline' | 'show_budget' | 'show_deliverables' | 'show_progress') => {
    const newVal = !item[field];
    await supabase.from('portal_shared_projects').update({ [field]: newVal }).eq('id', item.id);
    setShared(prev => prev.map(s => s.id === item.id ? { ...s, [field]: newVal } : s));
  };

  const availableProjects = projects.filter(p => !shared.find(s => s.project_id === p.id));

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{shared.length} project{shared.length !== 1 ? 's' : ''} shared</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Share Project
        </button>
      </div>

      {shared.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No projects shared</p>
          <p className="text-xs">Link existing projects so clients can track progress</p>
        </div>
      )}

      <div className="space-y-3">
        {shared.map(item => (
          <div key={item.id} className={`bg-dark-800 border rounded-xl p-5 ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h4 className="font-semibold text-sm">{item.projects?.name || 'Unknown Project'}</h4>
                {item.projects?.status && (
                  <span className="text-xs text-gray-400">{item.projects.status}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleVisibility(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400">
                  {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleRemove(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['show_timeline', 'show_budget', 'show_deliverables', 'show_progress'] as const).map(field => (
                <button
                  key={field}
                  onClick={() => toggleField(item, field)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    item[field]
                      ? 'bg-brand-600/10 border-brand-500/30 text-brand-400'
                      : 'bg-dark-700 border-white/[0.06] text-gray-500'
                  }`}
                >
                  {field.replace('show_', '').replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">Share Project</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Select Project</label>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none">
                  <option value="">Choose a project...</option>
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">What should the client see?</label>
                <div className="space-y-2">
                  {[
                    { label: 'Timeline & Milestones', checked: showTimeline, set: setShowTimeline },
                    { label: 'Budget Information', checked: showBudget, set: setShowBudget },
                    { label: 'Deliverables', checked: showDeliverables, set: setShowDeliverables },
                    { label: 'Progress Percentage', checked: showProgress, set: setShowProgress },
                  ].map(opt => (
                    <label key={opt.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700 cursor-pointer">
                      <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)} className="sr-only" />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${opt.checked ? 'bg-brand-500 border-brand-500' : 'border-gray-600'}`}>
                        {opt.checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={handleAdd} disabled={!selectedProject} className="px-5 py-2 rounded-xl gradient-orange text-white text-sm font-medium disabled:opacity-50">Share Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
