import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Target, Megaphone, BarChart2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../lib/format';
import { CHANNEL_LABELS, CHANNEL_COLORS } from '../../../lib/digitalMarketing/constants';
import type { Campaign, Lead, DMExpense } from '../../../lib/digitalMarketing/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6', '#64748b'];

interface ChannelStat {
  channel: string;
  label: string;
  spend: number;
  revenue: number;
  leads: number;
  conversions: number;
  roas: number;
  roi: number;
}

export default function MarketingAnalytics() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expenses, setExpenses] = useState<DMExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('dm_campaigns').select('*').eq('user_id', user.id),
      supabase.from('dm_leads').select('*').eq('user_id', user.id),
      supabase.from('dm_expenses').select('*').eq('user_id', user.id),
    ]).then(([{ data: camps }, { data: ls }, { data: exps }]) => {
      setCampaigns(camps || []);
      setLeads(ls || []);
      setExpenses(exps || []);
      setLoading(false);
    });
  }, [user]);

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalLeads = leads.length;
  const totalConversions = leads.filter((l) => l.status === 'Converted').length;
  const overallROI = totalSpend > 0 ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1) : '0';
  const convRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0';
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  const channels = ['meta', 'google', 'email', 'offline', 'b2b_outreach', 'event', 'print', 'other'];

  const channelStats: ChannelStat[] = channels
    .map((ch) => {
      const chCampaigns = campaigns.filter((c) => c.channel === ch);
      const chExpenses = expenses.filter((e) => e.platform === ch);
      const chLeads = leads.filter((l) => l.source === CHANNEL_LABELS[ch]);
      const spend = chExpenses.reduce((s, e) => s + e.amount, 0);
      const revenue = chCampaigns.reduce((s, c) => s + c.revenue, 0);
      const convs = chCampaigns.reduce((s, c) => s + c.conversions, 0);
      const roas = spend > 0 ? revenue / spend : 0;
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      return { channel: ch, label: CHANNEL_LABELS[ch] || ch, spend, revenue, leads: chLeads.length, conversions: convs, roas, roi };
    })
    .filter((s) => s.spend > 0 || s.leads > 0);

  const spendByChannel = channelStats.map((s) => ({ name: s.label, value: s.spend })).filter((s) => s.value > 0);

  const roasData = channelStats.filter((s) => s.spend > 0).map((s) => ({ name: s.label, roas: parseFloat(s.roas.toFixed(2)), spend: s.spend }));

  const leadsBySource = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});
  const leadsSourceData = Object.entries(leadsBySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const funnelStages = [
    { label: 'Total Leads', count: leads.length, color: 'bg-blue-500' },
    { label: 'Contacted', count: leads.filter((l) => l.status !== 'New').length, color: 'bg-cyan-500' },
    { label: 'Qualified', count: leads.filter((l) => ['Qualified', 'Proposal Sent', 'Negotiation', 'Converted'].includes(l.status)).length, color: 'bg-amber-500' },
    { label: 'Proposal', count: leads.filter((l) => ['Proposal Sent', 'Negotiation', 'Converted'].includes(l.status)).length, color: 'bg-orange-500' },
    { label: 'Converted', count: leads.filter((l) => l.status === 'Converted').length, color: 'bg-emerald-500' },
  ];
  const maxFunnel = funnelStages[0]?.count || 1;

  const monthlySpend: Record<string, number> = {};
  expenses.forEach((e) => {
    const month = e.date?.slice(0, 7) || '';
    if (month) monthlySpend[month] = (monthlySpend[month] || 0) + e.amount;
  });
  const monthlyData = Object.entries(monthlySpend)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, spend]) => ({ month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), spend }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-800 border border-white/10 rounded-lg p-2 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? formatINR(p.value) : p.value}</p>
        ))}
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Marketing Analytics</h2>
        <p className="text-sm text-gray-500">Overall performance across all channels</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: formatINR(totalSpend), icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Total Revenue', value: formatINR(totalRevenue), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Overall ROI', value: `${overallROI}%`, icon: BarChart2, color: Number(overallROI) >= 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-dark-700/50 border-white/5' },
          { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Conversions', value: totalConversions, icon: Target, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Conv. Rate', value: `${convRate}%`, icon: Megaphone, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Cost/Lead', value: formatINR(cpl), icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Campaigns', value: campaigns.filter((c) => c.status === 'Active').length + ' active', icon: BarChart2, color: 'text-gray-300', bg: 'bg-dark-700/50 border-white/5' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Spend by Channel</h3>
          {spendByChannel.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No spend data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={spendByChannel} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {spendByChannel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-dark-800 border border-white/10 rounded-lg p-2 text-xs">
                      <p className="text-gray-300">{payload[0].name}</p>
                      <p className="text-white font-semibold">{formatINR(payload[0].value as number)}</p>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {spendByChannel.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-gray-400 truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-300 shrink-0">{formatINR(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly Ad Spend Trend</h3>
          {monthlyData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No spend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={customTooltip} />
                <Line type="monotone" dataKey="spend" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="Spend" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">ROAS by Channel</h3>
          {roasData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={roasData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-dark-800 border border-white/10 rounded-lg p-2 text-xs">
                    <p className="text-gray-400 mb-1">{label}</p>
                    <p className="text-white">ROAS: {payload[0].value}x</p>
                  </div>
                ) : null} />
                <Bar dataKey="roas" name="ROAS" radius={[0, 4, 4, 0]}>
                  {roasData.map((entry, i) => (
                    <Cell key={i} fill={entry.roas >= 2 ? '#10b981' : entry.roas >= 1 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Leads by Source</h3>
          {leadsSourceData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No leads yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={leadsSourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-dark-800 border border-white/10 rounded-lg p-2 text-xs">
                    <p className="text-gray-400 mb-1">{label}</p>
                    <p className="text-white">Leads: {payload[0].value}</p>
                  </div>
                ) : null} />
                <Bar dataKey="value" name="Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-5">Lead Conversion Funnel</h3>
        <div className="space-y-3">
          {funnelStages.map((stage) => {
            const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0;
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-400 text-right shrink-0">{stage.label}</div>
                <div className="flex-1 bg-dark-700 rounded-full h-7 overflow-hidden">
                  <div className={`h-full ${stage.color} rounded-full flex items-center justify-end pr-3 transition-all`} style={{ width: `${Math.max(pct, 3)}%` }}>
                    <span className="text-xs font-semibold text-white">{stage.count}</span>
                  </div>
                </div>
                <div className="w-12 text-xs text-gray-400 shrink-0">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {channelStats.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Channel Performance Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Channel', 'Spend', 'Revenue', 'ROAS', 'ROI', 'Leads', 'Conversions'].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channelStats.sort((a, b) => b.spend - a.spend).map((s) => (
                  <tr key={s.channel} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded border font-medium ${CHANNEL_COLORS[s.channel] || ''}`}>{s.label}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-300">{formatINR(s.spend)}</td>
                    <td className="py-3 px-3 text-gray-300">{formatINR(s.revenue)}</td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${s.roas >= 2 ? 'text-emerald-400' : s.roas >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>{s.roas.toFixed(2)}x</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${s.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{s.roi.toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-3 text-gray-300">{s.leads}</td>
                    <td className="py-3 px-3 text-gray-300">{s.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
