import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowRight, TrendingUp, MousePointer, Users, DollarSign, BarChart2, Zap } from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface DMStats {
  activeCampaigns: number;
  totalLeads: number;
  convertedLeads: number;
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  avgROAS: number;
  topCampaigns: { id: string; name: string; channel: string; status: string; spend: number; conversions: number; roas: number }[];
}

const channelColor: Record<string, string> = {
  google: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  meta: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  facebook: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  instagram: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  email: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  linkedin: 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  twitter: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  seo: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function DigitalMarketingWidget({ data }: { data: DMStats }) {
  const nav = useNavigate();
  const conversionRate = data.totalLeads > 0 ? ((data.convertedLeads / data.totalLeads) * 100).toFixed(1) : '0';
  const ctr = data.totalImpressions > 0 ? ((data.totalClicks / data.totalImpressions) * 100).toFixed(2) : '0';

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Digital Marketing</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/digital-marketing')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          Full Analytics <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
          <Zap className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
          <p className="text-base font-bold text-orange-400">{data.activeCampaigns}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
          <Users className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
          <p className="text-base font-bold text-blue-400">{fmtNum(data.totalLeads)}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Leads</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
          <MousePointer className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
          <p className="text-base font-bold text-emerald-400">{ctr}%</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">CTR</p>
        </div>
        <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/10 text-center">
          <TrendingUp className="w-3.5 h-3.5 text-teal-400 mx-auto mb-1" />
          <p className="text-base font-bold text-teal-400">{conversionRate}%</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Conv.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-gray-500">Total Spend</span>
          </div>
          <p className="text-sm font-bold text-red-400">{formatINR(data.totalSpend)}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart2 className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-gray-500">Avg ROAS</span>
          </div>
          <p className="text-sm font-bold text-emerald-400">{data.avgROAS > 0 ? `${data.avgROAS.toFixed(2)}x` : 'N/A'}</p>
        </div>
      </div>

      {data.topCampaigns.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Top Campaigns</p>
          <div className="space-y-1.5">
            {data.topCampaigns.slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold capitalize shrink-0 ${channelColor[c.channel?.toLowerCase()] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                    {c.channel || 'N/A'}
                  </span>
                  <span className="text-xs text-white truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-500">{formatINR(c.spend)}</span>
                  {c.roas > 0 && <span className="text-[10px] text-emerald-400 font-semibold">{c.roas.toFixed(1)}x</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
