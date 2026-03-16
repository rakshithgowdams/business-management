import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { APPRAISAL_TYPES, APPRAISAL_STATUSES } from '../../../../lib/hr/constants';
import type { Employee } from '../../../../lib/employees/types';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

export default function AppraisalForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employee_id: '', appraisal_type: 'Salary Increment', status: 'Draft',
    effective_date: '', previous_salary: 0, new_salary: 0,
    increment_percentage: 0, increment_amount: 0,
    previous_role: '', new_role: '', new_department: '',
    bonus_amount: 0, reason: '', notes: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('employees').select('id, full_name, monthly_salary, job_role, department').eq('user_id', user.id).order('full_name').then(({ data }) => setEmployees(data || []));
    if (isEdit) {
      supabase.from('hr_appraisals').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...data, effective_date: data.effective_date || '' });
      });
    }
  }, [id, user]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setForm((p) => ({
        ...p,
        employee_id: empId,
        previous_salary: Number(emp.monthly_salary) || 0,
        previous_role: emp.job_role || '',
      }));
    } else {
      set('employee_id', empId);
    }
  };

  const handleSalaryChange = (newSalary: number) => {
    const pct = form.previous_salary > 0 ? Math.round(((newSalary - form.previous_salary) / form.previous_salary) * 100) : 0;
    const amt = newSalary - form.previous_salary;
    setForm((p) => ({ ...p, new_salary: newSalary, increment_percentage: pct, increment_amount: amt }));
  };

  const handlePctChange = (pct: number) => {
    const newSal = form.previous_salary > 0 ? Math.round(form.previous_salary * (1 + pct / 100)) : 0;
    setForm((p) => ({ ...p, increment_percentage: pct, new_salary: newSal, increment_amount: newSal - p.previous_salary }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.employee_id) { toast.error('Select an employee'); return; }
    setSaving(true);
    const payload = { ...form, user_id: user.id };
    const { error } = isEdit
      ? await supabase.from('hr_appraisals').update(payload).eq('id', id)
      : await supabase.from('hr_appraisals').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Appraisal updated' : 'Appraisal created');
    navigate('..');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('..')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit Appraisal' : 'New Appraisal'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Employee <span className="text-red-400">*</span></label>
              <select value={form.employee_id} onChange={(e) => handleEmployeeChange(e.target.value)} className={inputClass} required>
                <option value="">Select employee...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Appraisal Type</label>
              <select value={form.appraisal_type} onChange={(e) => set('appraisal_type', e.target.value)} className={inputClass}>
                {APPRAISAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {APPRAISAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Effective Date</label>
              <input type="date" value={form.effective_date} onChange={(e) => set('effective_date', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {(form.appraisal_type === 'Salary Increment' || form.appraisal_type === 'Combined') && (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Salary Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Previous Salary</label>
                <input type="number" min={0} value={form.previous_salary} onChange={(e) => set('previous_salary', Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Increment %</label>
                <input type="number" value={form.increment_percentage} onChange={(e) => handlePctChange(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">New Salary</label>
                <input type="number" min={0} value={form.new_salary} onChange={(e) => handleSalaryChange(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Increment Amount</label>
                <div className="px-3 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-emerald-400 text-sm font-medium">
                  +{form.increment_amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        )}

        {(form.appraisal_type === 'Promotion' || form.appraisal_type === 'Role Change' || form.appraisal_type === 'Combined') && (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Role Change</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Previous Role</label>
                <input type="text" value={form.previous_role} onChange={(e) => set('previous_role', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">New Role</label>
                <input type="text" value={form.new_role} onChange={(e) => set('new_role', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">New Department</label>
                <input type="text" value={form.new_department} onChange={(e) => set('new_department', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {(form.appraisal_type === 'Bonus' || form.appraisal_type === 'Combined') && (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Bonus</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Bonus Amount</label>
              <input type="number" min={0} value={form.bonus_amount} onChange={(e) => set('bonus_amount', Number(e.target.value))} className={inputClass} />
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Reason</label>
            <textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={3} className={textareaClass} placeholder="Reason for this appraisal..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={textareaClass} placeholder="Additional notes..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('..')} className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update' : 'Create Appraisal'}
          </button>
        </div>
      </form>
    </div>
  );
}
