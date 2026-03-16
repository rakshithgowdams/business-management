import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { REVIEW_TYPES, REVIEW_STATUSES, RATING_LABELS } from '../../../../lib/hr/constants';
import type { Employee } from '../../../../lib/employees/types';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

function RatingSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="flex flex-col items-center gap-0.5 group">
          <Star className={`w-6 h-6 transition-colors ${s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 group-hover:text-yellow-400/50'}`} />
        </button>
      ))}
      <span className="text-xs text-gray-400 ml-1">{RATING_LABELS[value] || ''}</span>
    </div>
  );
}

export default function ReviewForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employee_id: '', review_period: '', review_type: 'Annual', status: 'Draft',
    overall_rating: 3, performance_score: 0, goals_achieved: 0, kpi_score: 0,
    communication_rating: 3, teamwork_rating: 3, initiative_rating: 3, technical_rating: 3,
    strengths: '', areas_of_improvement: '', reviewer_comments: '', employee_comments: '',
    review_date: '', next_review_date: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('employees').select('id, full_name').eq('user_id', user.id).order('full_name').then(({ data }) => setEmployees(data || []));
    if (isEdit) {
      supabase.from('hr_performance_reviews').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...data, review_date: data.review_date || '', next_review_date: data.next_review_date || '' });
      });
    }
  }, [id, user]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.employee_id) { toast.error('Select an employee'); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      review_date: form.review_date || null,
      next_review_date: form.next_review_date || null,
    };
    const { error } = isEdit
      ? await supabase.from('hr_performance_reviews').update(payload).eq('id', id)
      : await supabase.from('hr_performance_reviews').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Review updated' : 'Review created');
    navigate('..');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('..')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit Review' : 'New Performance Review'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Review Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Employee <span className="text-red-400">*</span></label>
              <select value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} className={inputClass} required>
                <option value="">Select employee...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Review Period</label>
              <input type="text" value={form.review_period} onChange={(e) => set('review_period', e.target.value)} className={inputClass} placeholder="e.g. Q1 2025, FY 2025" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Review Type</label>
              <select value={form.review_type} onChange={(e) => set('review_type', e.target.value)} className={inputClass}>
                {REVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Review Date</label>
              <input type="date" value={form.review_date} onChange={(e) => set('review_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Next Review Date</label>
              <input type="date" value={form.next_review_date} onChange={(e) => set('next_review_date', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-gray-300">Ratings & Scores</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Overall Rating</label>
            <RatingSelector value={form.overall_rating} onChange={(v) => set('overall_rating', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Communication', field: 'communication_rating' },
              { label: 'Teamwork', field: 'teamwork_rating' },
              { label: 'Initiative', field: 'initiative_rating' },
              { label: 'Technical Skills', field: 'technical_rating' },
            ].map((r) => (
              <div key={r.field}>
                <label className="block text-xs text-gray-400 mb-2">{r.label}</label>
                <RatingSelector value={(form as any)[r.field]} onChange={(v) => set(r.field, v)} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Performance Score (%)', field: 'performance_score' },
              { label: 'Goals Achieved (%)', field: 'goals_achieved' },
              { label: 'KPI Score (%)', field: 'kpi_score' },
            ].map((s) => (
              <div key={s.field}>
                <label className="block text-xs text-gray-400 mb-1.5">{s.label}</label>
                <input type="number" min={0} max={100} value={(form as any)[s.field]} onChange={(e) => set(s.field, Number(e.target.value))} className={inputClass} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Feedback</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Strengths</label>
            <textarea value={form.strengths} onChange={(e) => set('strengths', e.target.value)} rows={3} className={textareaClass} placeholder="Key strengths and achievements..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Areas of Improvement</label>
            <textarea value={form.areas_of_improvement} onChange={(e) => set('areas_of_improvement', e.target.value)} rows={3} className={textareaClass} placeholder="Areas to develop or improve..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Reviewer Comments</label>
            <textarea value={form.reviewer_comments} onChange={(e) => set('reviewer_comments', e.target.value)} rows={3} className={textareaClass} placeholder="Reviewer's overall assessment..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Employee Comments</label>
            <textarea value={form.employee_comments} onChange={(e) => set('employee_comments', e.target.value)} rows={3} className={textareaClass} placeholder="Employee's self-assessment..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('..')} className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update Review' : 'Create Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
