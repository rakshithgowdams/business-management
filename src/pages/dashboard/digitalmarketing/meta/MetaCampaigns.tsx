import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MousePointer, Eye, Target, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { CAMPAIGN_STATUS_COLORS, CAMPAIGN_OBJECTIVES, CAMPAIGN_STATUSES } from '../../../../lib/digitalMarketing/constants';
import type { Campaign } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import CampaignFormModal from '../CampaignFormModal';

export default function MetaCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('dm_campaigns').select('*').eq('user_id', user.id).eq('channel', 'meta').order('created_at', { ascending: false });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{campaigns.length} Meta campaigns</p>
        <button
          onClick={() => { setEditCampaign(null); setShowForm(true); }}
          className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-gray-400 font-medium mb-1">No Meta campaigns</p>
          <p className="text-sm text-gray-500 mb-4">Create your first Facebook/Instagram campaign.</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2 rounded-xl gradient-orange text-white text-sm font-semibold">Create Campaign</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Campaign', 'Objective', 'Status', 'Budget', 'Spent', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'ROAS', ''].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium py-2 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-medium text-white whitespace-nowrap">{c.name}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{c.objective}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] rounded-lg border font-medium ${CAMPAIGN_STATUS_COLORS[c.status] || ''}`}>{c.status}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(c.budget)}</td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(c.spend)}</td>
                  <td className="py-3 px-3 text-gray-300">{c.impressions.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-300">{c.clicks.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-300">{c.ctr}%</td>
                  <td className="py-3 px-3 text-gray-300">{formatINR(c.cpc)}</td>
                  <td className="py-3 px-3 text-gray-300">{c.conversions}</td>
                  <td className="py-3 px-3">
                    <span className={`font-semibold ${c.roas >= 2 ? 'text-emerald-400' : c.roas >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>{c.roas}x</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditCampaign(c); setShowForm(true); }} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CampaignFormModal
          campaign={editCampaign}
          onClose={() => { setShowForm(false); setEditCampaign(null); }}
          onSaved={load}
        />
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Campaign" message="Delete this Meta campaign?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
