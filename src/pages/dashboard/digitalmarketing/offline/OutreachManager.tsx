import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Users, Mail, Phone, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import { OUTREACH_CHANNELS, OUTREACH_STATUSES, OUTREACH_STATUS_COLORS, INDUSTRIES, COMPANY_SIZES } from '../../../../lib/digitalMarketing/constants';
import type { Outreach, Campaign } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const ta = `${ic} resize-none`;

const blank = (): Partial<Outreach> => ({
  company_name: '', contact_name: '', contact_title: '', email: '', phone: '',
  linkedin_url: '', channel: 'Email', status: 'Not Contacted',
  outreach_date: '', follow_up_date: '', deal_value: 0,
  industry: '', company_size: '', notes: '', last_response: '', campaign_id: '',
});

export default function OutreachManager() {
  const { user } = useAuth();
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<Outreach>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');

  const load = async () => {
    if (!user) return;
    const [{ data: out }, { data: camps }] = await Promise.all([
      supabase.from('dm_outreach').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('dm_campaigns').select('id, name').eq('user_id', user.id),
    ]);
    setOutreach((out || []) as Outreach[]);
    setCampaigns(camps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.company_name?.trim()) { toast.error('Company name required'); return; }
    const payload = { ...form, user_id: user.id, campaign_id: form.campaign_id || null, outreach_date: form.outreach_date || null, follow_up_date: form.follow_up_date || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_outreach').insert(payload)
      : await supabase.from('dm_outreach').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Outreach added' : 'Outreach updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_outreach').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Outreach deleted');
    load();
  };

  const startEdit = (o: Outreach) => { setForm({ ...o, outreach_date: o.outreach_date || '', follow_up_date: o.follow_up_date || '', campaign_id: o.campaign_id || '' }); setEditId(o.id); };
  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('dm_outreach').update({ status }).eq('id', id);
    setOutreach((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const filtered = outreach.filter((o) => filterStatus === 'All' || o.status === filterStatus);

  const stats = {
    total: outreach.length,
    active: outreach.filter((o) => !['Won', 'Lost'].includes(o.status)).length,
    won: outreach.filter((o) => o.status === 'Won').length,
    pipeline: outreach.filter((o) => o.status === 'Won').reduce((s, o) => s + o.deal_value, 0),
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Prospects', value: stats.total, color: 'text-blue-400' },
          { label: 'Active', value: stats.active, color: 'text-cyan-400' },
          { label: 'Won', value: stats.won, color: 'text-emerald-400' },
          { label: 'Revenue Won', value: formatINR(stats.pipeline), color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {['All', ...OUTREACH_STATUSES.slice(0, 6)].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterStatus === s ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{s}</button>
          ))}
        </div>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Prospect
        </button>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">{editId === 'new' ? 'Add Prospect' : 'Edit Prospect'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Company Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.company_name || ''} onChange={(e) => set('company_name', e.target.value)} className={ic} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contact Name</label>
              <input type="text" value={form.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} className={ic} placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Title / Designation</label>
              <input type="text" value={form.contact_title || ''} onChange={(e) => set('contact_title', e.target.value)} className={ic} placeholder="CEO, Purchase Manager..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Phone</label>
              <input type="text" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">LinkedIn URL</label>
              <input type="text" value={form.linkedin_url || ''} onChange={(e) => set('linkedin_url', e.target.value)} className={ic} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Channel</label>
              <select value={form.channel || 'Email'} onChange={(e) => set('channel', e.target.value)} className={ic}>
                {OUTREACH_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status || 'Not Contacted'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Industry</label>
              <select value={form.industry || ''} onChange={(e) => set('industry', e.target.value)} className={ic}>
                <option value="">Select...</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Company Size</label>
              <select value={form.company_size || ''} onChange={(e) => set('company_size', e.target.value)} className={ic}>
                <option value="">Select...</option>
                {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Outreach Date</label>
              <input type="date" value={form.outreach_date || ''} onChange={(e) => set('outreach_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Follow-up Date</label>
              <input type="date" value={form.follow_up_date || ''} onChange={(e) => set('follow_up_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Deal Value (₹)</label>
              <input type="number" min={0} value={form.deal_value || 0} onChange={(e) => set('deal_value', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Campaign</label>
              <select value={form.campaign_id || ''} onChange={(e) => set('campaign_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Last Response</label>
              <input type="text" value={form.last_response || ''} onChange={(e) => set('last_response', e.target.value)} className={ic} placeholder="Last response or interaction summary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} className={ta} placeholder="Notes, context, background..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No B2B prospects yet</p>
          <p className="text-sm text-gray-500 mt-1">Track your outbound B2B sales outreach.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{o.company_name}</p>
                    {o.industry && <span className="text-xs text-gray-500">· {o.industry}</span>}
                  </div>
                  <p className="text-sm text-gray-400">{o.contact_name}{o.contact_title ? ` · ${o.contact_title}` : ''}</p>
                  <div className="flex gap-3 mt-1">
                    {o.email && <a href={`mailto:${o.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white"><Mail className="w-3 h-3" /> {o.email}</a>}
                    {o.phone && <a href={`tel:${o.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white"><Phone className="w-3 h-3" /> {o.phone}</a>}
                    {o.linkedin_url && <a href={o.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Linkedin className="w-3 h-3" /></a>}
                  </div>
                  {o.follow_up_date && <p className="text-xs text-amber-400 mt-0.5">Follow-up: {formatDate(o.follow_up_date)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {o.deal_value > 0 && <span className="text-sm font-semibold text-emerald-400">{formatINR(o.deal_value)}</span>}
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="px-2 py-1 text-xs bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none"
                >
                  {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => startEdit(o)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(o.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Prospect" message="Delete this outreach record?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
