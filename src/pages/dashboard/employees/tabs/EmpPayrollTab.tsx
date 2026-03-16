import { useState } from 'react';
import { Plus, X, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { MONTHS } from '../../../../lib/employees/constants';
import type { Employee, Payroll } from '../../../../lib/employees/types';

interface Props {
  employee: Employee;
  payroll: Payroll[];
  onRefresh: () => void;
}

export default function EmpPayrollTab({ employee, payroll, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    month: MONTHS[now.getMonth()] as string,
    year: String(now.getFullYear()),
    days_worked: '',
    hours_worked: '',
    bonus: '0',
    deductions: '0',
  });

  const totalPaid = payroll.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.net_pay, 0);

  const resetForm = () => {
    setShowForm(false);
    setForm({ month: MONTHS[now.getMonth()] as string, year: String(now.getFullYear()), days_worked: '', hours_worked: '', bonus: '0', deductions: '0' });
  };

  const calcBasicPay = () => {
    if (employee.salary_type === 'Hourly Rate') return Number(form.hours_worked || 0) * employee.hourly_rate;
    return employee.monthly_salary;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const basicPay = calcBasicPay();
    const bonus = Number(form.bonus) || 0;
    const deductions = Number(form.deductions) || 0;
    const netPay = basicPay + bonus - deductions;

    const { error } = await supabase.from('employee_payroll').upsert({
      employee_id: employee.id,
      user_id: user!.id,
      month: form.month,
      year: Number(form.year),
      days_worked: Number(form.days_worked) || 0,
      hours_worked: Number(form.hours_worked) || 0,
      basic_pay: basicPay,
      bonus,
      deductions,
      net_pay: netPay,
      status: 'Pending',
    }, { onConflict: 'employee_id,month,year' });

    if (error) { toast.error(error.message); return; }
    toast.success('Payroll entry saved');
    resetForm();
    onRefresh();
  };

  const markPaid = async (p: Payroll) => {
    const { error } = await supabase.from('employee_payroll').update({ status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Marked as paid');
    onRefresh();
  };

  const generatePayslip = (p: Payroll) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('PAYSLIP', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Month: ${p.month} ${p.year}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 150, 35);

    doc.setFontSize(12);
    doc.text('Employee Details', 20, 50);
    doc.setFontSize(10);
    doc.text(`Name: ${employee.full_name}`, 20, 60);
    doc.text(`Code: ${employee.employee_code}`, 20, 67);
    doc.text(`Role: ${employee.job_role}`, 20, 74);
    doc.text(`Department: ${employee.department}`, 20, 81);

    doc.setFontSize(12);
    doc.text('Earnings', 20, 100);
    doc.setFontSize(10);

    let y = 110;
    doc.text('Basic Pay', 20, y);
    doc.text(formatINR(p.basic_pay), 160, y, { align: 'right' });
    y += 8;
    if (p.bonus > 0) {
      doc.text('Bonus', 20, y);
      doc.text(formatINR(p.bonus), 160, y, { align: 'right' });
      y += 8;
    }
    if (p.deductions > 0) {
      doc.text('Deductions', 20, y);
      doc.text(`-${formatINR(p.deductions)}`, 160, y, { align: 'right' });
      y += 8;
    }

    doc.line(20, y + 2, 190, y + 2);
    y += 10;
    doc.setFontSize(12);
    doc.text('Net Pay', 20, y);
    doc.text(formatINR(p.net_pay), 160, y, { align: 'right' });

    y += 15;
    doc.setFontSize(10);
    doc.text(`Days Worked: ${p.days_worked}`, 20, y);
    doc.text(`Hours Worked: ${p.hours_worked}`, 100, y);
    doc.text(`Status: ${p.status}`, 20, y + 8);

    doc.save(`payslip_${employee.employee_code}_${p.month}_${p.year}.pdf`);
  };

  const computedBasic = calcBasicPay();
  const computedNet = computedBasic + Number(form.bonus || 0) - Number(form.deductions || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payroll</h3>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Generate Payroll
        </button>
      </div>

      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">Total Paid (All Time)</p>
        <p className="text-lg font-bold text-green-400">{formatINR(totalPaid)}</p>
      </div>

      {payroll.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">No payroll records yet.</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium text-right">Days</th>
                  <th className="px-4 py-3 font-medium text-right">Hours</th>
                  <th className="px-4 py-3 font-medium text-right">Basic</th>
                  <th className="px-4 py-3 font-medium text-right">Bonus</th>
                  <th className="px-4 py-3 font-medium text-right">Deductions</th>
                  <th className="px-4 py-3 font-medium text-right">Net Pay</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">{p.month} {p.year}</td>
                    <td className="px-4 py-3 text-right">{p.days_worked}</td>
                    <td className="px-4 py-3 text-right">{p.hours_worked}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatINR(p.basic_pay)}</td>
                    <td className="px-4 py-3 text-right text-green-400">{p.bonus > 0 ? `+${formatINR(p.bonus)}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-red-400">{p.deductions > 0 ? `-${formatINR(p.deductions)}` : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-400">{formatINR(p.net_pay)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-md ${p.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {p.status !== 'Paid' && (
                          <button onClick={() => markPaid(p)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400" title="Mark Paid">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => generatePayslip(p)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Download Payslip">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generate Payroll</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm text-gray-400 mb-1">Year</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Days Worked</label><input type="number" value={form.days_worked} onChange={(e) => setForm({ ...form, days_worked: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Hours Worked</label><input type="number" step="0.5" value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Bonus (INR)</label><input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Deductions (INR)</label><input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              </div>
              <div className="glass-card rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-500">Basic Pay: <span className="text-white font-medium">{formatINR(computedBasic)}</span></p>
                <p className="text-xs text-gray-500">Net Pay: <span className="text-orange-400 font-semibold">{formatINR(computedNet)}</span></p>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">Save Payroll Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
