import { useMemo } from 'react';
import { Gauge, Zap, Clock, AlertTriangle, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, CartesianGrid } from 'recharts';
import { MODELS } from '../../../lib/ai/models';

interface LogEntry {
  timestamp: string;
  taskType: string;
  modelName: string;
  tokensUsed: number;
  estimatedCost: number;
  durationMs: number;
  status: string;
}

interface Props {
  logs: LogEntry[];
}

const COLORS = ['#FF6B00', '#FF9A00', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function PerformanceInsights({ logs }: Props) {
  const modelPerf = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    for (const log of logs) {
      if (!groups[log.modelName]) groups[log.modelName] = [];
      groups[log.modelName].push(log);
    }

    return Object.entries(groups).map(([name, entries]) => {
      const successEntries = entries.filter((e) => e.status === 'success');
      const avgDuration = successEntries.length > 0
        ? Math.round(successEntries.reduce((s, e) => s + e.durationMs, 0) / successEntries.length)
        : 0;
      const avgTokens = successEntries.length > 0
        ? Math.round(successEntries.reduce((s, e) => s + e.tokensUsed, 0) / successEntries.length)
        : 0;
      const successRate = entries.length > 0 ? Math.round((successEntries.length / entries.length) * 100) : 0;
      const totalCost = entries.reduce((s, e) => s + e.estimatedCost, 0);
      const p95 = successEntries.length > 0
        ? successEntries.sort((a, b) => a.durationMs - b.durationMs)[Math.floor(successEntries.length * 0.95)]?.durationMs || 0
        : 0;

      return {
        name,
        calls: entries.length,
        avgDuration,
        avgTokens,
        successRate,
        totalCost,
        p95Duration: p95,
        errorCount: entries.length - successEntries.length,
      };
    }).sort((a, b) => b.calls - a.calls);
  }, [logs]);

  const scatterData = useMemo(() => {
    return modelPerf.map((m) => ({
      name: m.name,
      x: m.avgDuration,
      y: m.totalCost / Math.max(m.calls, 1),
      z: m.calls,
    }));
  }, [modelPerf]);

  const hourlyPattern = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hours[h] = 0;
    for (const log of logs) {
      const hour = new Date(log.timestamp).getHours();
      hours[hour]++;
    }
    return Object.entries(hours).map(([h, count]) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      calls: count,
    }));
  }, [logs]);

  const topErrors = useMemo(() => {
    const errors = logs.filter((l) => l.status === 'error');
    const byModel: Record<string, number> = {};
    for (const e of errors) {
      byModel[e.modelName] = (byModel[e.modelName] || 0) + 1;
    }
    return Object.entries(byModel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([model, count]) => ({ model, count }));
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No usage data yet. Performance insights will appear as you use AI features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-semibold text-white text-sm">Model Performance Comparison</h3>
          </div>
          <div className="space-y-3">
            {modelPerf.map((m, i) => {
              const maxDuration = Math.max(...modelPerf.map((p) => p.avgDuration), 1);
              const barWidth = (m.avgDuration / maxDuration) * 100;

              return (
                <div key={m.name} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500">{m.avgDuration}ms avg</span>
                      <span className={`text-[10px] font-medium ${m.successRate >= 90 ? 'text-emerald-400' : m.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {m.successRate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-dark-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Speed vs Cost</h3>
          </div>
          {scatterData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" dataKey="x" name="Avg Duration" unit="ms" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} />
                  <YAxis type="number" dataKey="y" name="Cost/Call" unit=" INR" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} />
                  <ZAxis type="number" dataKey="z" name="Total Calls" range={[50, 400]} />
                  <Tooltip
                    contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number, name: string) => [
                      name === 'Avg Duration' ? `${value}ms` : name === 'Cost/Call' ? `${value.toFixed(2)} INR` : value,
                      name,
                    ]}
                  />
                  <Scatter data={scatterData} fill="#FF6B00" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-10">Not enough data for scatter plot</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white text-sm">Usage by Hour of Day</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPattern}>
                <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="calls" fill="#FF6B00" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white text-sm">Error Breakdown</h3>
          </div>
          {topErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm text-emerald-400 font-medium">No errors recorded</p>
              <p className="text-xs text-gray-500 mt-1">All API calls completed successfully</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topErrors.map((e) => {
                const total = logs.filter((l) => l.modelName === e.model).length;
                const pct = total > 0 ? Math.round((e.count / total) * 100) : 0;
                return (
                  <div key={e.model} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-dark-700/30">
                    <span className="text-xs text-gray-300">{e.model}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-red-400">{e.count} errors</span>
                      <span className="text-[10px] text-gray-500">({pct}% fail rate)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#FF9A00]" />
          <h3 className="font-semibold text-white text-sm">Detailed Model Stats</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                <th className="pb-3 pr-4">Model</th>
                <th className="pb-3 pr-4 text-right">Calls</th>
                <th className="pb-3 pr-4 text-right">Avg Duration</th>
                <th className="pb-3 pr-4 text-right">P95 Duration</th>
                <th className="pb-3 pr-4 text-right">Avg Tokens</th>
                <th className="pb-3 pr-4 text-right">Total Cost</th>
                <th className="pb-3 pr-4 text-right">Success Rate</th>
                <th className="pb-3 text-right">Errors</th>
              </tr>
            </thead>
            <tbody>
              {modelPerf.map((m) => (
                <tr key={m.name} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-4 text-xs text-gray-300 font-medium">{m.name}</td>
                  <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{m.calls}</td>
                  <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{m.avgDuration}ms</td>
                  <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{m.p95Duration}ms</td>
                  <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{m.avgTokens.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-xs text-white text-right font-medium">{m.totalCost.toFixed(2)} INR</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${m.successRate >= 90 ? 'bg-emerald-500/10 text-emerald-400' : m.successRate >= 70 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                      {m.successRate}%
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-right text-red-400">{m.errorCount || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
