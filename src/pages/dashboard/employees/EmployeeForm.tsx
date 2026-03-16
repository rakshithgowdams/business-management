import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES, SALARY_TYPES, PAYMENT_MODES, WORK_LOCATIONS, GENDERS, generateEmployeeCode } from '../../../lib/employees/constants';

const defaultForm = {
  full_name: '', date_of_birth: '', gender: '', blood_group: '', emergency_contact_name: '', emergency_contact_phone: '',
  primary_phone: '', whatsapp_number: '', personal_email: '', work_email: '', current_address: '', city: '', state: '', pincode: '',
  job_role: '', department: 'Development', employment_type: 'Full-time', status: 'Active',
  join_date: new Date().toISOString().split('T')[0], end_date: '', reporting_manager: '', work_location: 'Office',
  salary_type: 'Monthly Fixed', monthly_salary: '', hourly_rate: '', payment_mode: 'Bank Transfer', payment_date: '1', bonus_notes: '',
  bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '', upi_id: '',
  pan_number: '', aadhaar_last4: '', pf_number: '', esi_number: '',
  skills: '', tools_used: '', internal_notes: '', offer_letter_ref: '',
};

export default function EmployeeForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [empCode, setEmpCode] = useState('');

  useEffect(() => {
    if (!user) return;
    if (isEdit) {
      supabase.from('employees').select('*').eq('id', id).eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (!data) { navigate('/dashboard/employees'); return; }
        setEmpCode(data.employee_code || '');
        setForm({
          full_name: data.full_name || '', date_of_birth: data.date_of_birth || '', gender: data.gender || '',
          blood_group: data.blood_group || '', emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '', primary_phone: data.primary_phone || '',
          whatsapp_number: data.whatsapp_number || '', personal_email: data.personal_email || '',
          work_email: data.work_email || '', current_address: data.current_address || '', city: data.city || '',
          state: data.state || '', pincode: data.pincode || '', job_role: data.job_role || '',
          department: data.department || 'Development', employment_type: data.employment_type || 'Full-time',
          status: data.status || 'Active', join_date: data.join_date || '', end_date: data.end_date || '',
          reporting_manager: data.reporting_manager || '', work_location: data.work_location || 'Office',
          salary_type: data.salary_type || 'Monthly Fixed', monthly_salary: String(data.monthly_salary || ''),
          hourly_rate: String(data.hourly_rate || ''), payment_mode: data.payment_mode || 'Bank Transfer',
          payment_date: data.payment_date || '1', bonus_notes: data.bonus_notes || '', bank_name: data.bank_name || '',
          account_number: data.account_number || '', ifsc_code: data.ifsc_code || '',
          account_holder_name: data.account_holder_name || '', upi_id: data.upi_id || '',
          pan_number: data.pan_number || '', aadhaar_last4: data.aadhaar_last4 || '',
          pf_number: data.pf_number || '', esi_number: data.esi_number || '',
          skills: data.skills || '', tools_used: data.tools_used || '',
          internal_notes: data.internal_notes || '', offer_letter_ref: data.offer_letter_ref || '',
        });
        if (data.whatsapp_number === data.primary_phone && data.primary_phone) setSameAsPhone(true);
        setLoading(false);
      });
    } else {
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => {
        setEmpCode(generateEmployeeCode(count || 0));
      });
    }
  }, [id, user]);

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    if (!form.primary_phone.trim()) { toast.error('Primary phone is required'); return; }
    if (!form.personal_email.trim()) { toast.error('Personal email is required'); return; }
    if (!form.job_role.trim()) { toast.error('Job role is required'); return; }

    setSaving(true);
    const payload = {
      ...form,
      whatsapp_number: sameAsPhone ? form.primary_phone : form.whatsapp_number,
      monthly_salary: Number(form.monthly_salary) || 0,
      hourly_rate: Number(form.hourly_rate) || 0,
      date_of_birth: form.date_of_birth || null,
      end_date: form.end_date || null,
      updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      const { error } = await supabase.from('employees').update(payload).eq('id', id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Employee updated');
      navigate(`/dashboard/employees/${id}`);
    } else {
      const { error } = await supabase.from('employees').insert({ ...payload, employee_code: empCode, user_id: user!.id });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Employee added');
      navigate('/dashboard/employees');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const inputClass = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500';
  const labelClass = 'block text-sm text-gray-400 mb-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          {empCode && <p className="text-sm text-gray-500">{empCode}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Personal Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Full Name *</label><input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Blood Group</label><input type="text" value={form.blood_group} onChange={(e) => set('blood_group', e.target.value)} className={inputClass} placeholder="e.g. O+" /></div>
            <div><label className={labelClass}>Emergency Contact Name</label><input type="text" value={form.emergency_contact_name} onChange={(e) => set('emergency_contact_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Emergency Contact Phone</label><input type="tel" value={form.emergency_contact_phone} onChange={(e) => set('emergency_contact_phone', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Contact Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Primary Phone *</label><input type="tel" value={form.primary_phone} onChange={(e) => set('primary_phone', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>WhatsApp Number</label>
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} className="rounded" />
                <span className="text-xs text-gray-500">Same as phone</span>
              </div>
              {!sameAsPhone && <input type="tel" value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} className={inputClass} />}
            </div>
            <div><label className={labelClass}>Personal Email *</label><input type="email" value={form.personal_email} onChange={(e) => set('personal_email', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Work Email</label><input type="email" value={form.work_email} onChange={(e) => set('work_email', e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Current Address</label><input type="text" value={form.current_address} onChange={(e) => set('current_address', e.target.value)} className={inputClass} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>City</label><input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>State</label><input type="text" value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Pincode</label><input type="text" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Employment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Job Role / Designation *</label><input type="text" value={form.job_role} onChange={(e) => set('job_role', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Department</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inputClass}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Employment Type</label>
              <select value={form.employment_type} onChange={(e) => set('employment_type', e.target.value)} className={inputClass}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Join Date *</label><input type="date" value={form.join_date} onChange={(e) => set('join_date', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>End Date</label><input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Reporting Manager</label><input type="text" value={form.reporting_manager} onChange={(e) => set('reporting_manager', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Work Location</label>
              <select value={form.work_location} onChange={(e) => set('work_location', e.target.value)} className={inputClass}>
                {WORK_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Salary & Compensation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Salary Type</label>
              <select value={form.salary_type} onChange={(e) => set('salary_type', e.target.value)} className={inputClass}>
                {SALARY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.salary_type === 'Monthly Fixed' && (
              <div><label className={labelClass}>Monthly Salary (INR)</label><input type="number" value={form.monthly_salary} onChange={(e) => set('monthly_salary', e.target.value)} className={inputClass} /></div>
            )}
            {form.salary_type === 'Hourly Rate' && (
              <div><label className={labelClass}>Hourly Rate (INR)</label><input type="number" value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)} className={inputClass} /></div>
            )}
            <div>
              <label className={labelClass}>Payment Mode</label>
              <select value={form.payment_mode} onChange={(e) => set('payment_mode', e.target.value)} className={inputClass}>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Payment Date (day of month)</label><input type="text" value={form.payment_date} onChange={(e) => set('payment_date', e.target.value)} className={inputClass} placeholder="e.g. 1" /></div>
          </div>
          <div><label className={labelClass}>Bonus / Incentive Notes</label><textarea value={form.bonus_notes} onChange={(e) => set('bonus_notes', e.target.value)} rows={2} className={inputClass + ' resize-none'} /></div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Bank & ID Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Bank Name</label><input type="text" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Account Number</label><input type="text" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>IFSC Code</label><input type="text" value={form.ifsc_code} onChange={(e) => set('ifsc_code', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Account Holder Name</label><input type="text" value={form.account_holder_name} onChange={(e) => set('account_holder_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>UPI ID</label><input type="text" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>PAN Number</label><input type="text" value={form.pan_number} onChange={(e) => set('pan_number', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Aadhaar (last 4 digits)</label><input type="text" maxLength={4} value={form.aadhaar_last4} onChange={(e) => set('aadhaar_last4', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>PF Account Number</label><input type="text" value={form.pf_number} onChange={(e) => set('pf_number', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>ESI Number</label><input type="text" value={form.esi_number} onChange={(e) => set('esi_number', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Skills & Notes</h2>
          <div><label className={labelClass}>Skills (comma separated)</label><input type="text" value={form.skills} onChange={(e) => set('skills', e.target.value)} className={inputClass} placeholder="React, n8n, Video Editing" /></div>
          <div><label className={labelClass}>Tools They Use (comma separated)</label><input type="text" value={form.tools_used} onChange={(e) => set('tools_used', e.target.value)} className={inputClass} placeholder="VS Code, Figma, Canva" /></div>
          <div><label className={labelClass}>Internal Notes</label><textarea value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} rows={3} className={inputClass + ' resize-none'} /></div>
          <div><label className={labelClass}>Offer Letter Reference</label><input type="text" value={form.offer_letter_ref} onChange={(e) => set('offer_letter_ref', e.target.value)} className={inputClass} /></div>
        </section>

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
        </button>
      </form>
    </div>
  );
}
