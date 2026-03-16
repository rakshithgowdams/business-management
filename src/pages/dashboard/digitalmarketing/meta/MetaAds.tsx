import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { CAMPAIGN_STATUS_COLORS, AD_FORMATS_META, CTA_OPTIONS } from '../../../../lib/digitalMarketing/constants';
import type { Ad, Campaign, AdSet } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const ta = `${ic} resize-none`;

const blank = (): Partial<Ad> => ({
  name: '', campaign_id: '', ad_set_id: '', platform: 'meta', ad_format: 'Single Image',
  status: 'Draft', headline: '', primary_text: '', description: '', cta: 'Learn More',
  destination_url: '', media_url: '', media_type: 'image',
  spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, relevance_score: 0, notes: '',
});

export default function MetaAds() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<Ad>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: adsData }, { data: camps }, { data: sets }] = await Promise.all([
      supabase.from('dm_ads').select('*, campaign:dm_campaigns(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('dm_campaigns').select('id, name').eq('user_id', user.id).eq('channel', 'meta'),
      supabase.from('dm_ad_sets').select('id, name').eq('user_id', user.id),
    ]);
    setAds((adsData || []) as Ad[]);
    setCampaigns(camps || []);
    setAdSets(sets || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name?.trim()) { toast.error('Name required'); return; }
    const payload = { ...form, user_id: user.id, platform: 'meta', campaign_id: form.campaign_id || null, ad_set_id: form.ad_set_id || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_ads').insert(payload)
      : await supabase.from('dm_ads').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Ad created' : 'Ad updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_ads').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Ad deleted');
    load();
  };

  const startEdit = (a: Ad) => {
    setForm({ ...a, campaign_id: a.campaign_id || '', ad_set_id: a.ad_set_id || '' });
    setEditId(a.id);
  };

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{ads.length} ads</p>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ad
        </button>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Ad Name</label>
              <input type="text" value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={ic} placeholder="Ad name" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Campaign</label>
              <select value={form.campaign_id || ''} onChange={(e) => set('campaign_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ad Set</label>
              <select value={form.ad_set_id || ''} onChange={(e) => set('ad_set_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {adSets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Format</label>
              <select value={form.ad_format || 'Single Image'} onChange={(e) => set('ad_format', e.target.value)} className={ic}>
                {AD_FORMATS_META.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">CTA</label>
              <select value={form.cta || 'Learn More'} onChange={(e) => set('cta', e.target.value)} className={ic}>
                {CTA_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status || 'Draft'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {['Draft', 'Active', 'Paused', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Headline</label>
              <input type="text" value={form.headline || ''} onChange={(e) => set('headline', e.target.value)} className={ic} placeholder="Ad headline (max 40 chars)" maxLength={80} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Primary Text</label>
              <textarea value={form.primary_text || ''} onChange={(e) => set('primary_text', e.target.value)} rows={3} className={ta} placeholder="Main ad copy..." />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Destination URL</label>
              <input type="text" value={form.destination_url || ''} onChange={(e) => set('destination_url', e.target.value)} className={ic} placeholder="https://..." />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Media URL</label>
              <input type="text" value={form.media_url || ''} onChange={(e) => set('media_url', e.target.value)} className={ic} placeholder="Image or video URL" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {ads.length === 0 && !editId ? (
        <div className="text-center py-12">
          <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No ads created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="glass-card rounded-xl overflow-hidden">
              {ad.media_url && (
                <div className="h-36 bg-dark-700 relative overflow-hidden">
                  <img src={ad.media_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-white text-sm">{ad.name}</p>
                    <p className="text-xs text-gray-400">{ad.ad_format}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded-lg border font-medium ${CAMPAIGN_STATUS_COLORS[ad.status] || ''}`}>{ad.status}</span>
                </div>
                {ad.headline && <p className="text-sm font-semibold text-white mb-1">{ad.headline}</p>}
                {ad.primary_text && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{ad.primary_text}</p>}
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-white/5 pt-3">
                  <div><p className="text-gray-500">Impressions</p><p className="text-white font-medium">{ad.impressions.toLocaleString()}</p></div>
                  <div><p className="text-gray-500">Clicks</p><p className="text-white font-medium">{ad.clicks.toLocaleString()}</p></div>
                  <div><p className="text-gray-500">CTR</p><p className="text-white font-medium">{ad.ctr}%</p></div>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => startEdit(ad)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(ad.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Ad" message="Delete this ad?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
