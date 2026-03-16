import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { CAMPAIGN_STATUS_COLORS } from '../../../../lib/digitalMarketing/constants';
import type { Campaign } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import CampaignFormModal from '../CampaignFormModal';

export default function GoogleCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('dm_campaigns').select('*').eq('user_id', user.id).eq('channel', 'google').order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_campaigns').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Campaign deleted');
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const totals = campaigns.reduce((a, c) => ({ spend: a.spend + c.spend, clicks: a.clicks + c.clicks, conversions: a.conversions + c.conversions }), { spend: 0, clicks: 0, conversions: 0 });
  const avgCPC = totals.clicks > 0 ? totals.spend / totals.clicks : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 mb-2">
        {[
          { label: 'Total Spend', value: formatINR(totals.spend), color: 'text-red-400' },
          { label: 'Total Clicks', value: totals.clicks.toLocaleString(), color: 'text-blue-400' },
          { label: 'Conversions', value: totals.conversions.toLocaleString(), color: 'text-green-400' },
          { label: 'Avg CPC', value: formatINR(avgCPC), color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{campaigns.length} Google campaigns</p>
        <button onClick={() => { setEditCampaign(null); setShowForm(true); }} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No Google Ads campaigns</p>
          <p className="text-sm text-gray-500 mb-4">Start tracking your Google Ads performance.</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2 rounded-xl gradient-orange text-white text-sm font-semibold">Create Campaign</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Campaign', 'Objective', 'Status', 'Budget', 'Spent', 'Clicks', 'CPC', 'Conversions', 'Conv. Rate', 'ROAS', ''].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium py-2 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const convRate = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-medium text-white whitespace-nowrap">{c.name}</td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{c.objective}</td>
                    <td className="py-3 px-3"><span className={`px-2 py-0.5 text-[10px] rounded-lg border font-medium ${CAMPAIGN_STATUS_COLORS[c.status] || ''}`}>{c.status}</span></td>
                    <td className="py-3 px-3 text-gray-300">{formatINR(c.budget)}</td>
                    <td className="py-3 px-3 text-gray-300">{formatINR(c.spend)}</td>
                    <td className="py-3 px-3 text-gray-300">{c.clicks.toLocaleString()}</td>
                    <td className="py-3 px-3 text-gray-300">{formatINR(c.cpc)}</td>
                    <td className="py-3 px-3 text-gray-300">{c.conversions}</td>
                    <td className="py-3 px-3 text-gray-300">{convRate}%</td>
                    <td className="py-3 px-3"><span className={`font-semibold ${c.roas >= 2 ? 'text-emerald-400' : c.roas >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>{c.roas}x</span></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditCampaign(c); setShowForm(true); }} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CampaignFormModal campaign={editCampaign} onClose={() => { setShowForm(false); setEditCampaign(null); }} onSaved={load} />
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Campaign" message="Delete this Google campaign?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
