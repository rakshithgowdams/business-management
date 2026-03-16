import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { CHANNEL_LABELS, CAMPAIGN_OBJECTIVES, CAMPAIGN_STATUSES } from '../../../lib/digitalMarketing/constants';
import type { Campaign } from '../../../lib/digitalMarketing/types';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

interface Props {
  campaign: Campaign | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CampaignFormModal({ campaign, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', channel: 'meta', objective: 'Awareness', status: 'Draft',
    start_date: '', end_date: '', budget: 0, spend: 0,
    impressions: 0, clicks: 0, conversions: 0, revenue: 0,
    cpc: 0, ctr: 0, roas: 0, target_audience: '', notes: '',
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name,
        channel: campaign.channel,
        objective: campaign.objective,
        status: campaign.status,
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        budget: campaign.budget,
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions,
        revenue: campaign.revenue,
        cpc: campaign.cpc,
        ctr: campaign.ctr,
        roas: campaign.roas,
        target_audience: campaign.target_audience,
        notes: campaign.notes,
      });
    }
  }, [campaign]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) { toast.error('Campaign name required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    const { error } = campaign
      ? await supabase.from('dm_campaigns').update(payload).eq('id', campaign.id)
      : await supabase.from('dm_campaigns').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(campaign ? 'Campaign updated' : 'Campaign created');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-800 border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">{campaign ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Campaign Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="e.g. Q4 Lead Gen — Meta" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Channel</label>
              <select value={form.channel} onChange={(e) => set('channel', e.target.value)} className={inputClass}>
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Objective</label>
              <select value={form.objective} onChange={(e) => set('objective', e.target.value)} className={inputClass}>
                {CAMPAIGN_OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Budget (₹)</label>
              <input type="number" min={0} value={form.budget} onChange={(e) => set('budget', Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Performance Metrics (optional)</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Spend (₹)', field: 'spend' },
                { label: 'Impressions', field: 'impressions' },
                { label: 'Clicks', field: 'clicks' },
                { label: 'Conversions', field: 'conversions' },
                { label: 'Revenue (₹)', field: 'revenue' },
                { label: 'ROAS', field: 'roas' },
              ].map((m) => (
                <div key={m.field}>
                  <label className="block text-xs text-gray-500 mb-1">{m.label}</label>
                  <input type="number" min={0} step={m.field === 'roas' ? '0.01' : '1'} value={(form as any)[m.field]} onChange={(e) => set(m.field, Number(e.target.value))} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Target Audience</label>
            <input type="text" value={form.target_audience} onChange={(e) => set('target_audience', e.target.value)} className={inputClass} placeholder="e.g. Indian SME owners, 25-45, interested in SaaS" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={textareaClass} placeholder="Strategy notes, goals, references..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : campaign ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
