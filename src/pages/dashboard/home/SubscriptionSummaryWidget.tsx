import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { formatINR } from '../../../lib/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SubData {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  category?: string;
}

const COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#EC4899'];

const cycleToMonthly = (amount: number, cycle: string) => {
  if (cycle === 'yearly' || cycle === 'annual') return amount / 12;
  if (cycle === 'quarterly') return amount / 3;
  if (cycle === 'weekly') return amount * 4.33;
  return amount;
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-gray-400">{payload[0].name}</p>
      <p className="font-bold text-white">{formatINR(payload[0].value)}/mo</p>
    </div>
  );
};

export default function SubscriptionSummaryWidget({ subscriptions }: { subscriptions: SubData[] }) {
  const nav = useNavigate();
  const withMonthly = subscriptions.map(s => ({ ...s, monthly: cycleToMonthly(s.amount, s.billing_cycle) }));
  const totalMonthly = withMonthly.reduce((sum, s) => sum + s.monthly, 0);
  const totalAnnual = totalMonthly * 12;
  const top = [...withMonthly].sort((a, b) => b.monthly - a.monthly).slice(0, 6);
  const chartData = top.map(s => ({ name: s.name, value: parseFloat(s.monthly.toFixed(2)) }));

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Subscriptions</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/subscriptions')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Monthly Cost</p>
          <p className="text-sm font-bold text-cyan-400">{formatINR(totalMonthly)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#FF6B00]/5 border border-[#FF6B00]/10 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Annual Cost</p>
          <p className="text-sm font-bold text-[#FF6B00]">{formatINR(totalAnnual)}</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-gray-500 text-sm py-6 text-center">No subscriptions yet</p>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {top.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-gray-400 flex-1 truncate">{s.name}</span>
                <span className="text-[10px] font-semibold text-white tabular-nums">{formatINR(s.monthly)}</span>
              </div>
            ))}
            {subscriptions.length > 5 && (
              <p className="text-[9px] text-gray-600">+{subscriptions.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600 mt-3 text-center">{subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
