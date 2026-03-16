import { TrendingUp, TrendingDown, Minus, DollarSign, FileText, Briefcase, Users, Clock, AlertTriangle, Target, Zap } from 'lucide-react';
import { formatINR } from '../../../lib/format';
import type { BusinessMetrics } from '../../../lib/businessData';

interface Props {
  metrics: BusinessMetrics;
}

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  trend?: 'up' | 'down' | 'flat' | null;
  trendLabel?: string;
  accentColor: string;
  icon: React.ReactNode;
  badge?: { label: string; color: string };
}

function KPICard({ label, value, sub, subColor = 'text-gray-500', trend, trendLabel, accentColor, icon, badge }: KPICardProps) {
  return (
    <div className={`glass-card rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden border-t-2 ${accentColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <p className="text-[11px] text-gray-500 font-medium leading-tight">{label}</p>
        </div>
        {badge && (
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-black text-white leading-none">{value}</p>
        <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
      </div>
      {trend !== null && trend !== undefined && trendLabel && (
        <div className="flex items-center gap-1 mt-auto pt-1 border-t border-white/5">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
          {trend === 'flat' && <Minus className="w-3 h-3 text-yellow-400" />}
          <span className={`text-[10px] font-semibold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export default function WeeklyKPICards({ metrics: m }: Props) {
  const lastWeekIncome = m.income.lastMonth > 0 ? m.income.lastMonth / 4 : 0;
  const incomeChange = lastWeekIncome > 0 ? ((m.income.thisWeek - lastWeekIncome) / lastWeekIncome) * 100 : 0;
  const netCashFlow = m.income.thisWeek - m.expenses.thisWeek;
  const taskPct = m.employees.tasksTotal > 0 ? Math.round((m.employees.tasksCompleted / m.employees.tasksTotal) * 100) : 0;
  const invoicePaidPct = m.invoices.total > 0 ? Math.round((m.invoices.paid / m.invoices.total) * 100) : 0;
  const incomeTrend: 'up' | 'down' | 'flat' = incomeChange > 5 ? 'up' : incomeChange < -5 ? 'down' : 'flat';

  const cards: KPICardProps[] = [
    {
      label: 'Revenue This Week',
      value: formatINR(m.income.thisWeek),
      sub: netCashFlow >= 0 ? `Net: +${formatINR(netCashFlow)}` : `Net: ${formatINR(netCashFlow)}`,
      subColor: netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400',
      trend: incomeTrend,
      trendLabel: `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(0)}% vs last week`,
      accentColor: 'border-emerald-500/60',
      icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      label: 'Invoices & Payments',
      value: `${m.invoices.thisWeek.sent} sent`,
      sub: `${m.invoices.thisWeek.received} paid · ${formatINR(m.invoices.thisWeek.receivedAmount)} collected`,
      subColor: m.invoices.thisWeek.received > 0 ? 'text-blue-400' : 'text-gray-500',
      trend: null,
      accentColor: 'border-blue-500/60',
      icon: <FileText className="w-3.5 h-3.5 text-blue-400" />,
      badge: m.invoices.overdue > 0 ? { label: `${m.invoices.overdue} overdue`, color: 'text-red-400 border-red-500/30 bg-red-500/10' } : undefined,
    },
    {
      label: 'Projects',
      value: `${m.projects.active} active`,
      sub: `${m.projects.completed} completed this period`,
      subColor: 'text-gray-500',
      trend: m.projects.delayed > 0 ? 'down' : 'up',
      trendLabel: m.projects.delayed > 0 ? `${m.projects.delayed} delayed` : 'All on track',
      accentColor: m.projects.delayed > 0 ? 'border-amber-500/60' : 'border-[#FF6B00]/60',
      icon: <Briefcase className="w-3.5 h-3.5 text-[#FF6B00]" />,
      badge: m.projects.delayed > 0 ? { label: 'Delayed', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' } : undefined,
    },
    {
      label: 'Client Pipeline',
      value: `${m.clients.newThisWeek} new`,
      sub: `${m.clients.activeLeads} leads need follow-up`,
      subColor: m.clients.activeLeads > 3 ? 'text-amber-400' : 'text-gray-500',
      trend: m.clients.newThisWeek > 0 ? 'up' : 'flat',
      trendLabel: m.clients.newThisWeek > 0 ? `+${m.clients.newThisWeek} this week` : 'No new leads',
      accentColor: 'border-cyan-500/60',
      icon: <Users className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      label: 'Team Productivity',
      value: `${taskPct}%`,
      sub: `${m.employees.tasksCompleted}/${m.employees.tasksTotal} tasks completed`,
      subColor: taskPct >= 75 ? 'text-emerald-400' : taskPct >= 50 ? 'text-amber-400' : 'text-red-400',
      trend: taskPct >= 75 ? 'up' : taskPct >= 50 ? 'flat' : 'down',
      trendLabel: taskPct >= 75 ? 'Great pace' : taskPct >= 50 ? 'On track' : 'Behind schedule',
      accentColor: taskPct >= 75 ? 'border-emerald-500/60' : 'border-amber-500/60',
      icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      label: 'Hours Logged',
      value: `${m.employees.hoursLogged.toFixed(0)}h`,
      sub: Object.entries(m.employees.memberHours).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, h]) => `${n.split(' ')[0]}: ${h.toFixed(0)}h`).join(' · ') || 'No data yet',
      subColor: 'text-gray-500',
      trend: null,
      accentColor: 'border-rose-500/60',
      icon: <Clock className="w-3.5 h-3.5 text-rose-400" />,
    },
  ];

  const summaryStats = [
    {
      label: 'Expenses',
      value: formatINR(m.expenses.thisWeek),
      color: 'text-red-400',
      bg: 'bg-red-500/5 border-red-500/10',
      icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
    },
    {
      label: 'Invoice Collection Rate',
      value: `${invoicePaidPct}%`,
      color: invoicePaidPct >= 80 ? 'text-emerald-400' : 'text-amber-400',
      bg: 'bg-white/[0.02] border-white/5',
      icon: <Zap className="w-3 h-3 text-amber-400" />,
    },
    {
      label: 'Overdue Amount',
      value: formatINR(m.invoices.overdueAmount),
      color: m.invoices.overdueAmount > 0 ? 'text-red-400' : 'text-emerald-400',
      bg: m.invoices.overdueAmount > 0 ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10',
      icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
    },
    {
      label: 'Avg Project Margin',
      value: `${m.projects.avgMargin.toFixed(0)}%`,
      color: m.projects.avgMargin >= 30 ? 'text-emerald-400' : m.projects.avgMargin >= 15 ? 'text-amber-400' : 'text-red-400',
      bg: 'bg-white/[0.02] border-white/5',
      icon: <TrendingUp className="w-3 h-3 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => <KPICard key={c.label} {...c} />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {summaryStats.map((c) => (
          <div key={c.label} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${c.bg}`}>
            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 truncate">{c.label}</p>
              <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
