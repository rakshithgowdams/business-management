import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  FileText,
  Users,
  FolderKanban,
  CalendarClock,
  RefreshCw,
  CheckSquare,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface StatsData {
  monthlyIncome: number;
  monthlyExpenses: number;
  prevMonthIncome: number;
  prevMonthExpenses: number;
  activeGoals: number;
  pendingInvoices: number;
  pendingInvoiceAmount: number;
  activeClients: number;
  activeProjects: number;
  activeEMIs: number;
  totalSubscriptions?: number;
  subscriptionCost?: number;
  totalTasks?: number;
  completedTasks?: number;
  totalEmployees?: number;
  gstLiability?: number;
  savingsRate?: number;
  healthScore?: number;
}

function calcChange(current: number, prev: number): { pct: string; up: boolean } {
  if (prev === 0) return { pct: current > 0 ? '+100%' : '0%', up: current > 0 };
  const change = ((current - prev) / prev) * 100;
  return { pct: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, up: change >= 0 };
}

export default function DashboardStats({ data }: { data: StatsData }) {
  const netBalance = data.monthlyIncome - data.monthlyExpenses;
  const prevNet = data.prevMonthIncome - data.prevMonthExpenses;
  const incomeChange = calcChange(data.monthlyIncome, data.prevMonthIncome);
  const expenseChange = calcChange(data.monthlyExpenses, data.prevMonthExpenses);
  const netChange = calcChange(netBalance, prevNet);
  const taskPct = (data.totalTasks ?? 0) > 0
    ? Math.round(((data.completedTasks ?? 0) / (data.totalTasks ?? 1)) * 100)
    : 0;

  const cards = [
    {
      label: 'Monthly Revenue',
      value: formatINR(data.monthlyIncome),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      change: incomeChange,
    },
    {
      label: 'Monthly Expenses',
      value: formatINR(data.monthlyExpenses),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      change: expenseChange,
      invertTrend: true,
    },
    {
      label: 'Net Profit',
      value: formatINR(netBalance),
      icon: Wallet,
      color: netBalance >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: netBalance >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      border: netBalance >= 0 ? 'border-emerald-500/20' : 'border-red-500/20',
      change: netChange,
    },
    {
      label: 'Pending Invoices',
      value: String(data.pendingInvoices),
      subValue: formatINR(data.pendingInvoiceAmount),
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Active Clients',
      value: String(data.activeClients),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Active Projects',
      value: String(data.activeProjects),
      icon: FolderKanban,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Goals In Progress',
      value: String(data.activeGoals),
      icon: Target,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
    },
    {
      label: 'Active EMIs',
      value: String(data.activeEMIs),
      icon: CalendarClock,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      label: 'Subscriptions',
      value: String(data.totalSubscriptions ?? 0),
      subValue: data.subscriptionCost ? formatINR(data.subscriptionCost) + '/mo' : undefined,
      icon: RefreshCw,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      label: 'Tasks',
      value: `${data.completedTasks ?? 0}/${data.totalTasks ?? 0}`,
      subValue: `${taskPct}% complete`,
      icon: CheckSquare,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      label: 'Employees',
      value: String(data.totalEmployees ?? 0),
      icon: Users,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
    },
    {
      label: 'GST Liability',
      value: formatINR(data.gstLiability ?? 0),
      icon: Receipt,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
    {
      label: 'Savings Rate',
      value: `${(data.savingsRate ?? 0).toFixed(1)}%`,
      icon: PiggyBank,
      color: (data.savingsRate ?? 0) >= 20 ? 'text-emerald-400' : (data.savingsRate ?? 0) >= 10 ? 'text-amber-400' : 'text-red-400',
      bg: (data.savingsRate ?? 0) >= 20 ? 'bg-emerald-500/10' : (data.savingsRate ?? 0) >= 10 ? 'bg-amber-500/10' : 'bg-red-500/10',
      border: (data.savingsRate ?? 0) >= 20 ? 'border-emerald-500/20' : (data.savingsRate ?? 0) >= 10 ? 'border-amber-500/20' : 'border-red-500/20',
    },
    {
      label: 'Health Score',
      value: `${data.healthScore ?? 0}/100`,
      icon: Target,
      color: (data.healthScore ?? 0) >= 75 ? 'text-emerald-400' : (data.healthScore ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400',
      bg: (data.healthScore ?? 0) >= 75 ? 'bg-emerald-500/10' : (data.healthScore ?? 0) >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10',
      border: (data.healthScore ?? 0) >= 75 ? 'border-emerald-500/20' : (data.healthScore ?? 0) >= 50 ? 'border-amber-500/20' : 'border-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`glass-card glass-card-hover rounded-xl p-3.5 border ${c.border} transition-all duration-200`}
        >
          <div className="flex items-start justify-between mb-2.5">
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            {c.change && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  (c.invertTrend ? !c.change.up : c.change.up)
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {c.change.pct}
              </span>
            )}
          </div>
          <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{c.label}</p>
          <p className={`text-base font-bold leading-tight ${c.color}`}>{c.value}</p>
          {c.subValue && (
            <p className="text-[9px] text-gray-500 mt-0.5">{c.subValue}</p>
          )}
        </div>
      ))}
    </div>
  );
}
