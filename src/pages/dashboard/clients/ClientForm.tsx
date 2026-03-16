import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { CLIENT_TYPES, CLIENT_STATUSES, INDUSTRY_TYPES, BUDGET_RANGES, CLIENT_SOURCES } from '../../../lib/clients/constants';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const defaultForm = {
  full_name: '', company_name: '', client_type: 'Individual', status: 'Active', tags: '',
  primary_phone: '', whatsapp_number: '', secondary_phone: '', primary_email: '', secondary_email: '', website: '',
  street_address: '', city: '', state: '', pincode: '', country: 'India',
  gstin: '', pan_number: '', industry_type: '', annual_budget_range: '',
  bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '', upi_id: '',
  internal_notes: '', source: '', referral_name: '',
};

export default function ClientForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);

  useEffect(() => {
    if (isEdit && user) {
      supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (!data) { navigate('/dashboard/clients'); return; }
        setForm({
          full_name: data.full_name || '', company_name: data.company_name || '', client_type: data.client_type || 'Individual',
          status: data.status || 'Active', tags: data.tags || '', primary_phone: data.primary_phone || '',
          whatsapp_number: data.whatsapp_number || '', secondary_phone: data.secondary_phone || '',
          primary_email: data.primary_email || '', secondary_email: data.secondary_email || '', website: data.website || '',
          street_address: data.street_address || '', city: data.city || '', state: data.state || '',
          pincode: data.pincode || '', country: data.country || 'India', gstin: data.gstin || '',
          pan_number: data.pan_number || '', industry_type: data.industry_type || '',
          annual_budget_range: data.annual_budget_range || '', bank_name: data.bank_name || '',
          account_number: data.account_number || '', ifsc_code: data.ifsc_code || '',
          account_holder_name: data.account_holder_name || '', upi_id: data.upi_id || '',
          internal_notes: data.internal_notes || '', source: data.source || '', referral_name: data.referral_name || '',
        });
        if (data.whatsapp_number === data.primary_phone && data.primary_phone) setSameAsPhone(true);
        setLoading(false);
      });
    }
  }, [id, user]);

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    if (!form.primary_phone.trim()) { toast.error('Primary phone is required'); return; }
    if (!form.primary_email.trim()) { toast.error('Primary email is required'); return; }

    setSaving(true);
    const payload = {
      ...form,
      whatsapp_number: sameAsPhone ? form.primary_phone : form.whatsapp_number,
      updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      const { error } = await supabase.from('clients').update(payload).eq('id', id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Client updated');
      navigate(`/dashboard/clients/${id}`);
    } else {
      const { error } = await supabase.from('clients').insert({ ...payload, user_id: user!.id });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Client added');
      navigate('/dashboard/clients');
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
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Client' : 'Add New Client'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Basic Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Full Name *</label><input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Company / Business Name</label><input type="text" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Client Type</label>
              <select value={form.client_type} onChange={(e) => set('client_type', e.target.value)} className={inputClass}>
                {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Tags (comma separated)</label><input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputClass} placeholder="VIP, Repeat, Events" /></div>
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
            <div><label className={labelClass}>Secondary Phone</label><input type="tel" value={form.secondary_phone} onChange={(e) => set('secondary_phone', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Primary Email *</label><input type="email" value={form.primary_email} onChange={(e) => set('primary_email', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Secondary Email</label><input type="email" value={form.secondary_email} onChange={(e) => set('secondary_email', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Website</label><input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className={inputClass} placeholder="https://" /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Address</h2>
          <div><label className={labelClass}>Street Address</label><input type="text" value={form.street_address} onChange={(e) => set('street_address', e.target.value)} className={inputClass} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>City</label><input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>State</label>
              <select value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Pincode</label><input type="text" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Business Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>GSTIN</label><input type="text" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>PAN Number</label><input type="text" value={form.pan_number} onChange={(e) => set('pan_number', e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Industry Type</label>
              <select value={form.industry_type} onChange={(e) => set('industry_type', e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Annual Budget Range</label>
              <select value={form.annual_budget_range} onChange={(e) => set('annual_budget_range', e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Bank Details (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Bank Name</label><input type="text" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Account Number</label><input type="text" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>IFSC Code</label><input type="text" value={form.ifsc_code} onChange={(e) => set('ifsc_code', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Account Holder Name</label><input type="text" value={form.account_holder_name} onChange={(e) => set('account_holder_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>UPI ID</label><input type="text" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Notes</h2>
          <div><label className={labelClass}>Internal Notes</label><textarea value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} rows={3} className={inputClass + ' resize-none'} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>How did they find you?</label>
              <select value={form.source} onChange={(e) => set('source', e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {CLIENT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.source === 'Referral' && (
              <div><label className={labelClass}>Referral Name</label><input type="text" value={form.referral_name} onChange={(e) => set('referral_name', e.target.value)} className={inputClass} /></div>
            )}
          </div>
        </section>

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Add Client'}
        </button>
      </form>
    </div>
  );
}
