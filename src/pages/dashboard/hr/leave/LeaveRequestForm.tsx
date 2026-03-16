import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { LeaveType, Employee } from '../../../../lib/hr/types';
import type { Employee as Emp } from '../../../../lib/employees/types';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

function getDaysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diff);
}

export default function LeaveRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [form, setForm] = useState({
    employee_id: '', leave_type_id: '', start_date: '', end_date: '',
    reason: '', is_half_day: false, half_day_session: 'Morning',
    status: 'Pending',
  });

  const days = form.is_half_day ? 0.5 : getDaysBetween(form.start_date, form.end_date);

  useEffect(() => {
    if (!user) return;
    supabase.from('hr_leave_types').select('*').eq('user_id', user.id).eq('is_active', true).then(({ data }) => setLeaveTypes(data || []));
    supabase.from('employees').select('id, full_name').eq('user_id', user.id).order('full_name').then(({ data }) => setEmployees(data || []));
    if (isEdit) {
      supabase.from('hr_leave_requests').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...data });
      });
    }
  }, [id, user]);

  const set = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.employee_id) { toast.error('Select an employee'); return; }
    if (!form.leave_type_id) { toast.error('Select a leave type'); return; }
    if (!form.start_date) { toast.error('Select a start date'); return; }
    setSaving(true);
    const payload = { ...form, user_id: user.id, days_requested: days };
    const { error } = isEdit
      ? await supabase.from('hr_leave_requests').update(payload).eq('id', id)
      : await supabase.from('hr_leave_requests').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Leave request updated' : 'Leave request submitted');
    navigate('..');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('..')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit Leave Request' : 'Request Leave'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Employee <span className="text-red-400">*</span></label>
              <select value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} className={inputClass} required>
                <option value="">Select employee...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Leave Type <span className="text-red-400">*</span></label>
              <select value={form.leave_type_id} onChange={(e) => set('leave_type_id', e.target.value)} className={inputClass} required>
                <option value="">Select leave type...</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputClass} disabled={form.is_half_day} />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_half_day}
                  onChange={(e) => {
                    set('is_half_day', e.target.checked);
                    if (e.target.checked) set('end_date', form.start_date);
                  }}
                  className="rounded border-white/20"
                />
                <span className="text-sm text-gray-300">Half Day</span>
              </label>
              {form.is_half_day && (
                <select value={form.half_day_session} onChange={(e) => set('half_day_session', e.target.value)} className="px-3 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-white text-sm">
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                </select>
              )}
            </div>

            {days > 0 && (
              <div className="px-3 py-2 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                <p className="text-xs text-brand-400 font-medium">{days} day{days !== 1 ? 's' : ''} requested</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Reason</label>
            <textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={3} className={textareaClass} placeholder="Reason for leave..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('..')} className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
