import { useNavigate } from 'react-router-dom';
import { HardHat, ArrowRight, UserCheck, Clock, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';

interface HRStats {
  pendingLeaves: number;
  approvedLeaves: number;
  openJobPostings: number;
  pendingAppraisals: number;
  totalLeaveRequests: number;
  recentLeaves: { id: string; employee_name: string; leave_type_name: string; from_date: string; days_count: number; status: string }[];
}

export default function HROverviewWidget({ data }: { data: HRStats }) {
  const nav = useNavigate();

  const statusColor: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    approved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">HR Overview</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/hr')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          Manage HR <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div
          onClick={() => nav('/dashboard/hr/leave')}
          className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pending Leaves</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{data.pendingLeaves}</p>
          {data.pendingLeaves > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400">Needs approval</span>
            </div>
          )}
        </div>
        <div
          onClick={() => nav('/dashboard/hr/hiring')}
          className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Open Positions</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{data.openJobPostings}</p>
          <span className="text-[10px] text-gray-500">Active postings</span>
        </div>
        <div
          onClick={() => nav('/dashboard/hr/performance')}
          className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/10 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Appraisals</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{data.pendingAppraisals}</p>
          <span className="text-[10px] text-gray-500">Pending review</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Approved</span>
          </div>
          <p className="text-2xl font-bold text-rose-400">{data.approvedLeaves}</p>
          <span className="text-[10px] text-gray-500">Leaves this month</span>
        </div>
      </div>

      {data.recentLeaves.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Recent Leave Requests</p>
          <div className="space-y-1.5">
            {data.recentLeaves.slice(0, 3).map(leave => (
              <div key={leave.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rose-600/30 to-rose-400/10 flex items-center justify-center text-rose-400 text-[9px] font-bold border border-rose-500/20 shrink-0">
                    {(leave.employee_name || 'E')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate">{leave.employee_name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{leave.leave_type_name} · {leave.days_count}d</p>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${statusColor[leave.status] || statusColor.pending}`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
