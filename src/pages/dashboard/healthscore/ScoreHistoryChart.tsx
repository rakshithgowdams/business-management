import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { History, ChevronRight } from 'lucide-react';
import type { HistoryEntry } from './HealthScore';

interface Props {
  history: HistoryEntry[];
  currentWeekStart: string;
  selectedWeekStart: string | null;
  onSelectEntry: (entry: HistoryEntry) => void;
}

function formatWeekShort(weekStart: string): string {
  const d = new Date(weekStart);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatWeekRange(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function getScoreColor(score: number): string {
  if (score >= 91) return '#3B82F6';
  if (score >= 76) return '#10B981';
  if (score >= 61) return '#F59E0B';
  if (score >= 41) return '#FF6B00';
  return '#EF4444';
}

function getScoreLabel(score: number): string {
  if (score >= 91) return 'Excellent';
  if (score >= 76) return 'Healthy';
  if (score >= 61) return 'Moderate';
  if (score >= 41) return 'At Risk';
  return 'Critical';
}

export default function ScoreHistoryChart({ history, currentWeekStart, selectedWeekStart, onSelectEntry }: Props) {
  const chartData = history.map((h) => ({
    name: formatWeekShort(h.week_start),
    score: h.score,
    weekStart: h.week_start,
  }));

  const recentEntries = [...history].reverse().slice(0, 8);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Score Trend</h2>
        <span className="text-xs text-gray-500">{history.length} week{history.length !== 1 ? 's' : ''} tracked</span>
      </div>

      {chartData.length < 2 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">Score history will build weekly.</p>
          <p className="text-xs text-gray-600 mt-1">Each week your score is automatically saved.</p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B00" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1f1f1f' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1f1f1f' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#FF6B00' }}
                formatter={(value: number) => [`${value}/100`, 'Score']}
              />
              <Area type="monotone" dataKey="score" stroke="#FF6B00" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#FF6B00', r: 4 }} activeDot={{ r: 6, fill: '#FF9A00' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {recentEntries.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Weekly History</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentEntries.map((entry) => {
              const isCurrent = entry.week_start === currentWeekStart;
              const isSelected = entry.week_start === selectedWeekStart;
              const color = getScoreColor(entry.score);
              const label = getScoreLabel(entry.score);
              const scoreDelta = (() => {
                const idx = history.findIndex((h) => h.week_start === entry.week_start);
                if (idx <= 0) return null;
                return entry.score - history[idx - 1].score;
              })();

              return (
                <button
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${
                    isSelected
                      ? 'bg-brand-500/10 border border-brand-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {entry.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-200 truncate">{formatWeekRange(entry.week_start)}</p>
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded gradient-orange text-white shrink-0">NOW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                        {label}
                      </span>
                      {scoreDelta !== null && scoreDelta !== 0 && (
                        <span className={`text-[10px] font-medium ${scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {scoreDelta > 0 ? '+' : ''}{scoreDelta} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
