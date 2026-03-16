import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { formatINR } from '../../../lib/format';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface IncomeSource {
  source: string;
  amount: number;
  count: number;
}

const COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#EC4899'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: IncomeSource }> }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-xs font-semibold text-white mb-1">{d.source}</p>
      <p className="text-xs text-emerald-400">{formatINR(d.amount)}</p>
      <p className="text-[10px] text-gray-500">{d.count} entries</p>
    </div>
  );
};

export default function TopIncomeSourcesWidget({ sources }: { sources: IncomeSource[] }) {
  const nav = useNavigate();
  const total = sources.reduce((s, x) => s + x.amount, 0);
  const top = [...sources].sort((a, b) => b.amount - a.amount).slice(0, 6);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Top Income Sources</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/income')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {top.length === 0 ? (
        <p className="text-gray-500 text-sm py-6 text-center">No income data yet</p>
      ) : (
        <>
          <div className="h-44 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="source" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {top.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {top.slice(0, 4).map((s, i) => (
              <div key={s.source} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-400 flex-1 truncate">{s.source}</span>
                <span className="text-[10px] text-gray-500">{total > 0 ? ((s.amount / total) * 100).toFixed(1) : 0}%</span>
                <span className="text-xs font-semibold text-white tabular-nums">{formatINR(s.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
