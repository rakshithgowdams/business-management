import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR } from '../../../lib/format';

interface ExpenseCategory {
  name: string;
  value: number;
}

const COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#84CC16', '#F97316'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-0.5">{payload[0].name}</p>
      <p className="text-sm font-bold text-white">{formatINR(payload[0].value)}</p>
    </div>
  );
};

export default function ExpenseBreakdown({ data, totalExpenses }: { data: ExpenseCategory[]; totalExpenses: number }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const topItems = sorted.slice(0, 8);
  const otherSum = sorted.slice(8).reduce((s, d) => s + d.value, 0);
  const chartData = otherSum > 0 ? [...topItems, { name: 'Other', value: otherSum }] : topItems;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Expense Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">All-time spending by category</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-sm font-bold text-red-400">{formatINR(totalExpenses)}</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          No expense data yet
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2 max-h-48 overflow-y-auto pr-1">
            {chartData.map((item, i) => {
              const pct = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-400 flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] text-gray-500 tabular-nums">{pct}%</span>
                  <span className="text-xs font-semibold text-white tabular-nums w-20 text-right">{formatINR(item.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
