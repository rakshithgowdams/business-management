import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, Trash2, Pencil, ChevronDown, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR, formatDate } from '../../../lib/format';
import { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES, EMPLOYEE_STATUS_COLORS, EMPLOYMENT_TYPE_COLORS, getInitials, getAvatarColor } from '../../../lib/employees/constants';
import type { Employee } from '../../../lib/employees/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function EmployeesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');

  const loadEmployees = async () => {
    if (!user) return;
    const { data } = await supabase.from('employees').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setEmployees((data || []).map((e) => ({ ...e, monthly_salary: Number(e.monthly_salary), hourly_rate: Number(e.hourly_rate) })));
    setLoading(false);
  };

  useEffect(() => { loadEmployees(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('employees').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Employee deleted');
    loadEmployees();
  };

  const filtered = useMemo(() => {
    let list = employees;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.job_role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All') list = list.filter((e) => e.status === filterStatus);
    if (filterDept !== 'All') list = list.filter((e) => e.department === filterDept);
    if (filterType !== 'All') list = list.filter((e) => e.employment_type === filterType);

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'salary') return b.monthly_salary - a.monthly_salary;
      if (sortBy === 'join_date') return new Date(b.join_date).getTime() - new Date(a.join_date).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [employees, search, filterStatus, filterDept, filterType, sortBy]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">{employees.length} total employees</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/dashboard/employees/payroll')} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payroll
          </button>
          <button onClick={() => navigate('/dashboard/employees/new')} className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, role, department..." className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Status</option>
              {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Depts</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Types</option>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="created_at">Date Added</option>
              <option value="name">Name</option>
              <option value="salary">Salary</option>
              <option value="join_date">Join Date</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No employees found</h3>
          <p className="text-sm text-gray-500 mb-6">Add your first employee to get started.</p>
          <button onClick={() => navigate('/dashboard/employees/new')} className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">Add Employee</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div key={emp.id} className="glass-card glass-card-hover rounded-xl p-5 flex flex-col cursor-pointer transition-all" onClick={() => navigate(`/dashboard/employees/${emp.id}`)}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(emp.full_name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {getInitials(emp.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{emp.full_name}</p>
                  <p className="text-sm text-gray-400">{emp.job_role}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] rounded-md bg-dark-600 text-gray-300">{emp.department}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-md border ${EMPLOYMENT_TYPE_COLORS[emp.employment_type] || ''}`}>{emp.employment_type}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-md border ${EMPLOYEE_STATUS_COLORS[emp.status] || ''}`}>{emp.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-sm mb-3 flex-1">
                {emp.primary_phone && (
                  <a href={`tel:${emp.primary_phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {emp.primary_phone}
                  </a>
                )}
                {emp.personal_email && (
                  <a href={`mailto:${emp.personal_email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{emp.personal_email}</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-500">
                    {emp.salary_type === 'Hourly Rate' ? 'Rate/hr' : 'Salary/mo'}
                  </p>
                  <p className="text-sm font-bold text-green-400">
                    {formatINR(emp.salary_type === 'Hourly Rate' ? emp.hourly_rate : emp.monthly_salary)}
                  </p>
                </div>
                <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-500">Joined</p>
                  <p className="text-sm font-bold">{formatDate(emp.join_date)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <p className="text-xs text-gray-600">{emp.employee_code}</p>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => navigate(`/dashboard/employees/${emp.id}/edit`)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(emp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Employee" message="This will permanently delete this employee and all their attendance, payroll, tasks, and documents. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
