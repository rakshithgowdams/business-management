import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Download, FileText, ChevronLeft, ChevronRight, Copy, Loader2,
  Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, History,
  ChevronDown, ChevronUp, Star, Zap, BarChart2, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fetchBusinessMetrics } from '../../../lib/businessData';
import { callGeminiFlash, parseJSON } from '../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../lib/ai/models';
import { formatINR } from '../../../lib/format';
import { exportWeeklySummaryPDF, exportWeeklySummaryWord } from '../../../lib/weeklySummaryExport';
import WeeklyKPICards from './WeeklyKPICards';
import WeeklyBreakdownTabs from './WeeklyBreakdownTabs';
import toast from 'react-hot-toast';

const LS_KEY = 'mfo_weekly_summaries';

interface AIWeeklyInsight {
  WEEK_SUMMARY: string;
  BEST_THING: string;
  CONCERN: string;
  NEXT_WEEK_PRIORITY: string[];
  MOTIVATION: string;
}

interface SavedSummary {
  weekLabel: string;
  weekStart: string;
  insight: AIWeeklyInsight;
  createdAt: string;
}

function getWeekBounds(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function formatWeekLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
}

function ScoreRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#1a1a1a" strokeWidth="5" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="35" y="38" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{value}</text>
      </svg>
      <p className="text-[9px] text-gray-500 text-center">{label}</p>
    </div>
  );
}

