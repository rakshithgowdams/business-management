import { supabase } from './supabase';

export interface BusinessMetrics {
  income: { thisMonth: number; lastMonth: number; thisWeek: number };
  invoices: { total: number; paid: number; overdue: number; overdueAmount: number; pendingAmount: number; thisWeek: { sent: number; amount: number; received: number; receivedAmount: number } };
  projects: { active: number; completed: number; totalRevenue: number; totalExpenses: number; avgMargin: number; delayed: number };
  clients: { total: number; newThisMonth: number; activeLeads: number; newThisWeek: number };
  employees: { total: number; tasksTotal: number; tasksCompleted: number; hoursLogged: number; memberHours: Record<string, number> };
  expenses: { thisMonth: number; thisWeek: number };
}

export async function fetchBusinessMetrics(userId: string): Promise<BusinessMetrics> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const weekDay = now.getDay();
  const mondayOffset = weekDay === 0 ? 6 : weekDay - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString();

  const [incomeRes, expensesRes, invoicesRes, projectsRes, projectExpRes, clientsRes, employeesRes, empTasksRes, attendanceRes] = await Promise.all([
    supabase.from('income_entries').select('*').eq('user_id', userId),
    supabase.from('expense_entries').select('*').eq('user_id', userId),
    supabase.from('invoices').select('*').eq('user_id', userId),
    supabase.from('projects').select('*').eq('user_id', userId),
    supabase.from('project_expenses').select('*').eq('user_id', userId),
    supabase.from('clients').select('*').eq('user_id', userId),
    supabase.from('employees').select('*').eq('user_id', userId),
    supabase.from('employee_tasks').select('*').eq('user_id', userId),
    supabase.from('attendance').select('*').eq('user_id', userId),
  ]);

  const incomeEntries = incomeRes.data || [];
  const expenseEntries = expensesRes.data || [];
  const invoices = invoicesRes.data || [];
  const projects = projectsRes.data || [];
  const projectExpenses = projectExpRes.data || [];
  const clients = clientsRes.data || [];
  const employees = employeesRes.data || [];
  const empTasks = empTasksRes.data || [];
  const attendanceList = attendanceRes.data || [];

  const incomeThisMonth = incomeEntries
    .filter((e) => e.date >= thisMonthStart)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const incomeLastMonth = incomeEntries
    .filter((e) => e.date >= lastMonthStart && e.date <= lastMonthEnd)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const incomeThisWeek = incomeEntries
    .filter((e) => e.date >= weekStartISO)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const expensesThisMonth = expenseEntries
    .filter((e) => e.date >= thisMonthStart)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expensesThisWeek = expenseEntries
    .filter((e) => e.date >= weekStartISO)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const paidInvoices = invoices.filter((i) => i.status === 'paid').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' || (i.status !== 'paid' && i.due_date && new Date(i.due_date) < now));
  const overdueAmount = overdueInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const pendingAmount = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + Number(i.total || 0), 0);

  const invoicesThisWeek = invoices.filter((i) => i.created_at >= weekStartISO);
  const invoicesReceivedThisWeek = invoices.filter((i) => i.status === 'paid' && i.updated_at && i.updated_at >= weekStartISO);

  const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Active' || p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'Completed' || p.status === 'completed');
  const delayedProjects = projects.filter((p) => p.end_date && new Date(p.end_date) < now && p.status !== 'Completed' && p.status !== 'completed');

  const totalProjectRevenue = projects.reduce((s, p) => s + Number(p.revenue || 0), 0);
  const totalProjectExpenses = projectExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const avgMargin = totalProjectRevenue > 0 ? ((totalProjectRevenue - totalProjectExpenses) / totalProjectRevenue) * 100 : 0;

  const newClientsThisMonth = clients.filter((c) => c.created_at >= thisMonthStart).length;
  const activeLeads = clients.filter((c) => c.status === 'Lead' || c.status === 'Prospect').length;
  const newClientsThisWeek = clients.filter((c) => c.created_at >= weekStartISO).length;

  const tasksThisMonth = empTasks.filter((t) => t.created_at >= thisMonthStart);
  const completedTasks = tasksThisMonth.filter((t) => t.status === 'completed' || t.status === 'Completed' || t.status === 'Done');

  const monthAttendance = attendanceList.filter((a) => a.date >= thisMonthStart);
  const totalHoursLogged = monthAttendance.reduce((s, a) => s + Number(a.hours_worked || 0), 0);

  const memberHours: Record<string, number> = {};
  for (const a of monthAttendance) {
    const emp = employees.find((e) => e.id === a.employee_id);
    const name = emp?.full_name || 'Unknown';
    memberHours[name] = (memberHours[name] || 0) + Number(a.hours_worked || 0);
  }

  return {
    income: { thisMonth: incomeThisMonth, lastMonth: incomeLastMonth, thisWeek: incomeThisWeek },
    invoices: {
      total: invoices.length,
      paid: paidInvoices,
      overdue: overdueInvoices.length,
      overdueAmount,
      pendingAmount,
      thisWeek: {
        sent: invoicesThisWeek.length,
        amount: invoicesThisWeek.reduce((s, i) => s + Number(i.total || 0), 0),
        received: invoicesReceivedThisWeek.length,
        receivedAmount: invoicesReceivedThisWeek.reduce((s, i) => s + Number(i.total || 0), 0),
      },
    },
    projects: {
      active: activeProjects.length,
      completed: completedProjects.length,
      totalRevenue: totalProjectRevenue,
      totalExpenses: totalProjectExpenses,
      avgMargin,
      delayed: delayedProjects.length,
    },
    clients: {
      total: clients.length,
      newThisMonth: newClientsThisMonth,
      activeLeads,
      newThisWeek: newClientsThisWeek,
    },
    employees: {
      total: employees.length,
      tasksTotal: tasksThisMonth.length,
      tasksCompleted: completedTasks.length,
      hoursLogged: totalHoursLogged,
      memberHours,
    },
    expenses: { thisMonth: expensesThisMonth, thisWeek: expensesThisWeek },
  };
}
