import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatINR } from '../../../lib/format';

interface BalanceData {
  name: string;
  balance: number;
  income: number;
  expenses: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload) return null;
  const bal = payload.find(p => p.dataKey === 'balance');
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-gray-300 mb-1">{label}</p>
      <p className={`text-sm font-bold ${(bal?.value ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatINR(bal?.value ?? 0)}
      </p>
    </div>
  );
};

export default function CashFlowChart({ data }: { data: BalanceData[] }) {
  const current = data[data.length - 1]?.balance ?? 0;
  const prev = data[data.length - 2]?.balance ?? 0;
  const trend = prev !== 0 ? ((current - prev) / Math.abs(prev)) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Cash Flow Trend</h3>
          <p className="text-xs text-gray-500 mt-0.5">Net profit/loss over 6 months</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${current >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatINR(current)}
          </p>
          <p className={`text-[10px] font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs last month
          </p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF6B00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
            <XAxis dataKey="name" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#FF6B00"
              strokeWidth={2.5}
              fill="url(#cashFlowGrad)"
              dot={{ r: 4, fill: '#FF6B00', stroke: '#1A1A1A', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#FF6B00', strokeWidth: 2, fill: '#1A1A1A' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