export default function WeeklySummary() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof fetchBusinessMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<AIWeeklyInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [weekGoals, setWeekGoals] = useState<string[]>(['', '', '']);
  const [completedGoals, setCompletedGoals] = useState<boolean[]>([false, false, false]);
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  const { start: weekStart, end: weekEnd } = getWeekBounds(weekOffset);
  const weekLabel = formatWeekLabel(weekStart, weekEnd);
  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setSavedSummaries(JSON.parse(saved));
    const goals = localStorage.getItem(`mfo_weekly_goals_${weekLabel}`);
    if (goals) {
      const parsed = JSON.parse(goals);
      setWeekGoals(parsed.goals || ['', '', '']);
      setCompletedGoals(parsed.completed || [false, false, false]);
    } else {
      setWeekGoals(['', '', '']);
      setCompletedGoals([false, false, false]);
    }
  }, [weekLabel]);

  const saveGoals = (goals: string[], completed: boolean[]) => {
    localStorage.setItem(`mfo_weekly_goals_${weekLabel}`, JSON.stringify({ goals, completed }));
  };

  const toggleGoalComplete = (i: number) => {
    const updated = [...completedGoals];
    updated[i] = !updated[i];
    setCompletedGoals(updated);
    saveGoals(weekGoals, updated);
  };

  const updateGoal = (i: number, val: string) => {
    const updated = [...weekGoals];
    updated[i] = val;
    setWeekGoals(updated);
    saveGoals(updated, completedGoals);
  };

  const loadMetrics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const m = await fetchBusinessMetrics(user.id);
    setMetrics(m);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadMetrics(); }, [loadMetrics, weekOffset]);

  const generateAI = useCallback(async () => {
    if (!metrics || !hasOpenRouterKey()) return;
    setAiLoading(true);
    try {
      const prompt = `You are a business analyst for MyDesignNexus (Karnataka AI automation company).
Analyze this week's business data (${weekLabel}):
- Revenue collected: INR ${metrics.income.thisWeek}
- Invoices sent: ${metrics.invoices.thisWeek.sent} worth INR ${metrics.invoices.thisWeek.amount}
- Payments received: ${metrics.invoices.thisWeek.received} worth INR ${metrics.invoices.thisWeek.receivedAmount}
- Active projects: ${metrics.projects.active}, Completed: ${metrics.projects.completed}, Delayed: ${metrics.projects.delayed}
- New leads: ${metrics.clients.newThisWeek}, Active leads: ${metrics.clients.activeLeads}
- Team hours logged: ${metrics.employees.hoursLogged}h
- Tasks completed: ${metrics.employees.tasksCompleted}/${metrics.employees.tasksTotal}
- Expenses this week: INR ${metrics.expenses.thisWeek}
- Overdue invoices: ${metrics.invoices.overdue} worth INR ${metrics.invoices.overdueAmount}

Provide:
1. WEEK_SUMMARY: 2-sentence summary of how the week went
2. BEST_THING: Best thing that happened this week
3. CONCERN: One thing that needs attention now
4. NEXT_WEEK_PRIORITY: Top 3 priorities for next week (array of strings)
5. MOTIVATION: One motivating insight about the business
Reply JSON only.`;

      const raw = await callGeminiFlash(prompt, 'weekly_summary');
      const parsed = parseJSON<AIWeeklyInsight>(raw);
      if (!Array.isArray(parsed.NEXT_WEEK_PRIORITY)) parsed.NEXT_WEEK_PRIORITY = [String(parsed.NEXT_WEEK_PRIORITY)];
      setAiInsight(parsed);

      const entry: SavedSummary = { weekLabel, weekStart: weekStart.toISOString(), insight: parsed, createdAt: new Date().toISOString() };
      const updated = [entry, ...savedSummaries.filter((s) => s.weekLabel !== weekLabel)].slice(0, 20);
      setSavedSummaries(updated);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    } catch {
      setAiInsight(null);
    }
    setAiLoading(false);
  }, [metrics, weekLabel, weekStart, savedSummaries]);

  useEffect(() => {
    if (!loading && metrics) {
      const cached = savedSummaries.find((s) => s.weekLabel === weekLabel);
      if (cached) {
        setAiInsight(cached.insight);
      } else {
        generateAI();
      }
    }
  }, [loading, weekLabel]);

  const handleExportPDF = async () => {
    if (!metrics || !aiInsight) return;
    await exportWeeklySummaryPDF({ metrics, insight: aiInsight, weekLabel });
  };

  const handleExportWord = () => {
    if (!metrics || !aiInsight) return;
    exportWeeklySummaryWord({ metrics, insight: aiInsight, weekLabel });
  };

  const handleCopyWhatsApp = () => {
    if (!metrics || !aiInsight) return;
    const text = `*Weekly Summary — ${weekLabel}*\n━━━━━━━━━━━━━━━━\nRevenue: ${formatINR(metrics.income.thisWeek)}\nNet: ${formatINR(metrics.income.thisWeek - metrics.expenses.thisWeek)}\nProjects: ${metrics.projects.active} Active\nAlert: ${aiInsight.CONCERN}\n━━━━━━━━━━━━━━━━\n*Priority:* ${aiInsight.NEXT_WEEK_PRIORITY[0] || 'N/A'}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied for WhatsApp');
  };

  const handleCopyEmail = () => {
    if (!metrics || !aiInsight) return;
    const text = `Weekly Business Summary — ${weekLabel}\n\n${aiInsight.WEEK_SUMMARY}\n\nKey Metrics:\n- Revenue: ${formatINR(metrics.income.thisWeek)}\n- Expenses: ${formatINR(metrics.expenses.thisWeek)}\n- Net: ${formatINR(metrics.income.thisWeek - metrics.expenses.thisWeek)}\n- Invoices Sent: ${metrics.invoices.thisWeek.sent}\n- Active Projects: ${metrics.projects.active}\n- New Leads: ${metrics.clients.newThisWeek}\n\nBest This Week: ${aiInsight.BEST_THING}\nNeeds Attention: ${aiInsight.CONCERN}\n\nNext Week Priorities:\n${aiInsight.NEXT_WEEK_PRIORITY.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${aiInsight.MOTIVATION}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied for Email');
  };

  const completedGoalsCount = completedGoals.filter(Boolean).length;
  const setGoalsCount = weekGoals.filter((g) => g.trim()).length;
  const netCashFlow = metrics ? metrics.income.thisWeek - metrics.expenses.thisWeek : 0;

  const toggleSection = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Business Summary</h1>
          <p className="text-sm text-gray-500 mt-1">Your business snapshot — every week</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-lg border transition-all ${showHistory ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10 text-[#FF6B00]' : 'border-white/10 hover:bg-white/5 text-gray-400'}`} title="History">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => { setWeekOffset((o) => o - 1); setAiInsight(null); }} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-300 min-w-[200px] text-center font-medium">{weekLabel}</span>
          <button onClick={() => { if (weekOffset < 0) { setWeekOffset((o) => o + 1); setAiInsight(null); } }} disabled={weekOffset >= 0} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 text-gray-400">
            <ChevronRight className="w-4 h-4" />
          </button>
          {isCurrentWeek && (
            <span className="text-[10px] text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2 py-1 rounded-full font-semibold">Current Week</span>
          )}
        </div>
      </div>

      {showHistory && savedSummaries.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Summary History</h3>
            <span className="text-[10px] text-gray-600 ml-auto">{savedSummaries.length} weeks saved</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {savedSummaries.map((s) => (
              <button
                key={s.weekLabel}
                onClick={() => { setAiInsight(s.insight); setShowHistory(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:bg-white/5 ${s.weekLabel === weekLabel ? 'border-[#FF6B00]/30 bg-[#FF6B00]/5' : 'border-white/5'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-white font-medium">{s.weekLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.insight.BEST_THING}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {metrics && <WeeklyKPICards metrics={metrics} />}

      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending Invoices', value: formatINR(metrics.invoices.pendingAmount), color: 'text-amber-400', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
            { label: 'Net Cash Flow', value: formatINR(netCashFlow), color: netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> },
            { label: 'Payments Received', value: `${metrics.invoices.thisWeek.received}`, color: 'text-blue-400', icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> },
            { label: 'Overdue Invoices', value: metrics.invoices.overdue > 0 ? `${metrics.invoices.overdue} — ${formatINR(metrics.invoices.overdueAmount)}` : 'None', color: metrics.invoices.overdue > 0 ? 'text-red-400' : 'text-emerald-400', icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{s.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 truncate">{s.label}</p>
                <p className={`text-sm font-bold truncate ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGoals(!showGoals)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-[#FF6B00]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Weekly Goals</p>
              {setGoalsCount > 0 && (
                <p className="text-[10px] text-gray-500">{completedGoalsCount}/{setGoalsCount} completed</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {setGoalsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] rounded-full transition-all"
                    style={{ width: `${(completedGoalsCount / setGoalsCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#FF6B00] font-semibold">{Math.round((completedGoalsCount / setGoalsCount) * 100)}%</span>
              </div>
            )}
            {showGoals ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </button>

        {showGoals && (
          <div className="px-5 pb-5 space-y-2 border-t border-white/5 pt-4">
            <p className="text-xs text-gray-500 mb-3">Set your top 3 goals for this week and track completion.</p>
            {weekGoals.map((goal, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${completedGoals[i] ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                <button onClick={() => toggleGoalComplete(i)} className="shrink-0">
                  {completedGoals[i]
                    ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-600" />}
                </button>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateGoal(i, e.target.value)}
                  placeholder={`Goal ${i + 1}...`}
                  className={`flex-1 bg-transparent text-sm outline-none placeholder-gray-600 ${completedGoals[i] ? 'line-through text-gray-500' : 'text-white'}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <WeeklyBreakdownTabs weekStart={weekStart} weekEnd={weekEnd} />

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Weekly Intelligence</h2>
              <p className="text-[10px] text-gray-500">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button
            onClick={generateAI}
            disabled={aiLoading || !hasOpenRouterKey()}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-gray-400 flex items-center gap-1.5 disabled:opacity-50 transition-all"
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
          </button>
        </div>

        <div className="p-5">
          {!hasOpenRouterKey() ? (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Add OpenRouter key in Settings to enable AI insights</p>
            </div>
          ) : aiLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-dark-700/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : aiInsight ? (
            <div className="space-y-3">
              <div
                className="p-4 rounded-xl border border-[#FF6B00]/15 bg-[#FF6B00]/5 cursor-pointer"
                onClick={() => toggleSection('summary')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <p className="text-[10px] text-[#FF6B00] font-semibold uppercase tracking-wider">Week in Summary</p>
                  </div>
                  {expandedSection === 'summary' ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                </div>
                {expandedSection === 'summary' && <p className="text-sm text-gray-200 leading-relaxed">{aiInsight.WEEK_SUMMARY}</p>}
                {expandedSection !== 'summary' && <p className="text-xs text-gray-500 line-clamp-1">{aiInsight.WEEK_SUMMARY}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer" onClick={() => toggleSection('best')}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Best This Week</p>
                    </div>
                    {expandedSection === 'best' ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                  </div>
                  {expandedSection === 'best' ? (
                    <p className="text-sm text-gray-200 leading-relaxed">{aiInsight.BEST_THING}</p>
                  ) : (
                    <p className="text-xs text-gray-500 line-clamp-2">{aiInsight.BEST_THING}</p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 cursor-pointer" onClick={() => toggleSection('concern')}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Needs Attention</p>
                    </div>
                    {expandedSection === 'concern' ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                  </div>
                  {expandedSection === 'concern' ? (
                    <p className="text-sm text-gray-200 leading-relaxed">{aiInsight.CONCERN}</p>
                  ) : (
                    <p className="text-xs text-gray-500 line-clamp-2">{aiInsight.CONCERN}</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <p className="text-[10px] text-[#FF6B00] font-semibold uppercase tracking-wider">Next Week's Top Priorities</p>
                </div>
                <div className="space-y-2">
                  {aiInsight.NEXT_WEEK_PRIORITY.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-[#FF6B00]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Motivation</p>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{aiInsight.MOTIVATION}</p>
              </div>

              {metrics && (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Week at a Glance</p>
                  </div>
                  <div className="flex items-center justify-around">
                    <ScoreRing value={metrics.projects.active} max={Math.max(metrics.projects.active + metrics.projects.completed, 10)} label="Projects Active" color="#FF6B00" />
                    <ScoreRing value={metrics.invoices.thisWeek.received} max={Math.max(metrics.invoices.thisWeek.sent, 5)} label="Invoices Paid" color="#10B981" />
                    <ScoreRing value={metrics.employees.tasksCompleted} max={Math.max(metrics.employees.tasksTotal, 1)} label="Tasks Done" color="#3B82F6" />
                    <ScoreRing value={metrics.clients.newThisWeek} max={Math.max(metrics.clients.activeLeads + metrics.clients.newThisWeek, 5)} label="New Clients" color="#F59E0B" />
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleExportPDF} disabled={!aiInsight} className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity">
          <Download className="w-4 h-4" /> Export PDF
        </button>
        <button onClick={handleExportWord} disabled={!aiInsight} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors">
          <FileText className="w-4 h-4" /> Export Word
        </button>
        <button onClick={handleCopyWhatsApp} disabled={!aiInsight} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2 disabled:opacity-50 transition-colors">
          <Copy className="w-4 h-4" /> Copy for WhatsApp
        </button>
        <button onClick={handleCopyEmail} disabled={!aiInsight} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2 disabled:opacity-50 transition-colors">
          <Copy className="w-4 h-4" /> Copy for Email
        </button>
      </div>
    </div>
  );
}
