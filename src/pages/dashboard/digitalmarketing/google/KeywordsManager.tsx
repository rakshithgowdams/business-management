import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { KEYWORD_MATCH_TYPES } from '../../../../lib/digitalMarketing/constants';
import type { Keyword, Campaign, AdSet } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

const MATCH_COLORS: Record<string, string> = {
  Broad: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  'Broad Match Modifier': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Phrase: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Exact: 'bg-green-500/10 text-green-400 border-green-500/30',
  Negative: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const blank = (): Partial<Keyword> => ({
  keyword: '', campaign_id: '', ad_set_id: '', match_type: 'Broad', status: 'Active',
  bid: 0, quality_score: 0, impressions: 0, clicks: 0, conversions: 0, cost: 0, avg_position: 0,
});

export default function KeywordsManager() {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<Keyword>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterMatch, setFilterMatch] = useState('All');

  const load = async () => {
    if (!user) return;
    const [{ data: kws }, { data: camps }, { data: sets }] = await Promise.all([
      supabase.from('dm_keywords').select('*, campaign:dm_campaigns(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('dm_campaigns').select('id, name').eq('user_id', user.id).eq('channel', 'google'),
      supabase.from('dm_ad_sets').select('id, name').eq('user_id', user.id).eq('platform', 'google'),
    ]);
    setKeywords((kws || []) as Keyword[]);
    setCampaigns(camps || []);
    setAdSets(sets || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.keyword?.trim()) { toast.error('Keyword required'); return; }
    const payload = { ...form, user_id: user.id, campaign_id: form.campaign_id || null, ad_set_id: form.ad_set_id || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_keywords').insert(payload)
      : await supabase.from('dm_keywords').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Keyword added' : 'Keyword updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_keywords').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Keyword deleted');
    load();
  };

  const startEdit = (k: Keyword) => { setForm({ ...k, campaign_id: k.campaign_id || '', ad_set_id: k.ad_set_id || '' }); setEditId(k.id); };
  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const filtered = keywords.filter((k) => filterMatch === 'All' || k.match_type === filterMatch);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {['All', ...KEYWORD_MATCH_TYPES].map((m) => (
            <button key={m} onClick={() => setFilterMatch(m)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterMatch === m ? 'bg-red-600/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{m}</button>
          ))}
        </div>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Keyword
        </button>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Keyword</label>
              <input type="text" value={form.keyword || ''} onChange={(e) => set('keyword', e.target.value)} className={ic} placeholder="e.g. best crm software india" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Match Type</label>
              <select value={form.match_type || 'Broad'} onChange={(e) => set('match_type', e.target.value)} className={ic}>
                {KEYWORD_MATCH_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bid (₹)</label>
              <input type="number" min={0} step="0.01" value={form.bid || 0} onChange={(e) => set('bid', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Campaign</label>
              <select value={form.campaign_id || ''} onChange={(e) => set('campaign_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ad Group</label>
              <select value={form.ad_set_id || ''} onChange={(e) => set('ad_set_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {adSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status || 'Active'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {['Active', 'Paused', 'Removed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Quality Score</label>
              <input type="number" min={1} max={10} value={form.quality_score || 0} onChange={(e) => set('quality_score', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cost (₹)</label>
              <input type="number" min={0} value={form.cost || 0} onChange={(e) => set('cost', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Clicks</label>
              <input type="number" min={0} value={form.clicks || 0} onChange={(e) => set('clicks', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Conversions</label>
              <input type="number" min={0} value={form.conversions || 0} onChange={(e) => set('conversions', Number(e.target.value))} className={ic} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !editId ? (
        <div className="text-center py-12"><Key className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No keywords added yet</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5">{['Keyword', 'Match', 'Status', 'Bid', 'QS', 'Impressions', 'Clicks', 'Cost', 'Conversions', 'Avg Pos', ''].map((h) => <th key={h} className="text-left text-xs text-gray-500 font-medium py-2 px-3 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((k) => (
                <tr key={k.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-mono text-sm text-white">{k.keyword}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 text-[10px] rounded border font-medium ${MATCH_COLORS[k.match_type] || ''}`}>{k.match_type}</span></td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{k.status}</td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(k.bid)}</td>
                  <td className="py-3 px-3">
                    <span className={`font-semibold ${k.quality_score >= 7 ? 'text-emerald-400' : k.quality_score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>{k.quality_score || '—'}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-300">{k.impressions.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-300">{k.clicks.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(k.cost)}</td>
                  <td className="py-3 px-3 text-gray-300">{k.conversions}</td>
                  <td className="py-3 px-3 text-gray-400">{k.avg_position || '—'}</td>
                  <td className="py-3 px-3"><div className="flex gap-1">
                    <button onClick={() => startEdit(k)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(k.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Keyword" message="Delete this keyword?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
