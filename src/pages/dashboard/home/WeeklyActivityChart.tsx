import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatINR } from '../../../lib/format';

interface DayData {
  day: string;
  income: number;
  expenses: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-xs font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.dataKey === 'income' ? '#10B981' : '#EF4444' }} />
          <span className="text-gray-400 capitalize">{p.dataKey}</span>
          <span className="font-semibold text-white ml-1">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function WeeklyActivityChart({ data }: { data: DayData[] }) {
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const busiest = [...data].sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses))[0];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">This Week Activity</h3>
          <p className="text-xs text-gray-500 mt-0.5">Daily income & expense pattern</p>
        </div>
        {busiest && (busiest.income + busiest.expenses) > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Busiest day</p>
            <p className="text-xs font-semibold text-[#FF6B00]">{busiest.day}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
          <p className="text-[10px] text-gray-500 mb-0.5">Week Income</p>
          <p className="text-sm font-bold text-emerald-400">{formatINR(totalIncome)}</p>
        </div>
        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
          <p className="text-[10px] text-gray-500 mb-0.5">Week Expenses</p>
          <p className="text-sm font-bold text-red-400">{formatINR(totalExpenses)}</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="incomeWeekGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expWeekGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
            <XAxis dataKey="day" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incomeWeekGrad)" dot={{ r: 3, fill: '#10B981', stroke: '#1A1A1A', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expWeekGrad)" dot={{ r: 3, fill: '#EF4444', stroke: '#1A1A1A', strokeWidth: 1 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
