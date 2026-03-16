import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, TrendingUp, DollarSign, MousePointer, Target, Eye, Pencil, Trash2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../lib/format';
import { CAMPAIGN_STATUS_COLORS, CHANNEL_COLORS, CHANNEL_LABELS, CAMPAIGN_STATUSES } from '../../../lib/digitalMarketing/constants';
import type { Campaign } from '../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../components/ConfirmDialog';
import CampaignFormModal from './CampaignFormModal';

export default function CampaignsOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('dm_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
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

  const filtered = campaigns.filter((c) => {
    const q = search.toLowerCase();
    return (!search || c.name.toLowerCase().includes(q)) &&
      (filterStatus === 'All' || c.status === filterStatus);
  });

  const totals = campaigns.reduce((acc, c) => ({
    budget: acc.budget + c.budget,
    spend: acc.spend + c.spend,
    clicks: acc.clicks + c.clicks,
    conversions: acc.conversions + c.conversions,
    revenue: acc.revenue + c.revenue,
  }), { budget: 0, spend: 0, clicks: 0, conversions: 0, revenue: 0 });

  const overallROAS = totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : '0';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Budget', value: formatINR(totals.budget), icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Total Spent', value: formatINR(totals.spend), icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
          { label: 'Total Clicks', value: totals.clicks.toLocaleString(), icon: MousePointer, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Conversions', value: totals.conversions.toLocaleString(), icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Overall ROAS', value: `${overallROAS}x`, icon: BarChart2, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">All Campaigns</h2>
        <button
          onClick={() => { setEditCampaign(null); setShowForm(true); }}
          className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1">
          {['All', ...CAMPAIGN_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterStatus === s
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-500 mb-6">Create your first marketing campaign to get started.</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold">
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const budgetPct = campaign.budget > 0 ? Math.min(100, Math.round((campaign.spend / campaign.budget) * 100)) : 0;
            return (
              <div key={campaign.id} className="glass-card rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-white">{campaign.name}</p>
                        <span className={`px-2 py-0.5 text-[10px] rounded border font-medium ${CHANNEL_COLORS[campaign.channel] || ''}`}>
                          {CHANNEL_LABELS[campaign.channel] || campaign.channel}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-lg border font-medium ${CAMPAIGN_STATUS_COLORS[campaign.status] || ''}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{campaign.objective}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Budget', value: formatINR(campaign.budget) },
                      { label: 'Spent', value: formatINR(campaign.spend) },
                      { label: 'Clicks', value: campaign.clicks.toLocaleString() },
                      { label: 'ROAS', value: `${campaign.roas}x` },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className="text-xs text-gray-500">{m.label}</p>
                        <p className="text-sm font-semibold text-white">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {campaign.budget > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Budget utilization</span>
                      <span>{budgetPct}%</span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => { setEditCampaign(campaign); setShowForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(campaign.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CampaignFormModal
          campaign={editCampaign}
          onClose={() => { setShowForm(false); setEditCampaign(null); }}
          onSaved={load}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Campaign"
        message="This will delete the campaign and all its associated data."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
