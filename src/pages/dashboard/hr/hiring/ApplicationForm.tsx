import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { APPLICATION_STAGES, APPLICATION_SOURCES } from '../../../../lib/hr/constants';
import type { JobPosting } from '../../../../lib/hr/types';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

export default function ApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [form, setForm] = useState({
    applicant_name: '', applicant_email: '', applicant_phone: '',
    applicant_role: '', source: 'LinkedIn', job_posting_id: '',
    resume_url: '', portfolio_url: '', linkedin_url: '',
    cover_letter: '', stage: 'Applied', status: 'Active',
    rating: 3, expected_salary: 0, offered_salary: 0,
    interviewer_notes: '', joining_date: '', offer_date: '',
    rejection_reason: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('hr_job_postings').select('id, title').eq('user_id', user.id).eq('status', 'Active').then(({ data }) => setJobs(data || []));
    if (isEdit) {
      supabase.from('hr_applications').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({
          ...data,
          job_posting_id: data.job_posting_id || '',
          joining_date: data.joining_date || '',
          offer_date: data.offer_date || '',
        });
      });
    }
  }, [id, user]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.applicant_name.trim()) { toast.error('Applicant name is required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      job_posting_id: form.job_posting_id || null,
      joining_date: form.joining_date || null,
      offer_date: form.offer_date || null,
    };
    const { error } = isEdit
      ? await supabase.from('hr_applications').update(payload).eq('id', id)
      : await supabase.from('hr_applications').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Application updated' : 'Applicant added');
    navigate('../pipeline');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('../pipeline')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Application' : 'Add Applicant'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Applicant Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.applicant_name} onChange={(e) => set('applicant_name', e.target.value)} className={inputClass} placeholder="Applicant's full name" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Role Applied For</label>
              <input type="text" value={form.applicant_role} onChange={(e) => set('applicant_role', e.target.value)} className={inputClass} placeholder="e.g. Frontend Developer" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input type="email" value={form.applicant_email} onChange={(e) => set('applicant_email', e.target.value)} className={inputClass} placeholder="applicant@email.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Phone</label>
              <input type="text" value={form.applicant_phone} onChange={(e) => set('applicant_phone', e.target.value)} className={inputClass} placeholder="+91 9800000000" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Linked Job Posting</label>
              <select value={form.job_posting_id} onChange={(e) => set('job_posting_id', e.target.value)} className={inputClass}>
                <option value="">— None —</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Source</label>
              <select value={form.source} onChange={(e) => set('source', e.target.value)} className={inputClass}>
                {APPLICATION_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Resume URL</label>
              <input type="text" value={form.resume_url} onChange={(e) => set('resume_url', e.target.value)} className={inputClass} placeholder="https://drive.google.com/..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">LinkedIn Profile</label>
              <input type="text" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Pipeline Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Stage</label>
              <select value={form.stage} onChange={(e) => set('stage', e.target.value)} className={inputClass}>
                {APPLICATION_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Rating (1–5)</label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('rating', s)}
                    className="p-0.5"
                  >
                    <Star className={`w-6 h-6 transition-colors ${s <= form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Expected Salary / mo</label>
              <input type="number" min={0} value={form.expected_salary} onChange={(e) => set('expected_salary', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Offered Salary / mo</label>
              <input type="number" min={0} value={form.offered_salary} onChange={(e) => set('offered_salary', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Offer Date</label>
              <input type="date" value={form.offer_date} onChange={(e) => set('offer_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Expected Joining Date</label>
              <input type="date" value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Interviewer Notes</label>
            <textarea value={form.interviewer_notes} onChange={(e) => set('interviewer_notes', e.target.value)} rows={4} className={textareaClass} placeholder="Notes from interviews, technical rounds, etc." />
          </div>
          {form.stage === 'Rejected' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Rejection Reason</label>
              <input type="text" value={form.rejection_reason} onChange={(e) => set('rejection_reason', e.target.value)} className={inputClass} />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('../pipeline')} className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Applicant'}
          </button>
        </div>
      </form>
    </div>
  );
}
