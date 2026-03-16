import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR, formatDate } from '../../../../lib/format';
import type { ProjectExpense, ProjectTeamEntry, ProjectTool } from '../../../../lib/projects/types';

const COLORS = ['#FF6B00', '#FF9A00', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#06b6d4'];

interface Props {
  expenses: ProjectExpense[];
  team: ProjectTeamEntry[];
  tools: ProjectTool[];
}

export default function OverviewTab({ expenses, team, tools }: Props) {
  const catMap = new Map<string, number>();
  expenses.forEach((e) => {
    catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
  });
  const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const recent5 = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const totalTeamCost = team.reduce((s, t) => s + t.total_cost, 0);
  const totalToolCost = tools.reduce((s, t) => s + t.total_cost, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Expense Breakdown by Category</h3>
          <div className="h-56">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value: number | undefined) => formatINR(value ?? 0)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">No expenses yet</div>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {item.name}: {formatINR(item.value)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Recent Expenses</h3>
            {recent5.length > 0 ? (
              <div className="space-y-2">
                {recent5.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                    <div className="min-w-0">
                      <p className="text-white truncate">{e.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(e.date)} - {e.category}</p>
                    </div>
                    <span className="text-red-400 font-medium shrink-0 ml-3">{formatINR(e.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No expenses logged yet.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Team Costs</p>
              <p className="text-lg font-bold text-orange-400">{formatINR(totalTeamCost)}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Tool Costs</p>
              <p className="text-lg font-bold text-blue-400">{formatINR(totalToolCost)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
