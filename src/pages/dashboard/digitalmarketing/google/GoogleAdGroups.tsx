import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { CAMPAIGN_STATUS_COLORS, BID_STRATEGIES_GOOGLE } from '../../../../lib/digitalMarketing/constants';
import type { AdSet, Campaign } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

const blank = (): Partial<AdSet> => ({
  name: '', campaign_id: '', platform: 'google', status: 'Draft',
  daily_budget: 0, lifetime_budget: 0, bid_strategy: 'Maximize Clicks', bid_amount: 0,
  targeting_age_min: 18, targeting_age_max: 65, targeting_genders: 'All',
  targeting_locations: '', targeting_interests: '',
  spend: 0, impressions: 0, clicks: 0, conversions: 0,
});

export default function GoogleAdGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<AdSet[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<AdSet>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: grps }, { data: camps }] = await Promise.all([
      supabase.from('dm_ad_sets').select('*, campaign:dm_campaigns(name)').eq('user_id', user.id).eq('platform', 'google').order('created_at', { ascending: false }),
      supabase.from('dm_campaigns').select('id, name').eq('user_id', user.id).eq('channel', 'google'),
    ]);
    setGroups((grps || []) as AdSet[]);
    setCampaigns(camps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name?.trim()) { toast.error('Name required'); return; }
    const payload = { ...form, user_id: user.id, platform: 'google', campaign_id: form.campaign_id || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_ad_sets').insert(payload)
      : await supabase.from('dm_ad_sets').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Ad group created' : 'Ad group updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_ad_sets').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Ad group deleted');
    load();
  };

  const startEdit = (s: AdSet) => { setForm({ ...s, campaign_id: s.campaign_id || '' }); setEditId(s.id); };
  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{groups.length} ad groups</p>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ad Group
        </button>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Ad Group Name</label>
              <input type="text" value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={ic} placeholder="e.g. Brand Keywords" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Campaign</label>
              <select value={form.campaign_id || ''} onChange={(e) => set('campaign_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bid Strategy</label>
              <select value={form.bid_strategy || 'Maximize Clicks'} onChange={(e) => set('bid_strategy', e.target.value)} className={ic}>
                {BID_STRATEGIES_GOOGLE.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Default Bid (₹)</label>
              <input type="number" min={0} value={form.bid_amount || 0} onChange={(e) => set('bid_amount', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status || 'Draft'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {['Draft', 'Active', 'Paused', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Locations</label>
              <input type="text" value={form.targeting_locations || ''} onChange={(e) => set('targeting_locations', e.target.value)} className={ic} placeholder="India, Mumbai..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {groups.length === 0 && !editId ? (
        <div className="text-center py-12"><Type className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No ad groups yet</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5">{['Ad Group', 'Campaign', 'Status', 'Bid Strategy', 'Default Bid', 'Spend', 'Clicks', ''].map((h) => <th key={h} className="text-left text-xs text-gray-500 font-medium py-2 px-3 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-medium text-white">{g.name}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{(g.campaign as any)?.name || '—'}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 text-[10px] rounded-lg border font-medium ${CAMPAIGN_STATUS_COLORS[g.status] || ''}`}>{g.status}</span></td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{g.bid_strategy}</td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(g.bid_amount)}</td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(g.spend)}</td>
                  <td className="py-3 px-3 text-gray-300">{g.clicks.toLocaleString()}</td>
                  <td className="py-3 px-3"><div className="flex gap-1">
                    <button onClick={() => startEdit(g)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(g.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Ad Group" message="Delete this ad group?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
