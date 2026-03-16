import { useEffect, useState } from 'react';
import { Plus, X, CheckCircle, Trash2, Clock, TrendingDown, BarChart2, Calendar, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatINR, formatDate } from '../../lib/format';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';

interface EMIPayment {
  id: string;
  payment_date: string;
  amount: number;
  month_number: number;
}

interface EMILoan {
  id: string;
  loan_name: string;
  total_amount: number;
  emi_amount: number;
  start_date: string;
  tenure_months: number;
  interest_rate: number;
  lender_name: string;
  payments: EMIPayment[];
}

interface AmortizationRow {
  month: number;
  date: string;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
  paid: boolean;
}

type ViewMode = 'loans' | 'analytics' | 'schedule';

const inputCls = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm';

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

function buildAmortization(loan: EMILoan): AmortizationRow[] {
  if (!loan.interest_rate) {
    const rows: AmortizationRow[] = [];
    const principalPerMonth = loan.total_amount / loan.tenure_months;
    for (let i = 1; i <= loan.tenure_months; i++) {
      const start = new Date(loan.start_date);
      const date = new Date(start.getFullYear(), start.getMonth() + i - 1, start.getDate());
      rows.push({
        month: i, date: date.toISOString().split('T')[0],
        openingBalance: loan.total_amount - principalPerMonth * (i - 1),
        emi: loan.emi_amount, principal: principalPerMonth, interest: 0,
        closingBalance: Math.max(0, loan.total_amount - principalPerMonth * i),
        paid: i <= loan.payments.length,
      });
    }
    return rows;
  }

  const monthlyRate = loan.interest_rate / 100 / 12;
  let balance = loan.total_amount;
  const rows: AmortizationRow[] = [];
  for (let i = 1; i <= loan.tenure_months; i++) {
    const start = new Date(loan.start_date);
    const date = new Date(start.getFullYear(), start.getMonth() + i - 1, start.getDate());
    const interest = balance * monthlyRate;
    const principal = loan.emi_amount - interest;
    const closing = Math.max(0, balance - principal);
    rows.push({
      month: i, date: date.toISOString().split('T')[0],
      openingBalance: balance, emi: loan.emi_amount, principal, interest,
      closingBalance: closing, paid: i <= loan.payments.length,
    });
    balance = closing;
  }
  return rows;
}

