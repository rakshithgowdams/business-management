import { Phone, Mail, MapPin, Calendar, Briefcase, CreditCard } from 'lucide-react';
import { formatINR, formatDate } from '../../../../lib/format';
import type { Employee, Attendance, Payroll } from '../../../../lib/employees/types';

interface Props {
  employee: Employee;
  attendance: Attendance[];
  payroll: Payroll[];
}

export default function EmpOverviewTab({ employee, attendance, payroll }: Props) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthAttendance = attendance.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const hoursThisMonth = thisMonthAttendance.reduce((s, a) => s + a.hours_worked, 0);
  const daysPresent = thisMonthAttendance.filter((a) => a.status === 'Present' || a.status === 'Work from Home').length;

  const totalPaid = payroll.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.net_pay, 0);

  const amountThisMonth = employee.salary_type === 'Hourly Rate'
    ? hoursThisMonth * employee.hourly_rate
    : employee.monthly_salary;

  const skills = employee.skills ? employee.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const tools = employee.tools_used ? employee.tools_used.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Hours This Month</p>
          <p className="text-lg font-bold">{hoursThisMonth.toFixed(1)}h</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Days Present</p>
          <p className="text-lg font-bold">{daysPresent}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Est. This Month</p>
          <p className="text-lg font-bold text-green-400">{formatINR(amountThisMonth)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Paid (All)</p>
          <p className="text-lg font-bold text-orange-400">{formatINR(totalPaid)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Contact & Personal</h3>
          <div className="space-y-2.5 text-sm">
            {employee.primary_phone && (
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">{employee.primary_phone}</span></div>
            )}
            {employee.personal_email && (
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">{employee.personal_email}</span></div>
            )}
            {(employee.city || employee.state) && (
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">{[employee.current_address, employee.city, employee.state].filter(Boolean).join(', ')}</span></div>
            )}
            {employee.date_of_birth && (
              <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">DOB: {formatDate(employee.date_of_birth)}</span></div>
            )}
            {employee.gender && <p className="text-gray-500 text-xs">Gender: {employee.gender}</p>}
            {employee.blood_group && <p className="text-gray-500 text-xs">Blood Group: {employee.blood_group}</p>}
            {employee.emergency_contact_name && (
              <p className="text-gray-500 text-xs">Emergency: {employee.emergency_contact_name} ({employee.emergency_contact_phone})</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Employment</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3"><Briefcase className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">{employee.job_role} -- {employee.department}</span></div>
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">Joined: {formatDate(employee.join_date)}</span></div>
            {employee.end_date && <p className="text-xs text-gray-500">End Date: {formatDate(employee.end_date)}</p>}
            {employee.reporting_manager && <p className="text-xs text-gray-500">Reports to: {employee.reporting_manager}</p>}
            <p className="text-xs text-gray-500">Location: {employee.work_location}</p>
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <CreditCard className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-gray-300">
                {employee.salary_type === 'Hourly Rate' ? `${formatINR(employee.hourly_rate)}/hr` : formatINR(employee.monthly_salary) + '/mo'}
                <span className="text-gray-500 ml-2">via {employee.payment_mode}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {(skills.length > 0 || tools.length > 0) && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Skills & Tools</h3>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => <span key={s} className="px-2.5 py-1 text-xs rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">{s}</span>)}
            </div>
          )}
          {tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tools.map((t) => <span key={t} className="px-2.5 py-1 text-xs rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">{t}</span>)}
            </div>
          )}
        </div>
      )}

      {employee.internal_notes && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Internal Notes</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{employee.internal_notes}</p>
        </div>
      )}
    </div>
  );
}
