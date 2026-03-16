import { PiggyBank, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../../../lib/format';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

interface SavingsData {
  currentMonthIncome: number;
  currentMonthExpenses: number;
  totalSaved: number;
  monthlyData: { month: string; income: number; expenses: number; saved: number; rate: number }[];
}

export default function SavingsRateWidget({ data }: { data: SavingsData }) {
  const nav = useNavigate();
  const savingsRate = data.currentMonthIncome > 0
    ? Math.max(0, ((data.currentMonthIncome - data.currentMonthExpenses) / data.currentMonthIncome) * 100)
    : 0;
  const saved = data.currentMonthIncome - data.currentMonthExpenses;
  const avgRate = data.monthlyData.length > 0
    ? data.monthlyData.reduce((s, d) => s + d.rate, 0) / data.monthlyData.length
    : 0;

  const radialData = [{ name: 'savings', value: Math.min(savingsRate, 100), fill: savingsRate >= 20 ? '#10B981' : savingsRate >= 10 ? '#F59E0B' : '#EF4444' }];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Savings Rate</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/goals')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          Goals <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="65%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              data={radialData}
              barSize={10}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: 'rgba(255,255,255,0.05)' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{savingsRate.toFixed(0)}%</span>
            <span className="text-[9px] text-gray-500">rate</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] text-gray-500">Saved This Month</p>
            <p className={`text-sm font-bold ${saved >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{formatINR(Math.abs(saved))}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">6-Month Avg Rate</p>
            <p className="text-sm font-bold text-white">{avgRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Total Accumulated</p>
            <p className="text-sm font-bold text-white">{formatINR(data.totalSaved)}</p>
          </div>
        </div>
      </div>

      {data.monthlyData.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Monthly Savings
          </p>
          {data.monthlyData.slice(-4).map(m => (
            <div key={m.month} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-7">{m.month}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(Math.max(m.rate, 0), 100)}%`,
                    background: m.rate >= 20 ? '#10B981' : m.rate >= 10 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <span className={`text-[10px] font-semibold w-10 text-right ${m.rate >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                {m.rate.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