export default function EMITracker() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<EMILoan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editLoan, setEditLoan] = useState<EMILoan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('loans');
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [form, setForm] = useState({
    loan_name: '', total_amount: '', emi_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    tenure_months: '12', interest_rate: '', lender_name: '',
  });

  useEffect(() => {
    if (user) loadLoans();
  }, [user]);

  const loadLoans = async () => {
    const { data } = await supabase.from('emi_loans').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    const result: EMILoan[] = [];
    for (const loan of data || []) {
      const { data: payments } = await supabase.from('emi_payments').select('*').eq('loan_id', loan.id).order('month_number');
      result.push({
        ...loan, total_amount: Number(loan.total_amount),
        emi_amount: Number(loan.emi_amount), interest_rate: Number(loan.interest_rate),
        payments: (payments || []).map((p) => ({ ...p, amount: Number(p.amount) })),
      });
    }
    setLoans(result);
  };

  const resetForm = () => {
    setForm({ loan_name: '', total_amount: '', emi_amount: '', start_date: new Date().toISOString().split('T')[0], tenure_months: '12', interest_rate: '', lender_name: '' });
    setEditLoan(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loan_name || !form.total_amount || !form.emi_amount) {
      toast.error('Please fill in required fields'); return;
    }
    const payload = {
      loan_name: form.loan_name, total_amount: Number(form.total_amount),
      emi_amount: Number(form.emi_amount), start_date: form.start_date,
      tenure_months: Number(form.tenure_months), interest_rate: Number(form.interest_rate) || 0,
      lender_name: form.lender_name,
    };
    if (editLoan) {
      const { error } = await supabase.from('emi_loans').update(payload).eq('id', editLoan.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Loan updated');
    } else {
      const { error } = await supabase.from('emi_loans').insert({ ...payload, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Loan added');
    }
    resetForm();
    loadLoans();
  };

  const openEdit = (loan: EMILoan) => {
    setEditLoan(loan);
    setForm({
      loan_name: loan.loan_name, total_amount: String(loan.total_amount),
      emi_amount: String(loan.emi_amount), start_date: loan.start_date,
      tenure_months: String(loan.tenure_months), interest_rate: String(loan.interest_rate),
      lender_name: loan.lender_name,
    });
    setShowForm(true);
  };

  const markEMIPaid = async (loan: EMILoan) => {
    const nextMonth = loan.payments.length + 1;
    if (nextMonth > loan.tenure_months) { toast.error('All EMIs already paid'); return; }
    await supabase.from('emi_payments').insert({
      loan_id: loan.id, payment_date: new Date().toISOString().split('T')[0],
      amount: loan.emi_amount, month_number: nextMonth,
    });
    toast.success(`EMI ${nextMonth} marked as paid`);
    loadLoans();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('emi_loans').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Loan deleted');
    loadLoans();
  };

  const getNextEMIDate = (loan: EMILoan) => {
    const startDate = new Date(loan.start_date);
    const nextMonth = loan.payments.length;
    return new Date(startDate.getFullYear(), startDate.getMonth() + nextMonth, startDate.getDate());
  };

  const totalInterestPaid = (loan: EMILoan) => {
    const rows = buildAmortization(loan);
    return rows.filter(r => r.paid).reduce((s, r) => s + r.interest, 0);
  };

  const totalInterestTotal = (loan: EMILoan) => {
    const rows = buildAmortization(loan);
    return rows.reduce((s, r) => s + r.interest, 0);
  };

  const activeLoans = loans.filter(l => l.payments.length < l.tenure_months);
  const totalMonthlyBurden = activeLoans.reduce((sum, l) => sum + l.emi_amount, 0);
  const totalOutstanding = activeLoans.reduce((sum, l) => {
    const rows = buildAmortization(l);
    const lastPaid = l.payments.length;
    return sum + (rows[lastPaid] ? rows[lastPaid].openingBalance : 0);
  }, 0);
  const totalPrincipalPaid = loans.reduce((sum, l) => sum + l.payments.reduce((s, p) => s + p.amount, 0), 0);

  const analyticsData = loans.map(l => ({
    name: l.loan_name.length > 12 ? l.loan_name.substring(0, 12) + '…' : l.loan_name,
    Principal: l.total_amount,
    'Interest Cost': totalInterestTotal(l),
    Paid: l.payments.reduce((s, p) => s + p.amount, 0),
  }));

  const scheduleData = scheduleId ? buildAmortization(loans.find(l => l.id === scheduleId)!) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">EMI Tracker</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
            {(['loans', 'analytics', 'schedule'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 capitalize transition-colors ${viewMode === v ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-semibold rounded-xl gradient-orange text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Loan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            <p className="text-sm text-gray-400">Monthly Burden</p>
          </div>
          <p className="text-2xl font-bold text-brand-400">{formatINR(totalMonthlyBurden)}</p>
          <p className="text-xs text-gray-500 mt-1">{activeLoans.length} active loans</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-400">Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatINR(totalOutstanding)}</p>
          <p className="text-xs text-gray-500 mt-1">Total remaining balance</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatINR(totalPrincipalPaid)}</p>
          <p className="text-xs text-gray-500 mt-1">Across all loans</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Total Loans</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{loans.length}</p>
          <p className="text-xs text-gray-500 mt-1">{loans.filter(l => l.payments.length >= l.tenure_months).length} completed</p>
        </div>
      </div>

      {viewMode === 'loans' && (
        <>
          {loans.length === 0 ? (
            <EmptyState title="No loans tracked" description="Start tracking your EMIs and loans." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loans.map((loan) => {
                const paidMonths = loan.payments.length;
                const pct = (paidMonths / loan.tenure_months) * 100;
                const totalPaid = loan.payments.reduce((s, p) => s + p.amount, 0);
                const totalRemaining = loan.emi_amount * loan.tenure_months - totalPaid;
                const nextDate = getNextEMIDate(loan);
                const daysToNext = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isCompleted = paidMonths >= loan.tenure_months;
                const intPaid = totalInterestPaid(loan);
                const intTotal = totalInterestTotal(loan);

                return (
                  <div key={loan.id} className={`glass-card glass-card-hover rounded-xl p-5 transition-all ${isCompleted ? 'border-green-500/20' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{loan.loan_name}</h3>
                        <p className="text-xs text-gray-500">{loan.lender_name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(loan)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(loan.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{paidMonths} of {loan.tenure_months} months</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div className="h-full gradient-orange rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="bg-dark-800 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">EMI / Month</p>
                        <p className="font-semibold">{formatINR(loan.emi_amount)}</p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Loan Amount</p>
                        <p className="font-semibold">{formatINR(loan.total_amount)}</p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Total Paid</p>
                        <p className="font-semibold text-green-400">{formatINR(totalPaid)}</p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Remaining</p>
                        <p className="font-semibold text-red-400">{formatINR(Math.max(totalRemaining, 0))}</p>
                      </div>
                    </div>

                    {loan.interest_rate > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 mb-3 px-1">
                        <span>Interest Paid: <span className="text-amber-400">{formatINR(intPaid)}</span></span>
                        <span>Total Interest: <span className="text-amber-400">{formatINR(intTotal)}</span></span>
                        <span>Rate: <span className="text-white">{loan.interest_rate}% p.a.</span></span>
                      </div>
                    )}

                    {!isCompleted && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                        <Clock className="w-3.5 h-3.5" />
                        Next EMI: {formatDate(nextDate.toISOString())}
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${daysToNext <= 3 ? 'bg-red-500/10 text-red-400' : daysToNext <= 7 ? 'bg-orange-500/10 text-orange-400' : 'bg-dark-600 text-gray-400'}`}>
                          {daysToNext > 0 ? `${daysToNext}d` : 'Due!'}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-sm text-green-400 font-medium flex-1">
                          <CheckCircle className="w-4 h-4" /> Fully Paid
                        </div>
                      ) : (
                        <button onClick={() => markEMIPaid(loan)} className="flex-1 py-2 text-sm font-medium rounded-lg gradient-orange text-white flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Mark EMI Paid
                        </button>
                      )}
                      <button
                        onClick={() => { setScheduleId(loan.id); setViewMode('schedule'); }}
                        className="px-3 py-2 text-xs rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {loans.length === 0 ? (
            <EmptyState title="No loans to analyze" description="Add loans to see analytics." />
          ) : (
            <>
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4">Loan Comparison — Principal vs Interest Cost</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analyticsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Principal" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Interest Cost" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Paid" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold">All Loans Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-white/5">
                        <th className="px-4 py-3 font-medium">Loan</th>
                        <th className="px-4 py-3 font-medium text-right">Principal</th>
                        <th className="px-4 py-3 font-medium text-right">Rate</th>
                        <th className="px-4 py-3 font-medium text-right">Total Interest</th>
                        <th className="px-4 py-3 font-medium text-right">Total Cost</th>
                        <th className="px-4 py-3 font-medium text-right">Progress</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((l) => {
                        const intTotal = totalInterestTotal(l);
                        const pct = (l.payments.length / l.tenure_months) * 100;
                        const completed = l.payments.length >= l.tenure_months;
                        return (
                          <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <p className="font-medium">{l.loan_name}</p>
                              <p className="text-xs text-gray-500">{l.lender_name}</p>
                            </td>
                            <td className="px-4 py-3 text-right">{formatINR(l.total_amount)}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{l.interest_rate}%</td>
                            <td className="px-4 py-3 text-right text-amber-400">{formatINR(intTotal)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatINR(l.total_amount + intTotal)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${completed ? 'bg-green-500/10 text-green-400' : 'bg-brand-500/10 text-brand-400'}`}>
                                {completed ? 'Completed' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {viewMode === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Select Loan:</label>
            <select
              value={scheduleId || ''}
              onChange={(e) => setScheduleId(e.target.value)}
              className="text-sm bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white"
            >
              <option value="">-- Choose a loan --</option>
              {loans.map(l => <option key={l.id} value={l.id}>{l.loan_name}</option>)}
            </select>
          </div>

          {scheduleId && scheduleData.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Amortization Schedule</h3>
                <p className="text-xs text-gray-500">
                  {scheduleData.filter(r => r.paid).length} of {scheduleData.length} months paid
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/5">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium text-right">Opening</th>
                      <th className="px-4 py-3 font-medium text-right">EMI</th>
                      <th className="px-4 py-3 font-medium text-right">Principal</th>
                      <th className="px-4 py-3 font-medium text-right">Interest</th>
                      <th className="px-4 py-3 font-medium text-right">Closing</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.map((row) => (
                      <tr
                        key={row.month}
                        className={`border-b border-white/5 ${row.paid ? 'opacity-60' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="px-4 py-2.5 text-gray-500">{row.month}</td>
                        <td className="px-4 py-2.5 text-gray-400">{formatDate(row.date)}</td>
                        <td className="px-4 py-2.5 text-right">{formatINR(row.openingBalance)}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatINR(row.emi)}</td>
                        <td className="px-4 py-2.5 text-right text-blue-400">{formatINR(row.principal)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-400">{formatINR(row.interest)}</td>
                        <td className="px-4 py-2.5 text-right">{formatINR(row.closingBalance)}</td>
                        <td className="px-4 py-2.5 text-center">
                          {row.paid ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Paid</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/[0.02] font-bold">
                      <td colSpan={4} className="px-4 py-3 text-sm">Totals</td>
                      <td className="px-4 py-3 text-right text-blue-400">{formatINR(scheduleData.reduce((s, r) => s + r.principal, 0))}</td>
                      <td className="px-4 py-3 text-right text-amber-400">{formatINR(scheduleData.reduce((s, r) => s + r.interest, 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editLoan ? 'Edit Loan' : 'Add Loan / EMI'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Loan Name *</label>
                <input type="text" value={form.loan_name} onChange={(e) => setForm({ ...form, loan_name: e.target.value })} className={inputCls} placeholder="e.g. Business Laptop EMI" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Total Loan Amount *</label>
                  <input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className={inputCls} placeholder="500000" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">EMI Amount / Month *</label>
                  <input type="number" value={form.emi_amount} onChange={(e) => setForm({ ...form, emi_amount: e.target.value })} className={inputCls} placeholder="15000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tenure (Months)</label>
                  <input type="number" value={form.tenure_months} onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Interest Rate % p.a.</label>
                  <input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} className={inputCls} placeholder="10.5" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Lender Name</label>
                  <input type="text" value={form.lender_name} onChange={(e) => setForm({ ...form, lender_name: e.target.value })} className={inputCls} placeholder="HDFC Bank" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editLoan ? 'Update Loan' : 'Add Loan'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Loan" message="This will remove the loan and all payment records. Continue?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
