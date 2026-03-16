import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CheckCircle2, Circle, Clock, AlertCircle, TrendingUp, Users, Briefcase, DollarSign, FileText, Handshake } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR, formatDate } from '../../../lib/format';

const TABS = ['Finance', 'Invoices', 'Projects', 'Team', 'Clients & Leads', 'Expense Breakdown'] as const;
type TabType = typeof TABS[number];

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  Finance: <DollarSign className="w-3.5 h-3.5" />,
  Invoices: <FileText className="w-3.5 h-3.5" />,
  Projects: <Briefcase className="w-3.5 h-3.5" />,
  Team: <Users className="w-3.5 h-3.5" />,
  'Clients & Leads': <Handshake className="w-3.5 h-3.5" />,
  'Expense Breakdown': <TrendingUp className="w-3.5 h-3.5" />,
};

interface Props {
  weekStart: Date;
  weekEnd: Date;
}

const EXPENSE_COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function WeeklyBreakdownTabs({ weekStart, weekEnd }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Finance');
  const [data, setData] = useState<Record<string, unknown[]>>({});

  const ws = weekStart.toISOString();
  const we = weekEnd.toISOString();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('income_entries').select('*').eq('user_id', user.id).gte('date', ws).lte('date', we),
      supabase.from('expense_entries').select('*').eq('user_id', user.id).gte('date', ws).lte('date', we),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('employees').select('*').eq('user_id', user.id),
      supabase.from('employee_tasks').select('*').eq('user_id', user.id),
      supabase.from('attendance').select('*').eq('user_id', user.id).gte('date', ws).lte('date', we),
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('client_interactions').select('*').eq('user_id', user.id).gte('interaction_date', ws).lte('interaction_date', we),
    ]).then(([inc, exp, inv, proj, emp, tasks, att, cli, inter]) => {
      setData({
        income: inc.data || [],
        expenses: exp.data || [],
        invoices: inv.data || [],
        projects: proj.data || [],
        employees: emp.data || [],
        tasks: tasks.data || [],
        attendance: att.data || [],
        clients: cli.data || [],
        interactions: inter.data || [],
      });
    });
  }, [user, ws, we]);

  const income = (data.income || []) as { date: string; amount: number; source: string; description: string }[];
  const expenses = (data.expenses || []) as { date: string; amount: number; category: string; description: string }[];
  const invoices = (data.invoices || []) as { created_at: string; invoice_number: string; to_client_name: string; total: number; status: string; due_date: string; updated_at: string }[];
  const projects = (data.projects || []) as { name: string; status: string; end_date: string; start_date: string; revenue: number; budget: number }[];
  const employees = (data.employees || []) as { id: string; full_name: string }[];
  const tasks = (data.tasks || []) as { employee_id: string; task_name: string; status: string; created_at: string; priority: string }[];
  const attendance = (data.attendance || []) as { employee_id: string; hours_worked: number; date: string }[];
  const clients = (data.clients || []) as { full_name: string; status: string; created_at: string; industry: string }[];
  const interactions = (data.interactions || []) as { interaction_type: string; description: string; interaction_date: string }[];

  const weekInvoicesSent = invoices.filter((i) => i.created_at >= ws && i.created_at <= we);
  const weekInvoicesPaid = invoices.filter((i) => i.status === 'paid' && i.updated_at && i.updated_at >= ws && i.updated_at <= we);
  const overdueInvoices = invoices.filter((i) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date());
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid' && (!i.due_date || new Date(i.due_date) >= new Date()));

  const totalIncome = income.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyChartData = dayNames.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    return {
      name: day,
      income: income.filter((e) => e.date?.startsWith(ds)).reduce((s, e) => s + Number(e.amount || 0), 0),
      expenses: expenses.filter((e) => e.date?.startsWith(ds)).reduce((s, e) => s + Number(e.amount || 0), 0),
    };
  });

  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0);
  });
  const expensePieData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const incomeBySource: Record<string, number> = {};
  income.forEach((e) => {
    const src = e.source || 'Other';
    incomeBySource[src] = (incomeBySource[src] || 0) + Number(e.amount || 0);
  });

  const newClientsWeek = clients.filter((c) => c.created_at >= ws && c.created_at <= we);
  const activeProjects = projects.filter((p) => ['In Progress', 'Active', 'active', 'in_progress'].includes(p.status));
  const completedProjects = projects.filter((p) => ['Completed', 'completed', 'done'].includes(p.status));

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex gap-0 overflow-x-auto border-b border-white/5 px-2 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'
            }`}
          >
            {TAB_ICONS[tab]}
            {tab}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'Finance' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Income', value: totalIncome, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/15' },
                { label: 'Expenses', value: totalExpenses, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/15' },
                { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'text-emerald-400' : 'text-red-400', bg: netProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-lg font-black ${s.color}`}>{formatINR(s.value)}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-3">Daily Cash Flow</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {Object.keys(incomeBySource).length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Income Sources</p>
                <div className="space-y-1.5">
                  {Object.entries(incomeBySource).sort((a, b) => b[1] - a[1]).map(([src, amt]) => (
                    <div key={src} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 flex-1 truncate">{src}</span>
                      <div className="w-24 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(amt / totalIncome) * 100}%` }} />
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold w-20 text-right">{formatINR(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {income.length === 0 && expenses.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No financial entries this week.</p>
            )}
          </div>
        )}

        {activeTab === 'Expense Breakdown' && (
          <div className="space-y-5">
            {expensePieData.length > 0 ? (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {expensePieData.map((_, i) => (
                          <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {expensePieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span className="text-xs text-gray-400 flex-1">{item.name}</span>
                      <div className="w-20 h-1 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length], width: `${(item.value / totalExpenses) * 100}%` }} />
                      </div>
                      <span className="text-xs text-white font-semibold w-20 text-right">{formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total Expenses</span>
                  <span className="text-sm font-bold text-red-400">{formatINR(totalExpenses)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No expenses recorded this week.</p>
            )}
          </div>
        )}

        {activeTab === 'Invoices' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Sent', value: weekInvoicesSent.length, color: 'text-blue-400' },
                { label: 'Paid', value: weekInvoicesPaid.length, color: 'text-emerald-400' },
                { label: 'Overdue', value: overdueInvoices.length, color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {overdueInvoices.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-xs font-semibold text-red-400">Overdue — Needs Immediate Action</p>
                </div>
                <div className="space-y-1.5">
                  {overdueInvoices.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-sm">
                      <div>
                        <p className="text-red-300 font-medium">#{inv.invoice_number} — {inv.to_client_name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Due: {inv.due_date ? formatDate(inv.due_date) : 'N/A'}</p>
                      </div>
                      <span className="text-red-400 font-bold">{formatINR(Number(inv.total))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weekInvoicesSent.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Sent This Week</p>
                <div className="space-y-1.5">
                  {weekInvoicesSent.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 border border-white/5 rounded-xl text-sm">
                      <div>
                        <p className="text-gray-300">#{inv.invoice_number} — {inv.to_client_name}</p>
                        <p className={`text-[10px] mt-0.5 ${inv.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{inv.status}</p>
                      </div>
                      <span className="text-white font-semibold">{formatINR(Number(inv.total))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingInvoices.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Pending Payment</p>
                <div className="space-y-1.5">
                  {pendingInvoices.slice(0, 5).map((inv, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 border border-amber-500/10 bg-amber-500/5 rounded-xl text-sm">
                      <p className="text-amber-200">#{inv.invoice_number} — {inv.to_client_name}</p>
                      <span className="text-amber-400 font-semibold">{formatINR(Number(inv.total))}</span>
                    </div>
                  ))}
                  {pendingInvoices.length > 5 && <p className="text-xs text-gray-500 text-right">+{pendingInvoices.length - 5} more</p>}
                </div>
              </div>
            )}

            {weekInvoicesSent.length === 0 && weekInvoicesPaid.length === 0 && overdueInvoices.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No invoice activity this week.</p>
            )}
          </div>
        )}

        {activeTab === 'Projects' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Active', value: activeProjects.length, color: 'text-[#FF6B00]' },
                { label: 'Completed', value: completedProjects.length, color: 'text-emerald-400' },
                { label: 'Total', value: projects.length, color: 'text-gray-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {activeProjects.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Active Projects</p>
                {activeProjects.map((p, i) => {
                  const isDelayed = p.end_date && new Date(p.end_date) < new Date();
                  return (
                    <div key={i} className={`p-3 rounded-xl border ${isDelayed ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-white font-medium">{p.name}</p>
                          {p.end_date && (
                            <p className="text-[10px] text-gray-500 mt-0.5">Due: {formatDate(p.end_date)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {p.revenue > 0 && <span className="text-xs text-emerald-400">{formatINR(p.revenue)}</span>}
                          {isDelayed && <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Delayed</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</p>
                <div className="space-y-1.5">
                  {completedProjects.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <p className="text-sm text-gray-300">{p.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No projects found.</p>}
          </div>
        )}

        {activeTab === 'Team' && (
          <div className="space-y-5">
            {employees.length > 0 ? (
              <>
                <div className="space-y-2">
                  {employees.map((emp) => {
                    const empHours = attendance.filter((a) => a.employee_id === emp.id).reduce((s, a) => s + Number(a.hours_worked || 0), 0);
                    const empTasksAll = tasks.filter((t) => t.employee_id === emp.id);
                    const empTasksDone = empTasksAll.filter((t) => ['completed', 'Completed', 'Done', 'done'].includes(t.status));
                    const pct = empTasksAll.length > 0 ? Math.round((empTasksDone.length / empTasksAll.length) * 100) : 0;
                    const highPrio = empTasksAll.filter((t) => ['high', 'High', 'urgent', 'Urgent'].includes(t.priority || '')).length;

                    return (
                      <div key={emp.id} className="p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-[#FF6B00]">{emp.full_name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{emp.full_name}</p>
                              <p className="text-[10px] text-gray-500">{empTasksDone.length}/{empTasksAll.length} tasks · {empHours.toFixed(0)}h logged</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {highPrio > 0 && (
                              <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">{highPrio} urgent</span>
                            )}
                            <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {tasks.filter((t) => !['completed', 'Completed', 'Done', 'done'].includes(t.status)).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Circle className="w-3 h-3" /> Pending Tasks</p>
                    <div className="space-y-1.5">
                      {tasks.filter((t) => !['completed', 'Completed', 'Done', 'done'].includes(t.status)).slice(0, 6).map((t, i) => {
                        const emp = employees.find((e) => e.id === t.employee_id);
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 border border-white/5 rounded-xl">
                            <Circle className="w-3 h-3 text-gray-600 shrink-0" />
                            <p className="text-xs text-gray-300 flex-1 truncate">{t.task_name}</p>
                            {emp && <span className="text-[10px] text-gray-500">{emp.full_name.split(' ')[0]}</span>}
                            {['high', 'High', 'urgent', 'Urgent'].includes(t.priority || '') && (
                              <span className="text-[9px] text-red-400 bg-red-500/10 px-1 rounded">High</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No team data found.</p>
            )}
          </div>
        )}

        {activeTab === 'Clients & Leads' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'New This Week', value: newClientsWeek.length, color: 'text-emerald-400' },
                { label: 'Total Active', value: clients.filter((c) => ['active', 'Active'].includes(c.status)).length, color: 'text-blue-400' },
                { label: 'Interactions', value: interactions.length, color: 'text-[#FF6B00]' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[10px] text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {newClientsWeek.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">New Clients This Week</p>
                <div className="space-y-1.5">
                  {newClientsWeek.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 border border-emerald-500/10 bg-emerald-500/5 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-emerald-400">{c.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-200">{c.full_name}</p>
                        {c.industry && <p className="text-[10px] text-gray-500">{c.industry}</p>}
                      </div>
                      <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {interactions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Interactions This Week</p>
                <div className="space-y-1.5">
                  {interactions.map((inter, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 border border-white/5 rounded-xl">
                      <span className="text-[10px] text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded font-medium mt-0.5 shrink-0">{inter.interaction_type}</span>
                      <div>
                        <p className="text-xs text-gray-400">{inter.description}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{inter.interaction_date ? formatDate(inter.interaction_date) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newClientsWeek.length === 0 && interactions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No client activity this week.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
