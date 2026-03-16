import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { JOB_DEPARTMENTS, EMPLOYMENT_TYPES, WORK_MODES, JOB_STATUSES } from '../../../../lib/hr/constants';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

export default function JobPostingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', department: 'Engineering', employment_type: 'Full-time',
    work_mode: 'On-site', location: '', experience_min: 0, experience_max: 3,
    salary_min: 0, salary_max: 0, openings: 1, deadline: '',
    description: '', requirements: '', responsibilities: '', skills_required: '',
    status: 'Draft',
  });

  useEffect(() => {
    if (isEdit) {
      supabase.from('hr_job_postings').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...data, deadline: data.deadline || '' });
      });
    }
  }, [id]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) { toast.error('Job title is required'); return; }
    setSaving(true);
    const payload = { ...form, user_id: user.id, deadline: form.deadline || null };
    const { error } = isEdit
      ? await supabase.from('hr_job_postings').update(payload).eq('id', id)
      : await supabase.from('hr_job_postings').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Job updated' : 'Job posted');
    navigate('../jobs');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('../jobs')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Job Posting' : 'Post a New Job'}</h2>
          <p className="text-sm text-gray-500">Fill in the details for this opening</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Job Title <span className="text-red-400">*</span></label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="e.g. Senior React Developer" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inputClass}>
                {JOB_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Employment Type</label>
              <select value={form.employment_type} onChange={(e) => set('employment_type', e.target.value)} className={inputClass}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Work Mode</label>
              <select value={form.work_mode} onChange={(e) => set('work_mode', e.target.value)} className={inputClass}>
                {WORK_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Location</label>
              <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} className={inputClass} placeholder="City, State / Remote" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Number of Openings</label>
              <input type="number" min={1} value={form.openings} onChange={(e) => set('openings', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Application Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Experience & Salary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Min Experience (yrs)</label>
              <input type="number" min={0} value={form.experience_min} onChange={(e) => set('experience_min', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Experience (yrs)</label>
              <input type="number" min={0} value={form.experience_max} onChange={(e) => set('experience_max', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Min Salary / mo</label>
              <input type="number" min={0} value={form.salary_min} onChange={(e) => set('salary_min', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Salary / mo</label>
              <input type="number" min={0} value={form.salary_max} onChange={(e) => set('salary_max', Number(e.target.value))} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Job Details</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Job Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className={textareaClass} placeholder="Overview of the role and company..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Key Responsibilities</label>
            <textarea value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} rows={5} className={textareaClass} placeholder="List the key duties and responsibilities..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Requirements</label>
            <textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} rows={5} className={textareaClass} placeholder="Qualifications, certifications, education..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Skills Required</label>
            <input type="text" value={form.skills_required} onChange={(e) => set('skills_required', e.target.value)} className={inputClass} placeholder="React, Node.js, TypeScript, AWS (comma-separated)" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('../jobs')} className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
