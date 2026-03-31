import { useEffect, useState, useCallback, useRef } from 'react';
import { LayoutGrid, GripVertical, RefreshCw, Eye, EyeOff, X, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import DashboardStats from './home/DashboardStats';
import RevenueChart from './home/RevenueChart';
import CashFlowChart from './home/CashFlowChart';
import ExpenseBreakdown from './home/ExpenseBreakdown';
import InvoiceQuotationWidget from './home/InvoiceQuotationWidget';
import ProjectsClientsWidget from './home/ProjectsClientsWidget';
import GoalsProgressWidget from './home/GoalsProgressWidget';
import RecentActivity from './home/RecentActivity';
import UpcomingPayments from './home/UpcomingPayments';
import ProfitMarginChart from './home/ProfitMarginChart';
import TopIncomeSourcesWidget from './home/TopIncomeSourcesWidget';
import WeeklyActivityChart from './home/WeeklyActivityChart';
import TasksOverviewWidget from './home/TasksOverviewWidget';
import EmployeesWidget from './home/EmployeesWidget';
import HealthScoreWidget from './home/HealthScoreWidget';
import GSTWidget from './home/GSTWidget';
import SavingsRateWidget from './home/SavingsRateWidget';
import SubscriptionSummaryWidget from './home/SubscriptionSummaryWidget';
import FollowUpWidget from './home/FollowUpWidget';
import HROverviewWidget from './home/HROverviewWidget';
import DigitalMarketingWidget from './home/DigitalMarketingWidget';
import PipelineWidget from './home/PipelineWidget';

const WIDGET_ORDER_KEY = 'dashboard_widget_order_v2';
const WIDGET_VISIBILITY_KEY = 'dashboard_widget_visibility_v2';

const DEFAULT_WIDGETS = [
  'stats',
  'invoiceQuotation',
  'revenue',
  'profitMargin',
  'cashFlow',
  'weeklyActivity',
  'expenseBreakdown',
  'topIncomeSources',
  'pipeline',
  'projectsClients',
  'tasksOverview',
  'goalsProgress',
  'healthScore',
  'gst',
  'savingsRate',
  'employees',
  'hrOverview',
  'digitalMarketing',
  'subscriptions',
  'upcomingPayments',
  'followUps',
  'recentActivity',
];

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1).toISOString().split('T')[0];
  const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

type LoadedSections = {
  stats: boolean;
  charts: boolean;
  pipeline: boolean;
  projects: boolean;
  tasks: boolean;
  employees: boolean;
  finance: boolean;
  followups: boolean;
  hr: boolean;
  digitalMarketing: boolean;
  salesPipeline: boolean;
};

function WidgetSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div className={`glass-card rounded-xl p-4 animate-pulse ${tall ? 'h-64' : 'h-40'}`}>
      <div className="w-24 h-3 bg-white/5 rounded mb-4" />
      <div className="w-full h-4 bg-white/5 rounded mb-2" />
      <div className="w-3/4 h-4 bg-white/5 rounded mb-2" />
      <div className="w-1/2 h-4 bg-white/5 rounded" />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const loadingRef = useRef(false);

  const [loaded, setLoaded] = useState<LoadedSections>({
    stats: false, charts: false, pipeline: false, projects: false,
    tasks: false, employees: false, finance: false, followups: false,
    hr: false, digitalMarketing: false, salesPipeline: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const [statsData, setStatsData] = useState({
    monthlyIncome: 0, monthlyExpenses: 0, prevMonthIncome: 0, prevMonthExpenses: 0,
    activeGoals: 0, pendingInvoices: 0, pendingInvoiceAmount: 0,
    activeClients: 0, activeProjects: 0, activeEMIs: 0,
    totalSubscriptions: 0, subscriptionCost: 0,
    totalTasks: 0, completedTasks: 0,
    totalEmployees: 0, gstLiability: 0, savingsRate: 0, healthScore: 0,
  });

  const [barData, setBarData] = useState<{ name: string; income: number; expenses: number }[]>([]);
  const [lineData, setLineData] = useState<{ name: string; balance: number; income: number; expenses: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [incomeSources, setIncomeSources] = useState<{ source: string; amount: number; count: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; income: number; expenses: number }[]>([]);

  const [pipelineData, setPipelineData] = useState({
    invoices: { draft: { count: 0, amount: 0 }, sent: { count: 0, amount: 0 }, paid: { count: 0, amount: 0 }, overdue: { count: 0, amount: 0 }, total: 0, totalAmount: 0 },
    quotations: { draft: { count: 0, amount: 0 }, sent: { count: 0, amount: 0 }, accepted: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 }, total: 0, totalAmount: 0, conversionRate: 0 },
  });

  const [projectsData, setProjectsData] = useState<{ id: string; name: string; status: string; budget: number; revenue: number }[]>([]);
  const [clientsData, setClientsData] = useState<{ id: string; name: string; company: string; totalRevenue: number; invoiceCount: number }[]>([]);
  const [goalsData, setGoalsData] = useState<{ id: string; name: string; target_amount: number; current_amount: number; target_date: string; status: string }[]>([]);
  const [transactions, setTransactions] = useState<{ id: string; type: 'income' | 'expense'; description: string; amount: number; date: string; category: string }[]>([]);
  const [emisData, setEmisData] = useState<{ id: string; loan_name: string; emi_amount: number; next_due_date: string }[]>([]);
  const [subsData, setSubsData] = useState<{ id: string; name: string; amount: number; next_billing_date: string; billing_cycle: string }[]>([]);

  const [tasksData, setTasksData] = useState<{ id: string; title: string; status: string; priority: string; due_date: string | null }[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });
  const [employeesData, setEmployeesData] = useState<{ id: string; name: string; role: string; department: string; status: string; salary: number }[]>([]);
  const [employeeStats, setEmployeeStats] = useState({ total: 0, active: 0, onLeave: 0, totalPayroll: 0, departmentBreakdown: [] as { dept: string; count: number }[] });
  const [healthScoreData, setHealthScoreData] = useState({ score: 0, previousScore: 0, label: '', history: [] as { date: string; score: number }[], metrics: [] as { label: string; score: number; weight: number }[] });
  const [gstData, setGstData] = useState({ totalRevenue: 0, gstCollected: 0, gstPaid: 0, netGST: 0, monthlyBreakdown: [] as { month: string; collected: number; paid: number }[] });
  const [savingsData, setSavingsData] = useState({ currentMonthIncome: 0, currentMonthExpenses: 0, totalSaved: 0, monthlyData: [] as { month: string; income: number; expenses: number; saved: number; rate: number }[] });
  const [followUpsData, setFollowUpsData] = useState<{ id: string; client_name: string; follow_up_date: string; message_preview: string; status: string; channel: string }[]>([]);
  const [followUpStats, setFollowUpStats] = useState({ total: 0, pending: 0, completed: 0, overdue: 0 });

  const [hrStats, setHrStats] = useState({ pendingLeaves: 0, approvedLeaves: 0, openJobPostings: 0, pendingAppraisals: 0, totalLeaveRequests: 0, recentLeaves: [] as { id: string; employee_name: string; leave_type_name: string; from_date: string; days_count: number; status: string }[] });
  const [dmStats, setDmStats] = useState({ activeCampaigns: 0, totalLeads: 0, convertedLeads: 0, totalSpend: 0, totalRevenue: 0, totalImpressions: 0, totalClicks: 0, avgROAS: 0, topCampaigns: [] as { id: string; name: string; channel: string; status: string; spend: number; conversions: number; roas: number }[] });
  const [pipelineStats, setPipelineStats] = useState({ stages: {} as Record<string, { count: number; value: number }>, totalDeals: 0, totalValue: 0, wonValue: 0, wonCount: 0, lostCount: 0, avgDealValue: 0, winRate: 0, hotDeals: [] as { id: string; title: string; company_name: string; deal_value: number; stage: string; probability: number }[] });

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = DEFAULT_WIDGETS.filter(w => !parsed.includes(w));
        return [...parsed, ...missing];
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDGETS;
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_VISIBILITY_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set<string>();
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (loadingRef.current && !forceRefresh) return;
    loadingRef.current = true;
    if (forceRefresh) {
      setRefreshing(true);
      setLoaded({ stats: false, charts: false, pipeline: false, projects: false, tasks: false, employees: false, finance: false, followups: false, hr: false, digitalMarketing: false, salesPipeline: false });
    }

    const now = new Date();
    const { start: monthStart, end: monthEnd } = getMonthRange(now.getFullYear(), now.getMonth());
    const { start: prevStart, end: prevEnd } = getMonthRange(now.getFullYear(), now.getMonth() - 1);
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    const range6m = sixMonthsAgo.toISOString().split('T')[0];

    const profilePromise = supabase.from('profiles').select('full_name,business_name,avatar_url').eq('id', user.id).maybeSingle().then(r => r.data);

    profilePromise.then(p => { if (p?.full_name) setUserName(p.full_name.split(' ')[0]); });

    const incomePromise = supabase.from('income').select('id,amount,date,category,source,notes,client_name,project_id').eq('user_id', user.id).gte('date', range6m).order('date', { ascending: false }).limit(500).then(r => r.data ?? []);

    const expensePromise = supabase.from('expenses').select('id,amount,date,category,notes,type,payment_method,project_id,vendor').eq('user_id', user.id).gte('date', range6m).order('date', { ascending: false }).limit(500).then(r => r.data ?? []);

    const invoicePromise = supabase.from('invoices').select('id,invoice_number,to_client_name,total,status,invoice_date,due_date,tax_amount,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100).then(r => r.data ?? []);

    const quotationPromise = supabase.from('quotations').select('id,quote_number,to_client_name,total,status,quote_date,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(r => r.data ?? []);

    const goalsPromise = supabase.from('goals').select('id,name,type,target_amount,current_amount,target_date,status').eq('user_id', user.id).order('target_date', { ascending: true }).limit(50).then(r => r.data ?? []);

    const projectsPromise = supabase.from('projects').select('id,name,client_name,status,budget,revenue,start_date,end_date').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100).then(r => r.data ?? []);

    const clientsPromise = supabase.from('clients').select('id,full_name,company_name,primary_email,primary_phone,status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100).then(r => r.data ?? []);

    const emisPromise = supabase.from('emi_loans').select('id,loan_name,emi_amount,start_date,tenure_months,interest_rate,lender_name,total_amount').eq('user_id', user.id).limit(30).then(r => r.data ?? []);

    const subsPromise = supabase.from('subscriptions').select('id,service_name,amount,billing_cycle,next_billing_date,status,category').eq('user_id', user.id).eq('status', 'active').limit(50).then(r => r.data ?? []);

    const tasksPromise = supabase.from('work_tasks').select('id,title,status,priority,due_date,assigned_to_id,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(r => r.data ?? []);

    const employeesPromise = supabase.from('employees').select('id,full_name,work_email,department,job_role,monthly_salary,status,join_date').eq('user_id', user.id).limit(100).then(r => r.data ?? []);

    const healthPromise = supabase.from('health_score_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12).then(r => r.data ?? []);

    const followUpsPromise = supabase.from('followup_history').select('id,client_name,sent_at,message_preview,status,channel').eq('user_id', user.id).order('sent_at', { ascending: false }).limit(20).then(r => r.data ?? []);

    Promise.all([incomePromise, expensePromise, invoicePromise, goalsPromise, subsPromise, emisPromise]).then(
      ([allIncome, allExpenses, allInvoices, allGoals, allSubs, allEmis]) => {
        const thisMonthIncome = allIncome.filter((i: {date: string; amount: number}) => i.date >= monthStart && i.date <= monthEnd).reduce((s: number, i: {amount: number}) => s + Number(i.amount), 0);
        const thisMonthExpenses = allExpenses.filter((e: {date: string; amount: number}) => e.date >= monthStart && e.date <= monthEnd).reduce((s: number, e: {amount: number}) => s + Number(e.amount), 0);
        const prevMonthIncome = allIncome.filter((i: {date: string; amount: number}) => i.date >= prevStart && i.date <= prevEnd).reduce((s: number, i: {amount: number}) => s + Number(i.amount), 0);
        const prevMonthExpenses = allExpenses.filter((e: {date: string; amount: number}) => e.date >= prevStart && e.date <= prevEnd).reduce((s: number, e: {amount: number}) => s + Number(e.amount), 0);
        const pendingInvs = allInvoices.filter((i: {status: string}) => ['draft', 'sent', 'overdue'].includes(i.status));
        const subMonthly = allSubs.reduce((s: number, sub: {amount: number; billing_cycle: string}) => {
          const amt = Number(sub.amount);
          const cycle = sub.billing_cycle || 'monthly';
          if (cycle === 'yearly' || cycle === 'annual') return s + amt / 12;
          if (cycle === 'quarterly') return s + amt / 3;
          if (cycle === 'weekly') return s + amt * 4.33;
          return s + amt;
        }, 0);
        const gstCollected = allInvoices.filter((i: {status: string}) => i.status === 'paid').reduce((s: number, i: {tax_amount?: number}) => s + Number(i.tax_amount || 0), 0);
        const savingsRate = thisMonthIncome > 0 ? Math.max(0, ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100) : 0;

        setStatsData(prev => ({
          ...prev,
          monthlyIncome: thisMonthIncome, monthlyExpenses: thisMonthExpenses,
          prevMonthIncome, prevMonthExpenses,
          activeGoals: allGoals.filter((g: {status: string}) => g.status !== 'completed').length,
          pendingInvoices: pendingInvs.length,
          pendingInvoiceAmount: pendingInvs.reduce((s: number, i: {total?: number}) => s + Number(i.total || 0), 0),
          activeEMIs: allEmis.length,
          totalSubscriptions: allSubs.length,
          subscriptionCost: subMonthly,
          gstLiability: gstCollected,
          savingsRate,
        }));

        setGoalsData(allGoals.map((g: {id: string; name: string; target_amount: number; current_amount: number; target_date: string; status: string}) => ({
          id: g.id, name: g.name, target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount), target_date: g.target_date, status: g.status,
        })));

        setEmisData(allEmis.map((e: {id: string; loan_name: string; emi_amount: number; start_date?: string}) => {
          const startDate = e.start_date ? new Date(e.start_date) : new Date();
          const today = new Date();
          const next = new Date(startDate);
          while (next <= today) next.setMonth(next.getMonth() + 1);
          return { id: e.id, loan_name: e.loan_name, emi_amount: Number(e.emi_amount), next_due_date: next.toISOString().split('T')[0] };
        }));
        setSubsData(allSubs.map((s: {id: string; service_name?: string; amount: number; next_billing_date?: string; billing_cycle?: string}) => ({
          id: s.id, name: s.service_name || '', amount: Number(s.amount),
          next_billing_date: s.next_billing_date || '', billing_cycle: s.billing_cycle || '',
        })));

        const txIncome = allIncome.slice(-15).map((i: {id: string; source?: string; client_name?: string; amount: number; date: string}) => ({ id: i.id, type: 'income' as const, description: (i.source || 'Income') + (i.client_name ? ` - ${i.client_name}` : ''), amount: Number(i.amount), date: i.date, category: i.source || 'Income' }));
        const txExpense = allExpenses.slice(-15).map((e: {id: string; notes?: string; vendor?: string; category?: string; amount: number; date: string}) => ({ id: e.id, type: 'expense' as const, description: e.notes || e.vendor || e.category || 'Expense', amount: Number(e.amount), date: e.date, category: e.category || 'Other' }));
        setTransactions([...txIncome, ...txExpense].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12));

        setLoaded(p => ({ ...p, stats: true }));
      }
    ).catch(() => setLoaded(p => ({ ...p, stats: true })));

    Promise.all([incomePromise, expensePromise, invoicePromise]).then(([allIncome, allExpenses, allInvoices]) => {
      const months: { name: string; income: number; expenses: number }[] = [];
      const balanceLine: { name: string; balance: number; income: number; expenses: number }[] = [];
      const savingsMonthly: { month: string; income: number; expenses: number; saved: number; rate: number }[] = [];
      const gstMonthly: { month: string; collected: number; paid: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { start: mStart, end: mEnd } = getMonthRange(d.getFullYear(), d.getMonth());
        const mName = d.toLocaleString('en-IN', { month: 'short' });
        const inc = allIncome.filter((x: {date: string; amount: number}) => x.date >= mStart && x.date <= mEnd).reduce((s: number, x: {amount: number}) => s + Number(x.amount), 0);
        const exp = allExpenses.filter((x: {date: string; amount: number}) => x.date >= mStart && x.date <= mEnd).reduce((s: number, x: {amount: number}) => s + Number(x.amount), 0);
        const mGstCollected = allInvoices.filter((x: {status: string; created_at?: string}) => x.status === 'paid' && x.created_at?.slice(0, 7) === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`).reduce((s: number, x: {tax_amount?: number}) => s + Number(x.tax_amount || 0), 0);
        months.push({ name: mName, income: inc, expenses: exp });
        balanceLine.push({ name: mName, balance: inc - exp, income: inc, expenses: exp });
        savingsMonthly.push({ month: mName, income: inc, expenses: exp, saved: inc - exp, rate: inc > 0 ? Math.max(0, ((inc - exp) / inc) * 100) : 0 });
        gstMonthly.push({ month: mName, collected: mGstCollected, paid: 0 });
      }
      setBarData(months);
      setLineData(balanceLine);

      const catMap = new Map<string, number>();
      allExpenses.forEach((e: {category?: string; amount: number}) => catMap.set(e.category || 'Other', (catMap.get(e.category || 'Other') || 0) + Number(e.amount)));
      setPieData(Array.from(catMap.entries()).map(([name, value]) => ({ name, value })));
      setTotalExpenses(allExpenses.reduce((s: number, e: {amount: number}) => s + Number(e.amount), 0));

      const srcMap = new Map<string, { amount: number; count: number }>();
      allIncome.forEach((i: {source?: string; amount: number}) => {
        const key = i.source || 'Other';
        const ex = srcMap.get(key) || { amount: 0, count: 0 };
        srcMap.set(key, { amount: ex.amount + Number(i.amount), count: ex.count + 1 });
      });
      setIncomeSources(Array.from(srcMap.entries()).map(([source, v]) => ({ source, amount: v.amount, count: v.count })));

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekIncome = allIncome.filter((i: {date: string}) => i.date >= weekStart && i.date <= weekEnd);
      const weekExpenses = allExpenses.filter((e: {date: string}) => e.date >= weekStart && e.date <= weekEnd);
      const weekStart_d = new Date(weekStart);
      setWeeklyData(days.map((day, idx) => {
        const d = new Date(weekStart_d);
        d.setDate(weekStart_d.getDate() + idx);
        const dStr = d.toISOString().split('T')[0];
        const inc = weekIncome.filter((i: {date: string; amount: number}) => i.date === dStr).reduce((s: number, i: {amount: number}) => s + Number(i.amount), 0);
        const exp = weekExpenses.filter((e: {date: string; amount: number}) => e.date === dStr).reduce((s: number, e: {amount: number}) => s + Number(e.amount), 0);
        return { day, income: inc, expenses: exp };
      }));

      const gstCollected = allInvoices.filter((i: {status: string}) => i.status === 'paid').reduce((s: number, i: {tax_amount?: number}) => s + Number(i.tax_amount || 0), 0);
      setGstData({
        totalRevenue: allInvoices.filter((i: {status: string}) => i.status === 'paid').reduce((s: number, i: {total?: number}) => s + Number(i.total || 0), 0),
        gstCollected, gstPaid: 0, netGST: gstCollected, monthlyBreakdown: gstMonthly,
      });

      const totalSavedAllTime = allIncome.reduce((s: number, i: {amount: number}) => s + Number(i.amount), 0) - allExpenses.reduce((s: number, e: {amount: number}) => s + Number(e.amount), 0);
      const thisMonthIncome2 = allIncome.filter((i: {date: string; amount: number}) => i.date >= monthStart && i.date <= monthEnd).reduce((s: number, i: {amount: number}) => s + Number(i.amount), 0);
      const thisMonthExpenses2 = allExpenses.filter((e: {date: string; amount: number}) => e.date >= monthStart && e.date <= monthEnd).reduce((s: number, e: {amount: number}) => s + Number(e.amount), 0);
      setSavingsData({ currentMonthIncome: thisMonthIncome2, currentMonthExpenses: thisMonthExpenses2, totalSaved: Math.max(0, totalSavedAllTime), monthlyData: savingsMonthly });

      setLoaded(p => ({ ...p, charts: true, finance: true }));
    }).catch(() => setLoaded(p => ({ ...p, charts: true, finance: true })));

    Promise.all([invoicePromise, quotationPromise]).then(([allInvoices, allQuotations]) => {
      const invByStatus = (status: string) => {
        const f = allInvoices.filter((i: {status: string}) => i.status === status);
        return { count: f.length, amount: f.reduce((s: number, i: {total?: number}) => s + Number(i.total || 0), 0) };
      };
      const qtByStatus = (status: string) => {
        const f = allQuotations.filter((q: {status: string}) => q.status === status);
        return { count: f.length, amount: f.reduce((s: number, q: {total?: number}) => s + Number(q.total || 0), 0) };
      };
      const acceptedCount = allQuotations.filter((q: {status: string}) => q.status === 'accepted').length;
      const decidedCount = allQuotations.filter((q: {status: string}) => ['accepted', 'rejected'].includes(q.status)).length;
      setPipelineData({
        invoices: { draft: invByStatus('draft'), sent: invByStatus('sent'), paid: invByStatus('paid'), overdue: invByStatus('overdue'), total: allInvoices.length, totalAmount: allInvoices.reduce((s: number, i: {total?: number}) => s + Number(i.total || 0), 0) },
        quotations: { draft: qtByStatus('draft'), sent: qtByStatus('sent'), accepted: qtByStatus('accepted'), rejected: qtByStatus('rejected'), total: allQuotations.length, totalAmount: allQuotations.reduce((s: number, q: {total?: number}) => s + Number(q.total || 0), 0), conversionRate: decidedCount > 0 ? (acceptedCount / decidedCount) * 100 : 0 },
      });
      setLoaded(p => ({ ...p, pipeline: true }));
    }).catch(() => setLoaded(p => ({ ...p, pipeline: true })));

    Promise.all([projectsPromise, clientsPromise, invoicePromise]).then(([allProjects, allClients, allInvoices]) => {
      const activeProjects = allProjects.filter((pr: {status: string}) => ['active', 'in_progress', 'in-progress'].includes(pr.status));
      const activeClients = allClients.filter((c: {status?: string}) => !c.status || c.status === 'active' || c.status === 'Active');
      setProjectsData(allProjects.map((p: {id: string; name: string; status: string; budget?: number; revenue?: number}) => ({ id: p.id, name: p.name, status: p.status, budget: Number(p.budget || 0), revenue: Number(p.revenue || 0) })));
      const clientRevMap = new Map<string, { revenue: number; count: number }>();
      allInvoices.filter((i: {status: string}) => i.status === 'paid').forEach((inv: {to_client_name?: string; total?: number}) => {
        const key = inv.to_client_name || 'Unknown';
        const existing = clientRevMap.get(key) || { revenue: 0, count: 0 };
        clientRevMap.set(key, { revenue: existing.revenue + Number(inv.total || 0), count: existing.count + 1 });
      });
      const clientList = allClients.map((c: {id: string; full_name?: string; company_name?: string; status?: string}) => {
        const rev = clientRevMap.get(c.company_name || '') || clientRevMap.get(c.full_name || '') || { revenue: 0, count: 0 };
        return { id: c.id, name: c.full_name || '', company: c.company_name || '', totalRevenue: rev.revenue, invoiceCount: rev.count };
      }).sort((a: {totalRevenue: number}, b: {totalRevenue: number}) => b.totalRevenue - a.totalRevenue);
      setClientsData(clientList);
      setStatsData(p => ({
        ...p,
        activeClients: activeClients.length,
        activeProjects: activeProjects.length,
      }));
      setLoaded(p => ({ ...p, projects: true }));
    }).catch(() => setLoaded(p => ({ ...p, projects: true })));

    tasksPromise.then(allTasks => {
      const now_d = new Date();
      const todoCount = allTasks.filter((t: {status: string}) => ['todo', 'pending', 'backlog'].includes(t.status)).length;
      const inProgressCount = allTasks.filter((t: {status: string}) => ['in_progress', 'in-progress'].includes(t.status)).length;
      const doneCount = allTasks.filter((t: {status: string}) => ['done', 'completed'].includes(t.status)).length;
      const overdueCount = allTasks.filter((t: {due_date?: string; status: string}) => t.due_date && new Date(t.due_date) < now_d && !['done', 'completed'].includes(t.status)).length;
      setTaskStats({ total: allTasks.length, todo: todoCount, inProgress: inProgressCount, done: doneCount, overdue: overdueCount });
      setTasksData(allTasks.slice(0, 10).map((t: {id: string; title: string; status: string; priority?: string; due_date?: string}) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority || 'medium', due_date: t.due_date ?? null })));
      setStatsData(p => ({ ...p, totalTasks: allTasks.length, completedTasks: doneCount }));
      setLoaded(p => ({ ...p, tasks: true }));
    }).catch(() => setLoaded(p => ({ ...p, tasks: true })));

    Promise.all([employeesPromise, healthPromise]).then(([allEmployees, allHealth]) => {
      const activeEmployees = allEmployees.filter((e: {status: string}) => e.status === 'active').length;
      const onLeaveEmployees = allEmployees.filter((e: {status: string}) => ['on_leave', 'on-leave'].includes(e.status)).length;
      const totalPayroll = allEmployees.reduce((s: number, e: {monthly_salary?: number}) => s + Number(e.monthly_salary || 0), 0);
      const deptMap = new Map<string, number>();
      allEmployees.forEach((e: {department?: string}) => {
        const dept = e.department || 'General';
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
      });
      setEmployeesData(allEmployees.slice(0, 5).map((e: {id: string; full_name?: string; job_role?: string; department?: string; status?: string; monthly_salary?: number}) => ({ id: e.id, name: e.full_name || 'Employee', role: e.job_role || '', department: e.department || '', status: e.status || 'active', salary: Number(e.monthly_salary || 0) })));
      setEmployeeStats({ total: allEmployees.length, active: activeEmployees, onLeave: onLeaveEmployees, totalPayroll, departmentBreakdown: Array.from(deptMap.entries()).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count) });

      const latestHealth = allHealth[0];
      const healthScore = latestHealth?.total_score ?? latestHealth?.score ?? 0;
      const prevHealth = allHealth[1];
      const healthHistory = allHealth.map((h: {created_at?: string; total_score?: number; score?: number}) => ({ date: h.created_at?.slice(0, 10) || '', score: Number(h.total_score || h.score || 0) })).reverse();
      setHealthScoreData({ score: healthScore, previousScore: prevHealth?.total_score ?? prevHealth?.score ?? 0, label: healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Work', history: healthHistory, metrics: [] });
      setStatsData(p => ({ ...p, totalEmployees: allEmployees.length, healthScore }));
      setLoaded(p => ({ ...p, employees: true }));
    }).catch(() => setLoaded(p => ({ ...p, employees: true })));

    const hrLeavesPromise = supabase.from('hr_leave_requests').select('id,leave_type_name,from_date,to_date,days_count,status,employee:employee_id(full_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30).then(r => r.data ?? []);

    const hrJobsPromise = supabase.from('hr_job_postings').select('id,title,department,status,openings_count').eq('user_id', user.id).eq('status', 'open').limit(20).then(r => r.data ?? []);

    const hrAppraisalsPromise = supabase.from('hr_appraisals').select('id,employee_name,appraisal_type,appraisal_status').eq('user_id', user.id).limit(30).then(r => r.data ?? []);

    const dmCampaignsPromise = supabase.from('dm_campaigns').select('id,name,channel,status,budget,spend,impressions,clicks,conversions,revenue,roas').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(r => r.data ?? []);

    const dmLeadsPromise = supabase.from('dm_leads').select('id,name,status,deal_value,converted_at').eq('user_id', user.id).limit(200).then(r => r.data ?? []);

    const salesDealsPromise = supabase.from('pipeline_deals').select('id,title,company_name,deal_value,stage,probability,expected_close_date').eq('user_id', user.id).order('deal_value', { ascending: false }).limit(100).then(r => r.data ?? []);

    Promise.all([hrLeavesPromise, hrJobsPromise, hrAppraisalsPromise]).then(([leaves, jobs, appraisals]) => {
      const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const pendingLeaves = leaves.filter((l: {status: string}) => l.status === 'pending').length;
      const approvedLeaves = leaves.filter((l: {status: string; from_date?: string}) => l.status === 'approved' && l.from_date?.startsWith(thisMonthStr)).length;
      const pendingAppraisals = appraisals.filter((a: {appraisal_status: string}) => a.appraisal_status === 'pending' || a.appraisal_status === 'draft').length;
      setHrStats({
        pendingLeaves,
        approvedLeaves,
        openJobPostings: jobs.length,
        pendingAppraisals,
        totalLeaveRequests: leaves.length,
        recentLeaves: leaves.slice(0, 5).map((l: {id: string; employee?: {full_name?: string} | null; leave_type_name?: string; from_date?: string; days_count?: number; status?: string}) => ({
          id: l.id, employee_name: (l.employee as any)?.full_name || 'Employee', leave_type_name: l.leave_type_name || 'Leave',
          from_date: l.from_date || '', days_count: Number(l.days_count || 1), status: l.status || 'pending',
        })),
      });
      setLoaded(p => ({ ...p, hr: true }));
    }).catch(() => setLoaded(p => ({ ...p, hr: true })));

    Promise.all([dmCampaignsPromise, dmLeadsPromise]).then(([campaigns, leads]) => {
      const activeCampaigns = campaigns.filter((c: {status: string}) => c.status === 'active').length;
      const totalLeads = leads.length;
      const convertedLeads = leads.filter((l: {status: string}) => l.status === 'converted').length;
      const totalSpend = campaigns.reduce((s: number, c: {spend?: number}) => s + Number(c.spend || 0), 0);
      const totalRevenue = campaigns.reduce((s: number, c: {revenue?: number}) => s + Number(c.revenue || 0), 0);
      const totalImpressions = campaigns.reduce((s: number, c: {impressions?: number}) => s + Number(c.impressions || 0), 0);
      const totalClicks = campaigns.reduce((s: number, c: {clicks?: number}) => s + Number(c.clicks || 0), 0);
      const roasCampaigns = campaigns.filter((c: {roas?: number}) => Number(c.roas) > 0);
      const avgROAS = roasCampaigns.length > 0 ? roasCampaigns.reduce((s: number, c: {roas?: number}) => s + Number(c.roas), 0) / roasCampaigns.length : 0;
      setDmStats({
        activeCampaigns, totalLeads, convertedLeads, totalSpend, totalRevenue,
        totalImpressions, totalClicks, avgROAS,
        topCampaigns: campaigns.sort((a: {spend?: number}, b: {spend?: number}) => Number(b.spend || 0) - Number(a.spend || 0)).slice(0, 5).map((c: {id: string; name: string; channel: string; status: string; spend?: number; conversions?: number; roas?: number}) => ({
          id: c.id, name: c.name, channel: c.channel, status: c.status,
          spend: Number(c.spend || 0), conversions: Number(c.conversions || 0), roas: Number(c.roas || 0),
        })),
      });
      setLoaded(p => ({ ...p, digitalMarketing: true }));
    }).catch(() => setLoaded(p => ({ ...p, digitalMarketing: true })));

    salesDealsPromise.then(deals => {
      const stageMap: Record<string, { count: number; value: number }> = {};
      deals.forEach((d: {stage?: string; deal_value?: number}) => {
        const stage = d.stage || 'lead';
        if (!stageMap[stage]) stageMap[stage] = { count: 0, value: 0 };
        stageMap[stage].count++;
        stageMap[stage].value += Number(d.deal_value || 0);
      });
      const wonDeals = deals.filter((d: {stage: string}) => d.stage === 'won');
      const lostDeals = deals.filter((d: {stage: string}) => d.stage === 'lost');
      const decidedDeals = wonDeals.length + lostDeals.length;
      const winRate = decidedDeals > 0 ? (wonDeals.length / decidedDeals) * 100 : 0;
      const totalValue = deals.filter((d: {stage: string}) => !['won', 'lost'].includes(d.stage)).reduce((s: number, d: {deal_value?: number}) => s + Number(d.deal_value || 0), 0);
      const wonValue = wonDeals.reduce((s: number, d: {deal_value?: number}) => s + Number(d.deal_value || 0), 0);
      const hotDeals = deals
        .filter((d: {stage: string; probability?: number}) => !['won', 'lost'].includes(d.stage) && (d.probability || 0) >= 50)
        .sort((a: {deal_value?: number}, b: {deal_value?: number}) => Number(b.deal_value || 0) - Number(a.deal_value || 0))
        .slice(0, 5)
        .map((d: {id: string; title: string; company_name?: string; deal_value?: number; stage: string; probability?: number}) => ({
          id: d.id, title: d.title, company_name: d.company_name || '', deal_value: Number(d.deal_value || 0), stage: d.stage, probability: Number(d.probability || 0),
        }));
      setPipelineStats({
        stages: stageMap, totalDeals: deals.length, totalValue, wonValue,
        wonCount: wonDeals.length, lostCount: lostDeals.length,
        avgDealValue: deals.length > 0 ? deals.reduce((s: number, d: {deal_value?: number}) => s + Number(d.deal_value || 0), 0) / deals.length : 0,
        winRate, hotDeals,
      });
      setLoaded(p => ({ ...p, salesPipeline: true }));
    }).catch(() => setLoaded(p => ({ ...p, salesPipeline: true })));

    followUpsPromise.then(allFollowUps => {
      const now_d = new Date();
      const fu = allFollowUps.map((f: {id: string; client_name?: string; sent_at?: string; message_preview?: string; status?: string; channel?: string}) => ({
        id: f.id, client_name: f.client_name || 'Unknown',
        follow_up_date: f.sent_at ? f.sent_at.slice(0, 10) : '',
        message_preview: f.message_preview || '', status: f.status || 'sent', channel: f.channel || '',
      }));
      const fuPending = fu.filter((f: {status: string}) => f.status !== 'completed').length;
      const fuCompleted = fu.filter((f: {status: string}) => f.status === 'completed').length;
      const fuOverdue = fu.filter((f: {follow_up_date: string; status: string}) => f.follow_up_date && new Date(f.follow_up_date) < now_d && f.status !== 'completed').length;
      setFollowUpsData(fu.slice(0, 6));
      setFollowUpStats({ total: fu.length, pending: fuPending, completed: fuCompleted, overdue: fuOverdue });
      setLoaded(p => ({ ...p, followups: true }));
    }).catch(() => setLoaded(p => ({ ...p, followups: true })));

  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const allLoaded = Object.values(loaded).every(Boolean);
    if (allLoaded && loadingRef.current) {
      loadingRef.current = false;
      setRefreshing(false);
    }
  }, [loaded]);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newOrder = [...widgetOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setWidgetOrder(newOrder);
    setDragIdx(idx);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(widgetOrder));
  };

  const toggleWidget = (key: string) => {
    setHiddenWidgets(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(WIDGET_VISIBILITY_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const resetCustomization = () => {
    setWidgetOrder(DEFAULT_WIDGETS);
    setHiddenWidgets(new Set());
    localStorage.removeItem(WIDGET_ORDER_KEY);
    localStorage.removeItem(WIDGET_VISIBILITY_KEY);
  };

  const isWidgetLoaded = (key: string): boolean => {
    const sectionMap: Record<string, keyof LoadedSections> = {
      stats: 'stats', invoiceQuotation: 'pipeline', revenue: 'charts', profitMargin: 'charts',
      cashFlow: 'charts', weeklyActivity: 'charts', expenseBreakdown: 'charts', topIncomeSources: 'charts',
      projectsClients: 'projects', goalsProgress: 'stats', tasksOverview: 'tasks',
      healthScore: 'employees', gst: 'finance', savingsRate: 'finance',
      employees: 'employees', subscriptions: 'stats', upcomingPayments: 'stats',
      followUps: 'followups', recentActivity: 'stats',
      hrOverview: 'hr', digitalMarketing: 'digitalMarketing', pipeline: 'salesPipeline',
    };
    return loaded[sectionMap[key] || 'stats'];
  };

  const widgetMap: Record<string, { label: string; render: () => React.ReactNode; tall?: boolean }> = {
    stats: { label: 'KPI Cards', render: () => <DashboardStats data={statsData} /> },
    invoiceQuotation: { label: 'Invoice & Quotation', render: () => <InvoiceQuotationWidget data={pipelineData} /> },
    revenue: { label: 'Revenue vs Expenses', render: () => <RevenueChart data={barData} />, tall: true },
    profitMargin: { label: 'Profit & Margin', render: () => <ProfitMarginChart data={barData} />, tall: true },
    cashFlow: { label: 'Cash Flow Trend', render: () => <CashFlowChart data={lineData} />, tall: true },
    weeklyActivity: { label: 'Weekly Activity', render: () => <WeeklyActivityChart data={weeklyData} /> },
    expenseBreakdown: { label: 'Expense Breakdown', render: () => <ExpenseBreakdown data={pieData} totalExpenses={totalExpenses} /> },
    topIncomeSources: { label: 'Top Income Sources', render: () => <TopIncomeSourcesWidget sources={incomeSources} /> },
    projectsClients: { label: 'Projects & Clients', render: () => <ProjectsClientsWidget projects={projectsData} clients={clientsData} /> },
    tasksOverview: { label: 'Task Overview', render: () => <TasksOverviewWidget tasks={tasksData} stats={taskStats} /> },
    goalsProgress: { label: 'Financial Goals', render: () => <GoalsProgressWidget goals={goalsData} /> },
    healthScore: { label: 'Business Health Score', render: () => <HealthScoreWidget data={healthScoreData} /> },
    gst: { label: 'GST Summary', render: () => <GSTWidget data={gstData} /> },
    savingsRate: { label: 'Savings Rate', render: () => <SavingsRateWidget data={savingsData} /> },
    employees: { label: 'Team Overview', render: () => <EmployeesWidget employees={employeesData} stats={employeeStats} /> },
    subscriptions: { label: 'Subscriptions', render: () => <SubscriptionSummaryWidget subscriptions={subsData} /> },
    upcomingPayments: { label: 'Upcoming Payments', render: () => <UpcomingPayments emis={emisData} subscriptions={subsData} /> },
    followUps: { label: 'Follow-ups', render: () => <FollowUpWidget followUps={followUpsData} stats={followUpStats} /> },
    recentActivity: { label: 'Recent Transactions', render: () => <RecentActivity transactions={transactions} /> },
    hrOverview: { label: 'HR Overview', render: () => <HROverviewWidget data={hrStats} /> },
    digitalMarketing: { label: 'Digital Marketing', render: () => <DigitalMarketingWidget data={dmStats} /> },
    pipeline: { label: 'Sales Pipeline', render: () => <PipelineWidget data={pipelineStats} />, tall: true },
  };

  const twoColumnWidgets = new Set(['revenue', 'profitMargin', 'projectsClients', 'invoiceQuotation', 'pipeline']);

  return (
    <div className="space-y-6">
      {showCustomizePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomizePanel(false)} />
          <div className="relative w-full max-w-lg glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-semibold text-white">Customize Dashboard</h2>
                <p className="text-xs text-gray-500 mt-0.5">Show or hide widgets. Drag to reorder on the dashboard.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetCustomization}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
                <button onClick={() => setShowCustomizePanel(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-1.5">
              {widgetOrder.map((key) => {
                const widget = widgetMap[key];
                if (!widget) return null;
                const isHidden = hiddenWidgets.has(key);
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(widgetOrder.indexOf(key))}
                    onDragOver={(e) => handleDragOver(e, widgetOrder.indexOf(key))}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                      dragIdx === widgetOrder.indexOf(key)
                        ? 'border-orange-500/40 bg-orange-500/10 scale-[1.02] shadow-lg'
                        : isHidden
                        ? 'border-white/5 bg-white/2 opacity-50'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm font-medium ${isHidden ? 'text-gray-500' : 'text-white'}`}>{widget.label}</span>
                    </div>
                    <button
                      onClick={() => toggleWidget(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isHidden
                          ? 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
                      }`}
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isHidden ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500">{hiddenWidgets.size} widget{hiddenWidgets.size !== 1 ? 's' : ''} hidden</span>
              <button
                onClick={() => setShowCustomizePanel(false)}
                className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Business overview for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomizePanel(true)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Customize
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {(() => {
          const visibleOrder = widgetOrder.filter(k => !hiddenWidgets.has(k));
          const rows: React.ReactNode[] = [];
          let i = 0;
          while (i < visibleOrder.length) {
            const key = visibleOrder[i];
            const widget = widgetMap[key];
            if (!widget) { i++; continue; }

            const widgetLoaded = isWidgetLoaded(key);

            if (twoColumnWidgets.has(key)) {
              rows.push(
                <div
                  key={key}
                  draggable={isReordering}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all duration-200 ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''} ${dragIdx === i ? 'opacity-50 scale-[0.98]' : ''}`}
                >
                  {isReordering && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <GripVertical className="w-4 h-4 text-gray-600" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{widget.label}</span>
                    </div>
                  )}
                  {widgetLoaded ? widget.render() : <WidgetSkeleton tall={widget.tall} />}
                </div>
              );
              i++;
            } else {
              const nextKey = visibleOrder[i + 1];
              const nextWidget = nextKey ? widgetMap[nextKey] : null;
              const canPair = nextWidget && !twoColumnWidgets.has(nextKey);

              if (canPair) {
                rows.push(
                  <div key={`${key}-${nextKey}`} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[key, nextKey].map((k, ki) => {
                      const w = widgetMap[k];
                      const globalIdx = i + ki;
                      const wLoaded = isWidgetLoaded(k);
                      return (
                        <div
                          key={k}
                          draggable={isReordering}
                          onDragStart={() => handleDragStart(globalIdx)}
                          onDragOver={(e) => handleDragOver(e, globalIdx)}
                          onDragEnd={handleDragEnd}
                          className={`transition-all duration-200 ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''} ${dragIdx === globalIdx ? 'opacity-50 scale-[0.98]' : ''}`}
                        >
                          {isReordering && (
                            <div className="flex items-center gap-2 mb-1.5 px-1">
                              <GripVertical className="w-4 h-4 text-gray-600" />
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{w.label}</span>
                            </div>
                          )}
                          {wLoaded ? w.render() : <WidgetSkeleton tall={w.tall} />}
                        </div>
                      );
                    })}
                  </div>
                );
                i += 2;
              } else {
                rows.push(
                  <div
                    key={key}
                    draggable={isReordering}
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-200 ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''} ${dragIdx === i ? 'opacity-50 scale-[0.98]' : ''}`}
                  >
                    {isReordering && (
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <GripVertical className="w-4 h-4 text-gray-600" />
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{widget.label}</span>
                      </div>
                    )}
                    {widgetLoaded ? widget.render() : <WidgetSkeleton tall={widget.tall} />}
                  </div>
                );
                i++;
              }
            }
          }
          return rows;
        })()}
      </div>
    </div>
  );
}
