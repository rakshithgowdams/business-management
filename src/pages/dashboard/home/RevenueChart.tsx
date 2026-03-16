import {
  BarChart,
  Bar,
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

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-gray-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.dataKey === 'income' ? '#10B981' : '#EF4444' }}
          />
          <span className="text-gray-400 capitalize">{p.dataKey}</span>
          <span className="ml-auto font-semibold text-white">{formatINR(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-white/10 mt-2 pt-2 flex items-center justify-between text-xs">
          <span className="text-gray-400">Profit</span>
          <span className={`font-semibold ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatINR(payload[0].value - payload[1].value)}
          </span>
        </div>
      )}
    </div>
  );
};

export default function RevenueChart({ data }: { data: MonthData[] }) {
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Revenue vs Expenses</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 6 months comparison</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Income</p>
            <p className="text-sm font-bold text-emerald-400">{formatINR(totalIncome)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-sm font-bold text-red-400">{formatINR(totalExpenses)}</p>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#4B5563"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#4B5563"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value: string) => <span className="text-gray-400 capitalize ml-1">{value}</span>}
            />
            <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
