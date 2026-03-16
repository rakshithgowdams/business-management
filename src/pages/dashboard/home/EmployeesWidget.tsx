import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, DollarSign, UserCheck, UserX } from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface EmployeeData {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  salary: number;
}

interface EmployeeStats {
  total: number;
  active: number;
  onLeave: number;
  totalPayroll: number;
  departmentBreakdown: { dept: string; count: number }[];
}

export default function EmployeesWidget({ employees, stats }: { employees: EmployeeData[]; stats: EmployeeStats }) {
  const nav = useNavigate();

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" style={{ color: '#a78bfa' }} />
          <h3 className="text-sm font-semibold text-white">Team Overview</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/employees')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
          <p className="text-lg font-bold text-blue-400">{stats.total}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center flex flex-col items-center">
          <div className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <p className="text-lg font-bold text-emerald-400">{stats.active}</p>
          </div>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center flex flex-col items-center">
          <div className="flex items-center gap-1">
            <UserX className="w-3 h-3 text-amber-400" />
            <p className="text-lg font-bold text-amber-400">{stats.onLeave}</p>
          </div>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">On Leave</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-[#FF6B00]/5 border border-[#FF6B00]/10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-xs text-gray-400">Monthly Payroll</span>
        </div>
        <span className="text-sm font-bold text-[#FF6B00]">{formatINR(stats.totalPayroll)}</span>
      </div>

      {stats.departmentBreakdown.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">By Department</p>
          <div className="space-y-1.5">
            {stats.departmentBreakdown.slice(0, 4).map(d => (
              <div key={d.dept} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: `${stats.total > 0 ? (d.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-24 truncate">{d.dept || 'General'}</span>
                <span className="text-[10px] font-semibold text-white w-4 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {employees.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recent Employees</p>
          {employees.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600/30 to-blue-400/10 flex items-center justify-center text-blue-400 text-[10px] font-bold border border-blue-500/20 flex-shrink-0">
                {e.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{e.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{e.role || e.department}</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                e.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
