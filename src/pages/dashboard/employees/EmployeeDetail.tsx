import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Phone, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { EMPLOYEE_STATUS_COLORS, EMPLOYMENT_TYPE_COLORS, getInitials, getAvatarColor } from '../../../lib/employees/constants';
import type { Employee, Attendance, Payroll, EmployeeTask, EmployeeDocument } from '../../../lib/employees/types';
import EmpOverviewTab from './tabs/EmpOverviewTab';
import EmpAttendanceTab from './tabs/EmpAttendanceTab';
import EmpPayrollTab from './tabs/EmpPayrollTab';
import EmpTasksTab from './tabs/EmpTasksTab';
import EmpDocumentsTab from './tabs/EmpDocumentsTab';

const TABS = ['Overview', 'Attendance', 'Payroll', 'Tasks', 'Documents'] as const;
type TabType = typeof TABS[number];

export default function EmployeeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  const loadAll = useCallback(async () => {
    if (!user || !id) return;
    const [eRes, aRes, pRes, tRes, dRes] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('employee_attendance').select('*').eq('employee_id', id).order('date', { ascending: false }),
      supabase.from('employee_payroll').select('*').eq('employee_id', id).order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('employee_tasks').select('*').eq('employee_id', id).order('created_at', { ascending: false }),
      supabase.from('employee_documents').select('*').eq('employee_id', id).order('created_at', { ascending: false }),
    ]);
    if (!eRes.data) { navigate('/dashboard/employees'); return; }
    setEmployee({ ...eRes.data, monthly_salary: Number(eRes.data.monthly_salary), hourly_rate: Number(eRes.data.hourly_rate) } as Employee);
    setAttendance((aRes.data || []).map((a) => ({ ...a, hours_worked: Number(a.hours_worked) })) as Attendance[]);
    setPayroll((pRes.data || []).map((p) => ({
      ...p, days_worked: Number(p.days_worked), hours_worked: Number(p.hours_worked),
      basic_pay: Number(p.basic_pay), bonus: Number(p.bonus), deductions: Number(p.deductions), net_pay: Number(p.net_pay),
    })) as Payroll[]);
    setTasks((tRes.data || []) as EmployeeTask[]);
    setDocuments((dRes.data || []).map((d) => ({ ...d, file_size: Number(d.file_size) })) as EmployeeDocument[]);
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading || !employee) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const whatsappNum = (employee.whatsapp_number || employee.primary_phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/dashboard/employees')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white mt-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(employee.full_name)} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
            {getInitials(employee.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{employee.full_name}</h1>
            <p className="text-gray-400">{employee.job_role} -- {employee.department}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">{employee.employee_code}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${EMPLOYMENT_TYPE_COLORS[employee.employment_type] || ''}`}>{employee.employment_type}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${EMPLOYEE_STATUS_COLORS[employee.status] || ''}`}>{employee.status}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {employee.primary_phone && (
            <a href={`tel:${employee.primary_phone}`} className="p-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
              <Phone className="w-5 h-5" />
            </a>
          )}
          {whatsappNum && (
            <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
          {employee.personal_email && (
            <a href={`mailto:${employee.personal_email}`} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          )}
          <button onClick={() => navigate(`/dashboard/employees/${id}/edit`)} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/5 -mx-1 px-1">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <EmpOverviewTab employee={employee} attendance={attendance} payroll={payroll} />}
      {activeTab === 'Attendance' && <EmpAttendanceTab employeeId={employee.id} attendance={attendance} onRefresh={loadAll} />}
      {activeTab === 'Payroll' && <EmpPayrollTab employee={employee} payroll={payroll} onRefresh={loadAll} />}
      {activeTab === 'Tasks' && <EmpTasksTab employeeId={employee.id} tasks={tasks} onRefresh={loadAll} />}
      {activeTab === 'Documents' && <EmpDocumentsTab employeeId={employee.id} documents={documents} onRefresh={loadAll} />}
    </div>
  );
}
