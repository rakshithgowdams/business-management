import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../lib/format';
import { MONTHS, getInitials, getAvatarColor } from '../../../lib/employees/constants';
import type { Employee, Payroll } from '../../../lib/employees/types';

export default function PayrollOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(MONTHS[now.getMonth()] as string);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [eRes, pRes] = await Promise.all([
      supabase.from('employees').select('*').eq('user_id', user.id).eq('status', 'Active').order('full_name'),
      supabase.from('employee_payroll').select('*').eq('user_id', user.id).eq('month', viewMonth).eq('year', viewYear),
    ]);
    setEmployees((eRes.data || []).map((e) => ({ ...e, monthly_salary: Number(e.monthly_salary), hourly_rate: Number(e.hourly_rate) })));
    setPayrolls((pRes.data || []).map((p) => ({
      ...p, days_worked: Number(p.days_worked), hours_worked: Number(p.hours_worked),
      basic_pay: Number(p.basic_pay), bonus: Number(p.bonus), deductions: Number(p.deductions), net_pay: Number(p.net_pay),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, viewMonth, viewYear]);

  const getPayroll = (empId: string) => payrolls.find((p) => p.employee_id === empId);

  const totalPayroll = payrolls.reduce((s, p) => s + p.net_pay, 0);
  const totalPaid = payrolls.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.net_pay, 0);
  const totalPending = payrolls.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.net_pay, 0);

  const prevMonth = () => {
    const idx = MONTHS.indexOf(viewMonth as any);
    if (idx === 0) { setViewMonth(MONTHS[11] as string); setViewYear(viewYear - 1); }
    else setViewMonth(MONTHS[idx - 1] as string);
  };
  const nextMonth = () => {
    const idx = MONTHS.indexOf(viewMonth as any);
    if (idx === 11) { setViewMonth(MONTHS[0] as string); setViewYear(viewYear + 1); }
    else setViewMonth(MONTHS[idx + 1] as string);
  };

  const markAllPaid = async () => {
    const pendingIds = payrolls.filter((p) => p.status === 'Pending').map((p) => p.id);
    if (pendingIds.length === 0) { toast.error('No pending payrolls'); return; }
    for (const pid of pendingIds) {
      await supabase.from('employee_payroll').update({ status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', pid);
    }
    toast.success(`${pendingIds.length} payrolls marked as paid`);
    load();
  };

  const markPaid = async (id: string) => {
    await supabase.from('employee_payroll').update({ status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    toast.success('Marked as paid');
    load();
  };

  const exportCSV = () => {
    const headers = ['Name', 'Code', 'Role', 'Salary Type', 'Days', 'Hours', 'Basic', 'Bonus', 'Deductions', 'Net Pay', 'Status'];
    const rows = employees.map((emp) => {
      const p = getPayroll(emp.id);
      return [emp.full_name, emp.employee_code, emp.job_role, emp.salary_type, p?.days_worked || 0, p?.hours_worked || 0, p?.basic_pay || 0, p?.bonus || 0, p?.deductions || 0, p?.net_pay || 0, p?.status || 'Not Generated'];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${viewMonth}_${viewYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/employees')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold">Payroll Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-white/5 text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-400">{viewMonth} {viewYear}</span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-white/5 text-gray-400"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={markAllPaid} className="px-3 py-2 text-sm rounded-xl gradient-orange text-white font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Mark All Paid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Employees</p>
          <p className="text-lg font-bold">{employees.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Payroll</p>
          <p className="text-lg font-bold text-orange-400">{formatINR(totalPayroll)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-lg font-bold text-green-400">{formatINR(totalPaid)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-lg font-bold text-yellow-400">{formatINR(totalPending)}</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">No active employees.</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">Net Pay</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const p = getPayroll(emp.id);
                  return (
                    <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => navigate(`/dashboard/employees/${emp.id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(emp.full_name)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                            {getInitials(emp.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{emp.full_name}</p>
                            <p className="text-xs text-gray-500">{emp.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{emp.job_role}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-400">{p ? formatINR(p.net_pay) : '-'}</td>
                      <td className="px-4 py-3">
                        {p ? (
                          <span className={`px-2 py-0.5 text-xs rounded-md ${p.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{p.status}</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-md bg-gray-500/10 text-gray-400">Not Generated</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {p && p.status === 'Pending' && (
                          <button onClick={() => markPaid(p.id)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400" title="Mark Paid">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
