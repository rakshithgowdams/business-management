import { useState } from 'react';
import { X, Calculator, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { MetricData } from './MetricCard';

interface ManualInputs {
  revenueGrowth: string;
  invoicePaidPct: string;
  overdueCount: string;
  projectMargin: string;
  newClients: string;
  activeLeads: string;
  taskCompletionPct: string;
  expenseRatioPct: string;
}

interface Props {
  onClose: () => void;
  onGenerate: (metrics: MetricData[], totalScore: number) => void;
}

function computeFromManual(inputs: ManualInputs): { metrics: MetricData[]; totalScore: number } {
  const revenueGrowth = parseFloat(inputs.revenueGrowth) || 0;
  const invoicePaidPct = Math.min(100, Math.max(0, parseFloat(inputs.invoicePaidPct) || 0));
  const overdueCount = parseInt(inputs.overdueCount) || 0;
  const margin = parseFloat(inputs.projectMargin) || 0;
  const newClients = parseInt(inputs.newClients) || 0;
  const activeLeads = parseInt(inputs.activeLeads) || 0;
  const taskCompletion = Math.min(100, Math.max(0, parseFloat(inputs.taskCompletionPct) || 0));
  const expenseRatio = Math.min(200, Math.max(0, parseFloat(inputs.expenseRatioPct) || 0));

  let revenueScore = 0, revenueStatus = 'Declining', revenueStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (revenueGrowth > 10) { revenueScore = 20; revenueStatus = 'Good'; revenueStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (revenueGrowth >= 0) { revenueScore = 12; revenueStatus = 'Flat'; revenueStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else if (revenueGrowth >= -10) { revenueScore = 6; revenueStatus = 'Flat'; revenueStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }

  let invoiceScore = 0, invoiceStatus = 'Critical', invoiceStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (invoicePaidPct >= 80) { invoiceScore = 20; invoiceStatus = 'Healthy'; invoiceStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (invoicePaidPct >= 60) { invoiceScore = 12; invoiceStatus = 'Watch'; invoiceStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else { invoiceScore = 5; }

  let marginScore = 0, marginStatus = 'Losing', marginStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (margin >= 30) { marginScore = 15; marginStatus = 'Strong'; marginStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (margin >= 15) { marginScore = 9; marginStatus = 'Thin'; marginStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else if (margin > 0) { marginScore = 4; }

  const pipelineTotal = newClients + activeLeads;
  let pipelineScore = 0, pipelineStatus = 'Dry', pipelineStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (pipelineTotal >= 5) { pipelineScore = 20; pipelineStatus = 'Growing'; pipelineStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (pipelineTotal >= 2) { pipelineScore = 12; pipelineStatus = 'Slow'; pipelineStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else if (pipelineTotal >= 1) { pipelineScore = 6; }

  let productivityScore = 0, productivityStatus = 'Behind', productivityStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (taskCompletion >= 75) { productivityScore = 15; productivityStatus = 'Productive'; productivityStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (taskCompletion >= 50) { productivityScore = 9; productivityStatus = 'Delayed'; productivityStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else { productivityScore = 4; }

  let expenseScore = 0, expenseStatus = 'Burning', expenseStatusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
  if (expenseRatio <= 50) { expenseScore = 10; expenseStatus = 'Controlled'; expenseStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; }
  else if (expenseRatio <= 70) { expenseScore = 6; expenseStatus = 'High'; expenseStatusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'; }
  else { expenseScore = 2; }

  const metrics: MetricData[] = [
    {
      name: 'Revenue Growth', icon: '💰',
      value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(0)}% vs last month`,
      scoreEarned: revenueScore, scoreMax: 20,
      trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'flat',
      status: revenueStatus, statusColor: revenueStatusColor,
    },
    {
      name: 'Invoice Health', icon: '📋',
      value: overdueCount > 0 ? `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''} — ${invoicePaidPct.toFixed(0)}% paid` : `${invoicePaidPct.toFixed(0)}% of invoices paid`,
      scoreEarned: invoiceScore, scoreMax: 20,
      trend: overdueCount === 0 ? 'up' : 'down',
      status: invoiceStatus, statusColor: invoiceStatusColor,
    },
    {
      name: 'Project Margins', icon: '🚀',
      value: `Avg margin: ${margin.toFixed(0)}%`,
      scoreEarned: marginScore, scoreMax: 15,
      trend: margin >= 30 ? 'up' : margin >= 15 ? 'flat' : 'down',
      status: marginStatus, statusColor: marginStatusColor,
    },
    {
      name: 'Client Pipeline', icon: '👥',
      value: `${newClients} new clients, ${activeLeads} active leads`,
      scoreEarned: pipelineScore, scoreMax: 20,
      trend: pipelineTotal >= 3 ? 'up' : pipelineTotal >= 1 ? 'flat' : 'down',
      status: pipelineStatus, statusColor: pipelineStatusColor,
    },
    {
      name: 'Team Productivity', icon: '⏱️',
      value: `${taskCompletion.toFixed(0)}% tasks completed on time`,
      scoreEarned: productivityScore, scoreMax: 15,
      trend: taskCompletion >= 75 ? 'up' : taskCompletion >= 50 ? 'flat' : 'down',
      status: productivityStatus, statusColor: productivityStatusColor,
    },
    {
      name: 'Expense Control', icon: '💸',
      value: `Expenses: ${expenseRatio.toFixed(0)}% of revenue`,
      scoreEarned: expenseScore, scoreMax: 10,
      trend: expenseRatio <= 50 ? 'up' : expenseRatio <= 70 ? 'flat' : 'down',
      status: expenseStatus, statusColor: expenseStatusColor,
    },
  ];

  const totalScore = revenueScore + invoiceScore + marginScore + pipelineScore + productivityScore + expenseScore;
  return { metrics, totalScore };
}

interface FieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  min?: string;
  max?: string;
}

function Field({ label, hint, value, onChange, suffix, min, max }: FieldProps) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs font-medium text-gray-300">{label}</label>
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          <Info className="w-3 h-3" />
        </button>
      </div>
      {showHint && (
        <p className="text-[10px] text-gray-500 mb-1.5 leading-relaxed">{hint}</p>
      )}
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6B00]/50 focus:bg-white/[0.07] transition-all"
          placeholder="0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const SCORE_BANDS = [
  { min: 80, label: 'Excellent', color: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-400' },
  { min: 60, label: 'Good', color: 'text-blue-400', bar: 'from-blue-500 to-blue-400' },
  { min: 40, label: 'Average', color: 'text-amber-400', bar: 'from-amber-500 to-amber-400' },
  { min: 0, label: 'Needs Work', color: 'text-red-400', bar: 'from-red-600 to-red-400' },
];

export default function ManualHealthScoreModal({ onClose, onGenerate }: Props) {
  const [inputs, setInputs] = useState<ManualInputs>({
    revenueGrowth: '',
    invoicePaidPct: '',
    overdueCount: '',
    projectMargin: '',
    newClients: '',
    activeLeads: '',
    taskCompletionPct: '',
    expenseRatioPct: '',
  });
  const [preview, setPreview] = useState<{ metrics: MetricData[]; totalScore: number } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const set = (key: keyof ManualInputs) => (v: string) => {
    const updated = { ...inputs, [key]: v };
    setInputs(updated);
    const hasAny = Object.values(updated).some(x => x !== '');
    if (hasAny) setPreview(computeFromManual(updated));
    else setPreview(null);
  };

  const handleGenerate = () => {
    const result = computeFromManual(inputs);
    onGenerate(result.metrics, result.totalScore);
    onClose();
  };

  const band = preview ? SCORE_BANDS.find(b => preview.totalScore >= b.min) || SCORE_BANDS[SCORE_BANDS.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center">
              <Calculator className="w-4.5 h-4.5 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Manual Health Score</h2>
              <p className="text-[10px] text-gray-500">Enter your business metrics directly</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="p-3 rounded-xl bg-[#FF6B00]/5 border border-[#FF6B00]/10">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Use this if the auto-calculation is not fetching your data correctly. Enter your actual business numbers below and the score will be calculated instantly. Tap the <Info className="w-3 h-3 inline" /> icon next to any field for guidance.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Revenue & Expenses</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Revenue Growth %"
                hint="Compare this month's revenue to last month. E.g. if last month was ₹1L and this month ₹1.2L, enter 20. Negative means decline."
                value={inputs.revenueGrowth}
                onChange={set('revenueGrowth')}
                suffix="%"
                min="-100"
                max="1000"
              />
              <Field
                label="Expense Ratio %"
                hint="What % of your revenue is spent on expenses? E.g. if income is ₹1L and expenses are ₹60K, enter 60."
                value={inputs.expenseRatioPct}
                onChange={set('expenseRatioPct')}
                suffix="%"
                min="0"
                max="200"
              />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Invoices</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Invoices Paid %"
                hint="What % of all your invoices have been paid? E.g. 8 paid out of 10 total = 80."
                value={inputs.invoicePaidPct}
                onChange={set('invoicePaidPct')}
                suffix="%"
                min="0"
                max="100"
              />
              <Field
                label="Overdue Count"
                hint="How many invoices are currently overdue (past due date and unpaid)?"
                value={inputs.overdueCount}
                onChange={set('overdueCount')}
                min="0"
              />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Projects & Clients</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Project Margin %"
                hint="Average profit margin across your active projects. E.g. if project revenue is ₹2L and costs ₹1.4L, margin is 30%."
                value={inputs.projectMargin}
                onChange={set('projectMargin')}
                suffix="%"
                min="0"
                max="100"
              />
              <Field
                label="New Clients"
                hint="How many new clients did you onboard this month?"
                value={inputs.newClients}
                onChange={set('newClients')}
                min="0"
              />
              <Field
                label="Active Leads"
                hint="How many prospects or leads are currently in your pipeline?"
                value={inputs.activeLeads}
                onChange={set('activeLeads')}
                min="0"
              />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Team Productivity</h3>
            <Field
              label="Task Completion %"
              hint="What % of tasks assigned this month have been completed? E.g. 12 done out of 16 = 75."
              value={inputs.taskCompletionPct}
              onChange={set('taskCompletionPct')}
              suffix="%"
              min="0"
              max="100"
            />
          </div>

          {preview && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Preview Score</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`text-3xl font-black ${band?.color}`}>{preview.totalScore}</span>
                      <span className="text-gray-600 text-sm">/100</span>
                      <span className={`text-xs font-semibold ml-1 ${band?.color}`}>{band?.label}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Breakdown {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <div className="px-4 pb-3">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${band?.bar} transition-all duration-700`}
                    style={{ width: `${preview.totalScore}%` }}
                  />
                </div>
              </div>
              {showBreakdown && (
                <div className="border-t border-white/5 px-4 py-3 space-y-2">
                  {preview.metrics.map(m => (
                    <div key={m.name} className="flex items-center gap-2 text-xs">
                      <span className="text-lg w-5">{m.icon}</span>
                      <span className="text-gray-400 flex-1">{m.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${m.statusColor}`}>{m.status}</span>
                      <span className="text-white font-semibold tabular-nums w-12 text-right">{m.scoreEarned}/{m.scoreMax} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!preview}
            className="flex-1 px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" />
            Generate Score
          </button>
        </div>
      </div>
    </div>
  );
}
