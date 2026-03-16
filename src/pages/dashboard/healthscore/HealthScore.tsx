import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Download, Loader2, FileText, FileDown, ChevronDown, Clock, History, PenLine } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { fetchBusinessMetrics, type BusinessMetrics } from '../../../lib/businessData';
import { callGeminiFlash, parseJSON } from '../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../lib/ai/models';
import { formatINR } from '../../../lib/format';
import { exportHealthScorePDF, type HealthScoreExportData } from '../../../lib/healthScorePdf';
import { exportHealthScoreWord } from '../../../lib/healthScoreWord';
import HealthScoreRing from './HealthScoreRing';
import MetricCard, { type MetricData } from './MetricCard';
import AIInsightCards from './AIInsightCards';
import ScoreHistoryChart from './ScoreHistoryChart';
import ActionChecklist from './ActionChecklist';
import ManualHealthScoreModal from './ManualHealthScoreModal';

interface AIInsights { TOP_STRENGTH: string; TOP_RISK: string; QUICK_WIN: string; MONTHLY_GOAL: string; SCORE_PREDICTION: string; }
interface ActionItem { id: string; action: string; impact: 'High' | 'Medium' | 'Low'; metric: string; completed: boolean; }

export interface HistoryEntry {
  id: string;
  score: number;
  week_start: string;
  created_at: string;
  metrics_snapshot: MetricData[];
  ai_insights: AIInsights | null;
  ai_actions: ActionItem[];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function computeMetrics(m: BusinessMetrics): { metrics: MetricData[]; totalScore: number } {
  const revenueGrowth = m.income.lastMonth > 0 ? ((m.income.thisMonth - m.income.lastMonth) / m.income.lastMonth) * 100 : (m.income.thisMonth > 0 ? 100 : 0);
  let revenueScore = 0;
  let revenueStatus = 'Declining';
  let revenueStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (revenueGrowth > 10) { revenueScore = 20; revenueStatus = 'Good'; revenueStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (revenueGrowth >= 0) { revenueScore = 12; revenueStatus = 'Flat'; revenueStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else if (revenueGrowth >= -10) { revenueScore = 6; revenueStatus = 'Flat'; revenueStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }

  const invoiceHealth = m.invoices.total > 0 ? (m.invoices.paid / m.invoices.total) * 100 : 100;
  let invoiceScore = 0;
  let invoiceStatus = 'Critical';
  let invoiceStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (invoiceHealth >= 80) { invoiceScore = 20; invoiceStatus = 'Healthy'; invoiceStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (invoiceHealth >= 60) { invoiceScore = 12; invoiceStatus = 'Watch'; invoiceStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else { invoiceScore = 5; }

  const margin = m.projects.avgMargin;
  let marginScore = 0;
  let marginStatus = 'Losing';
  let marginStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (margin >= 30) { marginScore = 15; marginStatus = 'Strong'; marginStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (margin >= 15) { marginScore = 9; marginStatus = 'Thin'; marginStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else if (margin > 0) { marginScore = 4; }

  const pipelineTotal = m.clients.newThisMonth + m.clients.activeLeads;
  let pipelineScore = 0;
  let pipelineStatus = 'Dry';
  let pipelineStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (pipelineTotal >= 5) { pipelineScore = 20; pipelineStatus = 'Growing'; pipelineStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (pipelineTotal >= 2) { pipelineScore = 12; pipelineStatus = 'Slow'; pipelineStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else if (pipelineTotal >= 1) { pipelineScore = 6; }

  const taskCompletion = m.employees.tasksTotal > 0 ? (m.employees.tasksCompleted / m.employees.tasksTotal) * 100 : 100;
  let productivityScore = 0;
  let productivityStatus = 'Behind';
  let productivityStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (taskCompletion >= 75) { productivityScore = 15; productivityStatus = 'Productive'; productivityStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (taskCompletion >= 50) { productivityScore = 9; productivityStatus = 'Delayed'; productivityStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else { productivityScore = 4; }

  const expenseRatio = m.income.thisMonth > 0 ? (m.expenses.thisMonth / m.income.thisMonth) * 100 : (m.expenses.thisMonth > 0 ? 100 : 0);
  let expenseScore = 0;
  let expenseStatus = 'Burning';
  let expenseStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (expenseRatio <= 50) { expenseScore = 10; expenseStatus = 'Controlled'; expenseStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (expenseRatio <= 70) { expenseScore = 6; expenseStatus = 'High'; expenseStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else { expenseScore = 2; }

  const metrics: MetricData[] = [
    {
      name: 'Revenue Growth', icon: '\uD83D\uDCB0',
      value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(0)}% vs last month`,
      scoreEarned: revenueScore, scoreMax: 20,
      trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'flat',
      status: revenueStatus, statusColor: revenueStatusColor,
    },
    {
      name: 'Invoice Health', icon: '\uD83D\uDCCB',
      value: m.invoices.overdue > 0 ? `${m.invoices.overdue} overdue — ${formatINR(m.invoices.overdueAmount)} at risk` : 'All invoices on track',
      scoreEarned: invoiceScore, scoreMax: 20,
      trend: m.invoices.overdue === 0 ? 'up' : 'down',
      status: invoiceStatus, statusColor: invoiceStatusColor,
    },
    {
      name: 'Project Margins', icon: '\uD83D\uDE80',
      value: `Avg margin: ${margin.toFixed(0)}%`,
      scoreEarned: marginScore, scoreMax: 15,
      trend: margin >= 30 ? 'up' : margin >= 15 ? 'flat' : 'down',
      status: marginStatus, statusColor: marginStatusColor,
    },
    {
      name: 'Client Pipeline', icon: '\uD83D\uDC65',
      value: `${m.clients.newThisMonth} new clients, ${m.clients.activeLeads} active leads`,
      scoreEarned: pipelineScore, scoreMax: 20,
      trend: pipelineTotal >= 3 ? 'up' : pipelineTotal >= 1 ? 'flat' : 'down',
      status: pipelineStatus, statusColor: pipelineStatusColor,
    },
    {
      name: 'Team Productivity', icon: '\u23F1\uFE0F',
      value: `${taskCompletion.toFixed(0)}% tasks completed on time`,
      scoreEarned: productivityScore, scoreMax: 15,
      trend: taskCompletion >= 75 ? 'up' : taskCompletion >= 50 ? 'flat' : 'down',
      status: productivityStatus, statusColor: productivityStatusColor,
    },
    {
      name: 'Expense Control', icon: '\uD83D\uDCB8',
      value: `Expenses: ${expenseRatio.toFixed(0)}% of revenue`,
      scoreEarned: expenseScore, scoreMax: 10,
      trend: expenseRatio <= 50 ? 'up' : expenseRatio <= 70 ? 'flat' : 'down',
      status: expenseStatus, statusColor: expenseStatusColor,
    },
  ];

  const totalScore = revenueScore + invoiceScore + marginScore + pipelineScore + productivityScore + expenseScore;
  return { metrics, totalScore };
}

export default function HealthScore() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [score, setScore] = useState(0);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastCalc, setLastCalc] = useState<string | null>(null);
  const [rawMetrics, setRawMetrics] = useState<BusinessMetrics | null>(null);
  const [logoSignedUrl, setLogoSignedUrl] = useState('');
  const [needsWeeklyRefresh, setNeedsWeeklyRefresh] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryEntry | null>(null);

  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const currentWeekStart = getWeekStart(new Date());

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('health_score_history')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: true });

    if (data) {
      const entries: HistoryEntry[] = data.map((d: any) => ({
        id: d.id,
        score: d.score,
        week_start: d.week_start,
        created_at: d.created_at,
        metrics_snapshot: d.metrics_snapshot || [],
        ai_insights: d.ai_insights || null,
        ai_actions: d.ai_actions || [],
      }));
      setHistory(entries);

      const thisWeek = entries.find((e) => e.week_start === currentWeekStart);
      if (thisWeek) {
        setScore(thisWeek.score);
        setMetrics(thisWeek.metrics_snapshot);
        setAiInsights(thisWeek.ai_insights);
        setActions(thisWeek.ai_actions);
        setLastCalc(new Date(thisWeek.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
        setNeedsWeeklyRefresh(false);
      } else {
        setNeedsWeeklyRefresh(true);
      }

      return thisWeek;
    }
    setNeedsWeeklyRefresh(true);
    return null;
  }, [user, currentWeekStart]);

  const saveToSupabase = useCallback(async (
    totalScore: number,
    metricsData: MetricData[],
    insights: AIInsights | null,
    actionItems: ActionItem[]
  ) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('health_score_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', currentWeekStart)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('health_score_history')
        .update({
          score: totalScore,
          metrics_snapshot: metricsData,
          ai_insights: insights,
          ai_actions: actionItems,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('health_score_history')
        .insert({
          user_id: user.id,
          score: totalScore,
          metrics_snapshot: metricsData,
          ai_insights: insights,
          ai_actions: actionItems,
          week_start: currentWeekStart,
        });
    }

    await loadHistory();
  }, [user, currentWeekStart, loadHistory]);

  const calculate = useCallback(async () => {
    if (!user) return;
    setCalculating(true);
    const bm = await fetchBusinessMetrics(user.id);
    setRawMetrics(bm);
    const { metrics: m, totalScore } = computeMetrics(bm);
    setMetrics(m);
    setScore(totalScore);
    setLastCalc(new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));

    const { data: profile } = await supabase.from('profiles').select('business_logo_url').eq('id', user.id).maybeSingle();
    if (profile?.business_logo_url) {
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(profile.business_logo_url, 3600);
      if (signed?.signedUrl) setLogoSignedUrl(signed.signedUrl);
    }

    setCalculating(false);
    setLoading(false);
    setNeedsWeeklyRefresh(false);
    setSelectedHistory(null);

    return { metrics: m, totalScore };
  }, [user]);

  const fetchAI = useCallback(async (metricsForAI?: MetricData[], scoreForAI?: number) => {
    const m = metricsForAI || metrics;
    const s = scoreForAI || score;
    if (!rawMetrics || !hasOpenRouterKey() || m.length === 0) return { insights: null as AIInsights | null, actions: [] as ActionItem[] };
    setAiLoading(true);
    try {
      const metricsText = m.map((met) => `${met.name}: ${met.value} (${met.scoreEarned}/${met.scoreMax}pts, ${met.status})`).join('\n');
      const prompt = `You are a business analyst for MyDesignNexus, a Karnataka-based AI automation company.
Based on this business data:
${metricsText}
Overall score: ${s}/100

Provide:
1. TOP_STRENGTH: Their biggest business strength (1 sentence)
2. TOP_RISK: Their biggest risk right now (1 sentence)
3. QUICK_WIN: One action they can take THIS WEEK to improve their score (specific + actionable)
4. MONTHLY_GOAL: One key goal for next 30 days
5. SCORE_PREDICTION: Will score go up or down next month and why (1 sentence)

Also provide 5 ACTION_ITEMS as an array, each with: action (string), impact (High/Medium/Low), metric (which metric it improves).
Focus on weak areas.

Reply in JSON format only: { "TOP_STRENGTH": "", "TOP_RISK": "", "QUICK_WIN": "", "MONTHLY_GOAL": "", "SCORE_PREDICTION": "", "ACTION_ITEMS": [{"action":"","impact":"","metric":""}] }`;

      const raw = await callGeminiFlash(prompt, 'health_score');
      const parsed = parseJSON<AIInsights & { ACTION_ITEMS: { action: string; impact: string; metric: string }[] }>(raw);
      setAiInsights(parsed);
      const actionItems: ActionItem[] = (parsed.ACTION_ITEMS || []).map((a, i) => ({
        id: `act-${i}`,
        action: a.action,
        impact: (a.impact as 'High' | 'Medium' | 'Low') || 'Medium',
        metric: a.metric,
        completed: false,
      }));
      setActions(actionItems);
      setAiLoading(false);
      return { insights: parsed as AIInsights, actions: actionItems };
    } catch {
      setAiInsights(null);
      setAiLoading(false);
      return { insights: null as AIInsights | null, actions: [] as ActionItem[] };
    }
  }, [rawMetrics, metrics, score]);

  const runFullRefresh = useCallback(async () => {
    const result = await calculate();
    if (!result) return;
    const aiResult = await fetchAI(result.metrics, result.totalScore);
    if (aiResult.insights) {
      setAiInsights(aiResult.insights);
      setActions(aiResult.actions);
    }
    await saveToSupabase(result.totalScore, result.metrics, aiResult.insights, aiResult.actions);
  }, [calculate, fetchAI, saveToSupabase]);

  useEffect(() => {
    const init = async () => {
      const existing = await loadHistory();
      if (!existing) {
        await runFullRefresh();
      } else {
        const bm = await fetchBusinessMetrics(user!.id);
        setRawMetrics(bm);

        const { data: profile } = await supabase.from('profiles').select('business_logo_url').eq('id', user!.id).maybeSingle();
        if (profile?.business_logo_url) {
          const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(profile.business_logo_url, 3600);
          if (signed?.signedUrl) setLogoSignedUrl(signed.signedUrl);
        }
        setLoading(false);
      }
    };
    if (user) init();
  }, [user]);

  useEffect(() => {
    if (needsWeeklyRefresh && !calculating && user && !loading) {
      runFullRefresh();
    }
  }, [needsWeeklyRefresh, calculating, user, loading]);

  const handleRecalculate = async () => {
    await runFullRefresh();
  };

  const viewHistoryEntry = (entry: HistoryEntry) => {
    setSelectedHistory(entry);
    setScore(entry.score);
    setMetrics(entry.metrics_snapshot);
    setAiInsights(entry.ai_insights);
    setActions(entry.ai_actions);
    setLastCalc(new Date(entry.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  const backToCurrentWeek = async () => {
    setSelectedHistory(null);
    const thisWeek = history.find((e) => e.week_start === currentWeekStart);
    if (thisWeek) {
      setScore(thisWeek.score);
      setMetrics(thisWeek.metrics_snapshot);
      setAiInsights(thisWeek.ai_insights);
      setActions(thisWeek.ai_actions);
      setLastCalc(new Date(thisWeek.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }
  };

  const [showManualModal, setShowManualModal] = useState(false);

  const handleManualGenerate = useCallback(async (manualMetrics: MetricData[], manualScore: number) => {
    setMetrics(manualMetrics);
    setScore(manualScore);
    setLastCalc(new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    setSelectedHistory(null);
    setNeedsWeeklyRefresh(false);
    await saveToSupabase(manualScore, manualMetrics, aiInsights, actions);
  }, [saveToSupabase, aiInsights, actions]);

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const legacyHistory = history.map((h) => {
    const d = new Date(h.week_start);
    return { month: d.toLocaleDateString('en-IN', { month: 'long' }), year: d.getFullYear(), score: h.score };
  });

  const getExportData = (): HealthScoreExportData => ({
    score,
    monthLabel,
    metrics,
    aiInsights,
    actions,
    history: legacyHistory,
    completedActionIds: [],
    rawMetrics,
    businessLogoUrl: logoSignedUrl || undefined,
  });

  const handleExportPDF = async () => {
    setExporting(true);
    setExportOpen(false);
    try {
      await exportHealthScorePDF(getExportData());
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = () => {
    setExporting(true);
    setExportOpen(false);
    try {
      exportHealthScoreWord(getExportData());
    } finally {
      setExporting(false);
    }
  };

  const formatWeekLabel = (weekStart: string) => {
    const d = new Date(weekStart);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

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
          <h1 className="text-2xl font-bold">Business Health Score</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered weekly snapshot of your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          {lastCalc && !selectedHistory && <span className="text-xs text-gray-600">Last: Today, {lastCalc}</span>}
          {selectedHistory && (
            <button
              onClick={backToCurrentWeek}
              className="px-3 py-2 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm flex items-center gap-2 transition-colors hover:bg-brand-500/20"
            >
              <Clock className="w-4 h-4" /> Back to Current Week
            </button>
          )}
          <button
            onClick={() => setShowManualModal(true)}
            disabled={calculating}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2 transition-colors disabled:opacity-40"
            title="Manually enter your business metrics to generate a score"
          >
            <PenLine className="w-4 h-4" /> Manual Input
          </button>
          <button
            onClick={handleRecalculate}
            disabled={calculating || !!selectedHistory}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} /> Recalculate
          </button>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={exporting}
              className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 transition-all"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-dark-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-red-400" />
                  Export as PDF
                </button>
                <div className="border-t border-white/5" />
                <button
                  onClick={handleExportWord}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  Export as Word
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedHistory && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <History className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            Viewing historical snapshot: <span className="font-semibold text-white">{formatWeekLabel(selectedHistory.week_start)}</span>
          </p>
        </div>
      )}

      {score === 0 && !calculating && !selectedHistory && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <PenLine className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-300 font-medium">Auto-calculation returned no data</p>
            <p className="text-xs text-gray-500 mt-0.5">If your data is not syncing, use <strong className="text-white">Manual Input</strong> to enter your business numbers directly and generate a score.</p>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
          >
            Manual Input
          </button>
        </div>
      )}

      <div className="flex justify-center">
        <HealthScoreRing score={score} month={selectedHistory ? formatWeekLabel(selectedHistory.week_start) : monthLabel} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((m) => <MetricCard key={m.name} metric={m} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">AI Business Intelligence</h2>
          {!hasOpenRouterKey() ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500">Add OpenRouter key in Settings to use AI features</p>
            </div>
          ) : (
            <AIInsightCards insights={aiInsights} loading={aiLoading} />
          )}
        </div>
        <div className="space-y-6">
          <ScoreHistoryChart
            history={history}
            currentWeekStart={currentWeekStart}
            selectedWeekStart={selectedHistory?.week_start || null}
            onSelectEntry={viewHistoryEntry}
          />
          <ActionChecklist actions={actions} />
        </div>
      </div>

      {showManualModal && (
        <ManualHealthScoreModal
          onClose={() => setShowManualModal(false)}
          onGenerate={handleManualGenerate}
        />
      )}
    </div>
  );
}
