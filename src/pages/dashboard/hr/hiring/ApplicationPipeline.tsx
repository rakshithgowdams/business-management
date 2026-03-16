import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronDown, Star, Phone, Mail, Pencil, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { APPLICATION_STAGES, STAGE_COLORS } from '../../../../lib/hr/constants';
import type { Application } from '../../../../lib/hr/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

export default function ApplicationPipeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('hr_applications')
      .select('*, job_posting:hr_job_postings(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setApps((data || []) as Application[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('hr_applications').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Application deleted');
    load();
  };

  const moveStage = async (appId: string, newStage: string) => {
    await supabase.from('hr_applications').update({ stage: newStage }).eq('id', appId);
    setApps((prev) => prev.map((a) => a.id === appId ? { ...a, stage: newStage } : a));
  };

  const handleDrop = async (stage: string) => {
    if (dragId) {
      await moveStage(dragId, stage);
      setDragId(null);
    }
  };

  const filtered = apps.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.applicant_name.toLowerCase().includes(q) || a.applicant_role.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stageApps = (stage: string) => filtered.filter((a) => a.stage === stage);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Application Pipeline</h2>
          <p className="text-sm text-gray-500">{apps.length} total applications</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants..."
              className="pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 w-56"
            />
          </div>
          <button
            onClick={() => navigate('/dashboard/hr/hiring/applications/new')}
            className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Applicant
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {APPLICATION_STAGES.map((stage) => {
            const stageItems = stageApps(stage);
            return (
              <div
                key={stage}
                className="w-72 flex flex-col gap-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-md border font-medium ${STAGE_COLORS[stage]}`}>
                      {stage}
                    </span>
                    <span className="text-xs text-gray-500">{stageItems.length}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-h-[100px]">
                  {stageItems.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDragId(app.id)}
                      className="glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-white text-sm">{app.applicant_name}</p>
                          <p className="text-xs text-gray-400">{app.applicant_role}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= app.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>

                      {app.job_posting && (
                        <p className="text-xs text-gray-500 mb-2">{(app.job_posting as any).title}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        {app.applicant_email && (
                          <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1 hover:text-white" onClick={(e) => e.stopPropagation()}>
                            <Mail className="w-3 h-3" />
                          </a>
                        )}
                        {app.applicant_phone && (
                          <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1 hover:text-white" onClick={(e) => e.stopPropagation()}>
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                        <span className="ml-auto">{app.source}</span>
                      </div>

                      <div className="flex items-center gap-1 pt-2 border-t border-white/5">
                        <select
                          value={app.stage}
                          onChange={(e) => moveStage(app.id, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {APPLICATION_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          onClick={() => navigate(`applications/${app.id}/edit`)}
                          className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(app.id)}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {stageItems.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-white/5 p-4 text-center">
                      <p className="text-xs text-gray-600">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Application"
        message="Remove this applicant from the pipeline?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
