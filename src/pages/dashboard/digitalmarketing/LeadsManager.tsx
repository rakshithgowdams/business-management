import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Users, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR, formatDate } from '../../../lib/format';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_STATUS_COLORS } from '../../../lib/digitalMarketing/constants';
import type { Lead, Campaign } from '../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const ta = `${ic} resize-none`;

const blank = (): Partial<Lead> => ({
  name: '', company: '', email: '', phone: '', source: 'Meta Ads',
  status: 'New', deal_value: 0, notes: '', follow_up_date: '', campaign_id: '',
});

export default function LeadsManager() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<Lead>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');

  const load = async () => {
    if (!user) return;
    const [{ data: ls }, { data: camps }] = await Promise.all([
      supabase.from('dm_leads').select('*, campaign:dm_campaigns(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('dm_campaigns').select('id, name').eq('user_id', user.id),
    ]);
    setLeads((ls || []) as Lead[]);
    setCampaigns(camps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name?.trim()) { toast.error('Lead name required'); return; }
    const payload = { ...form, user_id: user.id, campaign_id: form.campaign_id || null, follow_up_date: form.follow_up_date || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_leads').insert(payload)
      : await supabase.from('dm_leads').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Lead added' : 'Lead updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_leads').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Lead deleted');
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('dm_leads').update({ status }).eq('id', id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  };

  const startEdit = (l: Lead) => { setForm({ ...l, follow_up_date: l.follow_up_date || '', campaign_id: l.campaign_id || '' }); setEditId(l.id); };
  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const filtered = leads.filter((l) => filterStatus === 'All' || l.status === filterStatus);

  const stats = {
    total: leads.length,
    converted: leads.filter((l) => l.status === 'Converted').length,
    pipeline: leads.filter((l) => !['Converted', 'Lost'].includes(l.status)).reduce((s, l) => s + l.deal_value, 0),
    won: leads.filter((l) => l.status === 'Converted').reduce((s, l) => s + l.deal_value, 0),
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Leads</h2>
          <p className="text-sm text-gray-500">{leads.length} total leads from all marketing channels</p>
        </div>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Converted', value: stats.converted, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pipeline Value', value: formatINR(stats.pipeline), color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Won Revenue', value: formatINR(stats.won), color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-lg font-bold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={ic} placeholder="Lead name" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Company</label>
              <input type="text" value={form.company || ''} onChange={(e) => set('company', e.target.value)} className={ic} />
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
              <label className="block text-xs text-gray-400 mb-1.5">Source</label>
              <select value={form.source || 'Meta Ads'} onChange={(e) => set('source', e.target.value)} className={ic}>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status || 'New'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Deal Value (₹)</label>
              <input type="number" min={0} value={form.deal_value || 0} onChange={(e) => set('deal_value', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Follow-up Date</label>
              <input type="date" value={form.follow_up_date || ''} onChange={(e) => set('follow_up_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Campaign</label>
              <select value={form.campaign_id || ''} onChange={(e) => set('campaign_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} className={ta} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {['All', ...LEAD_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12"><Users className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No leads found</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <div key={lead.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {lead.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">{lead.name}</p>
                    {lead.company && <span className="text-xs text-gray-500">· {lead.company}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {lead.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                    {lead.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  </div>
                  <div className="flex gap-2 mt-0.5 text-xs text-gray-500">
                    <span>{lead.source}</span>
                    {lead.follow_up_date && <span className="text-amber-400">Follow-up: {formatDate(lead.follow_up_date)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lead.deal_value > 0 && <span className="text-sm font-semibold text-emerald-400">{formatINR(lead.deal_value)}</span>}
                <select value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)} className="px-2 py-1 text-xs bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none">
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => startEdit(lead)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(lead.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Lead" message="Delete this lead?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
