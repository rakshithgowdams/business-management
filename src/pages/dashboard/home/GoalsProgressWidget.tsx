import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight, TrendingUp } from 'lucide-react';
import { formatINR, daysRemaining } from '../../../lib/format';

interface GoalData {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: string;
}

export default function GoalsProgressWidget({ goals }: { goals: GoalData[] }) {
  const nav = useNavigate();
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent = activeGoals.reduce((s, g) => s + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Financial Goals</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/goals')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {activeGoals.length > 0 && (
        <div className="flex items-center gap-4 mb-5 p-3 bg-teal-500/5 rounded-lg border border-teal-500/10">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none" stroke="#14B8A6" strokeWidth="5"
                strokeDasharray={`${overallProgress * 1.382} ${138.2 - overallProgress * 1.382}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-400">
              {overallProgress.toFixed(0)}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Overall Progress</p>
            <p className="text-sm font-bold text-white">{formatINR(totalCurrent)} <span className="text-gray-500 font-normal text-xs">of {formatINR(totalTarget)}</span></p>
          </div>
        </div>
      )}

      {activeGoals.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No active goals. Set one to track your progress.</p>
      ) : (
        <div className="space-y-3">
          {activeGoals.slice(0, 4).map((g) => {
            const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
            const days = daysRemaining(g.target_date);
            return (
              <div key={g.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white truncate">{g.name}</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <TrendingUp className="w-3 h-3 text-teal-400" />
                    <span className="text-teal-400 font-semibold">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 75 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{formatINR(g.current_amount)} / {formatINR(g.target_amount)}</span>
                  <span className={days < 30 ? 'text-amber-400' : ''}>
                    {days > 0 ? `${days}d left` : 'Overdue'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
