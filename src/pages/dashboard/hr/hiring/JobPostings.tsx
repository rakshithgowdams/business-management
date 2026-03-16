import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Briefcase, MapPin, Clock, Users, Pencil, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { JOB_STATUS_COLORS, JOB_STATUSES } from '../../../../lib/hr/constants';
import type { JobPosting } from '../../../../lib/hr/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

export default function JobPostings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('hr_job_postings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('hr_job_postings').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Job posting deleted');
    load();
  };

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = !search || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Job Postings</h2>
          <p className="text-sm text-gray-500">{jobs.length} total postings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dashboard/hr/hiring/pipeline')}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-sm flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Pipeline
          </button>
          <button
            onClick={() => navigate('/dashboard/hr/hiring/jobs/new')}
            className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Post Job
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, department..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="All">All Status</option>
          {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No job postings yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first job posting to start hiring.</p>
          <button onClick={() => navigate('/dashboard/hr/hiring/jobs/new')} className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">
            Post a Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <div key={job.id} className="glass-card rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{job.title}</h3>
                  <p className="text-sm text-gray-400">{job.department}</p>
                </div>
                <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium shrink-0 ${JOB_STATUS_COLORS[job.status] || ''}`}>
                  {job.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Briefcase className="w-3 h-3" /> {job.employment_type}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" /> {job.location || job.work_mode}
                </span>
                {(job.salary_min > 0 || job.salary_max > 0) && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    {formatINR(job.salary_min)} – {formatINR(job.salary_max)} / mo
                  </span>
                )}
              </div>

              {job.openings > 0 && (
                <p className="text-xs text-gray-500">{job.openings} opening{job.openings > 1 ? 's' : ''}</p>
              )}

              <div className="flex items-center gap-1 pt-2 border-t border-white/5">
                <button
                  onClick={() => navigate('/dashboard/hr/hiring/pipeline')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Pipeline
                </button>
                <button
                  onClick={() => navigate(`jobs/${job.id}/edit`)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(job.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Job Posting"
        message="This will permanently delete this job posting and all its applications. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
