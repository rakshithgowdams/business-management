import { useEffect, useState } from 'react';
import {
  Loader2, Download, Trash2, Zap, Clock, DollarSign, Activity,
  Brain, Calculator, Gauge, TrendingUp, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getUsageLog, clearUsageLog, exportUsageCSV, getUsageStats } from '../../lib/ai/models';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import ConfirmDialog from '../../components/ConfirmDialog';
import ModelCatalog from './aiusage/ModelCatalog';
import CostCalculator from './aiusage/CostCalculator';
import PerformanceInsights from './aiusage/PerformanceInsights';
import SpendingForecast from './aiusage/SpendingForecast';

interface DBLog {
  id: string;
  task_type: string;
  model_name: string;
  model_id: string;
  tokens_used: number;
  estimated_cost: number;
  duration_ms: number;
  status: string;
  module: string;
  created_at: string;
}

type TabKey = 'overview' | 'models' | 'performance' | 'calculator' | 'forecast';

const TABS: { key: TabKey; label: string; icon: typeof Zap }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'models', label: 'All Models', icon: Brain },
  { key: 'performance', label: 'Performance', icon: Gauge },
  { key: 'calculator', label: 'Cost Calculator', icon: Calculator },
  { key: 'forecast', label: 'Forecast', icon: TrendingUp },
];

const CHART_COLORS = ['#FF6B00', '#FF9A00', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4'];

export default function AIUsage() {
  const { user } = useAuth();
  const [dbLogs, setDbLogs] = useState<DBLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClear, setShowClear] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const localLog = getUsageLog();

  useEffect(() => {
    if (user) loadDbLogs();
  }, [user]);

  const loadDbLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(500);
    setDbLogs((data as DBLog[]) || []);
    setLoading(false);
  };

  const allLogs = [
    ...dbLogs.map((d) => ({
      timestamp: d.created_at,
      taskType: d.task_type,
      modelName: d.model_name,
      tokensUsed: d.tokens_used,
      estimatedCost: Number(d.estimated_cost),
      durationMs: d.duration_ms,
      status: d.status,
      module: d.module,
      source: 'db' as const,
    })),
    ...localLog.map((l) => ({
      timestamp: l.timestamp,
      taskType: l.taskType,
      modelName: l.modelName,
      tokensUsed: l.tokensUsed,
      estimatedCost: l.estimatedCost,
      durationMs: l.durationMs,
      status: l.status,
      module: 'local',
      source: 'local' as const,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filterByTime = (logs: typeof allLogs) => {
    if (timeRange === 'all') return logs;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (timeRange === '7d' ? 7 : 30));
    return logs.filter((l) => new Date(l.timestamp) >= cutoff);
  };

  const filtered = filterByTime(allLogs);
  const totalCost = filtered.reduce((sum, l) => sum + l.estimatedCost, 0);
  const totalTokens = filtered.reduce((sum, l) => sum + l.tokensUsed, 0);
  const totalCalls = filtered.length;
  const avgDuration = totalCalls > 0 ? Math.round(filtered.reduce((s, l) => s + l.durationMs, 0) / totalCalls) : 0;
  const successRate = totalCalls > 0 ? Math.round((filtered.filter((l) => l.status === 'success').length / totalCalls) * 100) : 100;

  const modelBreakdown = Object.entries(
    filtered.reduce<Record<string, number>>((acc, l) => {
      acc[l.modelName] = (acc[l.modelName] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const modelUsageCounts = filtered.reduce<Record<string, number>>((acc, l) => {
    acc[l.modelName] = (acc[l.modelName] || 0) + 1;
    return acc;
  }, {});

  const taskBreakdown = Object.entries(
    filtered.reduce<Record<string, number>>((acc, l) => {
      acc[l.taskType] = (acc[l.taskType] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })).sort((a, b) => b.value - a.value);

  const dailyCost = Object.entries(
    filtered.reduce<Record<string, number>>((acc, l) => {
      const day = new Date(l.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[day] = (acc[day] || 0) + l.estimatedCost;
      return acc;
    }, {})
  )
    .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(2)) }))
    .reverse();

  const modelCostBreakdown = Object.entries(
    filtered.reduce<Record<string, number>>((acc, l) => {
      acc[l.modelName] = (acc[l.modelName] || 0) + l.estimatedCost;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })).sort((a, b) => b.value - a.value);

  const handleExport = () => {
    const header = 'Date,Task,Model,Tokens,Est. Cost (INR),Duration (ms),Status,Source';
    const rows = filtered.map((l) =>
      `${l.timestamp},${l.taskType},${l.modelName},${l.tokensUsed},${l.estimatedCost.toFixed(2)},${l.durationMs},${l.status},${l.source}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Usage data exported');
  };

  const handleClear = () => {
    clearUsageLog();
    setShowClear(false);
    toast.success('Local usage log cleared');
  };

  const statCards = [
    { label: 'Total Calls', value: totalCalls.toLocaleString(), icon: Zap, color: 'text-[#FF6B00]', bg: 'bg-[#FF6B00]/10' },
    { label: 'Total Tokens', value: totalTokens.toLocaleString(), icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Est. Cost', value: `${totalCost.toFixed(2)} INR`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg Duration', value: `${avgDuration}ms`, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Success Rate', value: `${successRate}%`, icon: Gauge, color: successRate >= 90 ? 'text-emerald-400' : 'text-orange-400', bg: successRate >= 90 ? 'bg-emerald-500/10' : 'bg-orange-500/10' },
    { label: 'Models Used', value: modelBreakdown.length.toString(), icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Usage Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">All models, costs, performance and forecasts in one place</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-0.5 p-0.5 bg-dark-800 rounded-lg border border-white/5">
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeRange === r ? 'gradient-orange text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All'}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowClear(true)} className="px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear Local
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-lg font-bold text-white leading-tight">{card.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'gradient-orange text-white shadow-lg shadow-[#FF6B00]/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {dailyCost.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Daily Cost Trend</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyCost}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="cost" stroke="#FF6B00" fill="url(#costGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modelBreakdown.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Model Usage</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={modelBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {modelBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {modelCostBreakdown.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Cost by Model</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={modelCostBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {modelCostBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} formatter={(v: number) => `${v} INR`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {taskBreakdown.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Task Breakdown</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskBreakdown} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#999', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#FF6B00" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Calls ({filtered.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Task</th>
                    <th className="pb-3 pr-4">Model</th>
                    <th className="pb-3 pr-4 text-right">Tokens</th>
                    <th className="pb-3 pr-4 text-right">Cost</th>
                    <th className="pb-3 pr-4 text-right">Duration</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((log, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-300 capitalize">{log.taskType.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-300">{log.modelName}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{log.tokensUsed.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{log.estimatedCost.toFixed(2)} INR</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-400 text-right">{log.durationMs}ms</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          log.source === 'db' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {log.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No AI usage recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'models' && <ModelCatalog usageCounts={modelUsageCounts} />}

      {activeTab === 'performance' && <PerformanceInsights logs={filtered} />}

      {activeTab === 'calculator' && <CostCalculator />}

      {activeTab === 'forecast' && <SpendingForecast logs={filtered} />}

      <ConfirmDialog
        open={showClear}
        title="Clear Local Usage Log"
        message="This will clear the locally stored AI usage data. Database records will not be affected."
        onConfirm={handleClear}
        onCancel={() => setShowClear(false)}
      />
    </div>
  );
}
