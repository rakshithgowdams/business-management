import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricData {
  name: string;
  icon: string;
  value: string;
  scoreEarned: number;
  scoreMax: number;
  trend: 'up' | 'down' | 'flat';
  status: string;
  statusColor: string;
}

interface Props {
  metric: MetricData;
}

export default function MetricCard({ metric }: Props) {
  const pct = (metric.scoreEarned / metric.scoreMax) * 100;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{metric.icon}</span>
          <h3 className="text-sm font-semibold text-white">{metric.name}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${metric.statusColor}`}>
          {metric.status}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-3">{metric.value}</p>

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {metric.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          {metric.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          {metric.trend === 'flat' && <Minus className="w-3.5 h-3.5 text-yellow-400" />}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {metric.scoreEarned}/{metric.scoreMax} pts
        </span>
      </div>

      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
