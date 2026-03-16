import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatINR } from '../../../lib/format';

interface MonthData {
  name: string;
  income: number;
  expenses: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[160px]">
      <p className="text-xs font-semibold text-gray-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
          <span className="text-gray-400">{p.name}</span>
          <span className="font-semibold text-white">
            {p.dataKey === 'margin' ? `${p.value.toFixed(1)}%` : formatINR(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ProfitMarginChart({ data }: { data: MonthData[] }) {
  const chartData = data.map(d => ({
    ...d,
    profit: d.income - d.expenses,
    margin: d.income > 0 ? ((d.income - d.expenses) / d.income) * 100 : 0,
  }));

  const avgMargin = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.margin, 0) / chartData.length
    : 0;

  const latestMargin = chartData[chartData.length - 1]?.margin ?? 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Profit & Margin</h3>
          <p className="text-xs text-gray-500 mt-0.5">Monthly net profit with margin %</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Margin</p>
            <p className="text-sm font-bold text-[#FF6B00]">{avgMargin.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">This Month</p>
            <p className={`text-sm font-bold ${latestMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{latestMargin.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
            <XAxis dataKey="name" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="amount" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="pct" orientation="right" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[-20, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} formatter={(v: string) => <span className="text-gray-400 ml-1 capitalize">{v}</span>} />
            <Bar yAxisId="amount" dataKey="profit" name="Net Profit" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Line yAxisId="pct" type="monotone" dataKey="margin" name="Margin %" stroke="#FF6B00" strokeWidth={2.5} dot={{ r: 4, fill: '#FF6B00', stroke: '#1A1A1A', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
