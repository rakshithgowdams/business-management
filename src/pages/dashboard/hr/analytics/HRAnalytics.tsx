import { useEffect, useState } from 'react';
import { Users, Briefcase, Calendar, Star, TrendingUp, UserCheck, UserX, Clock } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { APPLICATION_STAGES, STAGE_COLORS } from '../../../../lib/hr/constants';

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  totalJobPostings: number;
  activeJobs: number;
  totalApplications: number;
  hiredThisYear: number;
  pendingLeaves: number;
  approvedLeaves: number;
  totalReviews: number;
  avgRating: number;
  totalAppraisals: number;
  totalIncrementAmount: number;
  stageBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  employmentTypeBreakdown: Record<string, number>;
}

const COLORS = ['#ff6b00', '#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function HRAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    const [
      { data: emps },
      { data: jobs },
      { data: apps },
      { data: leaves },
      { data: reviews },
      { data: appraisals },
    ] = await Promise.all([
      supabase.from('employees').select('status, department, employment_type').eq('user_id', user!.id),
      supabase.from('hr_job_postings').select('status').eq('user_id', user!.id),
      supabase.from('hr_applications').select('stage').eq('user_id', user!.id),
      supabase.from('hr_leave_requests').select('status').eq('user_id', user!.id),
      supabase.from('hr_performance_reviews').select('overall_rating').eq('user_id', user!.id),
      supabase.from('hr_appraisals').select('increment_amount').eq('user_id', user!.id),
    ]);

    const empList = emps || [];
    const stageBreakdown: Record<string, number> = {};
    APPLICATION_STAGES.forEach((s) => { stageBreakdown[s] = 0; });
    (apps || []).forEach((a) => { stageBreakdown[a.stage] = (stageBreakdown[a.stage] || 0) + 1; });

    const deptBreakdown: Record<string, number> = {};
    empList.forEach((e) => { deptBreakdown[e.department] = (deptBreakdown[e.department] || 0) + 1; });

    const typeBreakdown: Record<string, number> = {};
    empList.forEach((e) => { typeBreakdown[e.employment_type] = (typeBreakdown[e.employment_type] || 0) + 1; });

    const ratings = (reviews || []).map((r) => r.overall_rating).filter(Boolean);
    const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0;
    const totalIncrement = (appraisals || []).reduce((s, a) => s + (Number(a.increment_amount) || 0), 0);

    setStats({
      totalEmployees: empList.length,
      activeEmployees: empList.filter((e) => e.status === 'Active').length,
      totalJobPostings: (jobs || []).length,
      activeJobs: (jobs || []).filter((j) => j.status === 'Active').length,
      totalApplications: (apps || []).length,
      hiredThisYear: stageBreakdown['Hired'] || 0,
      pendingLeaves: (leaves || []).filter((l) => l.status === 'Pending').length,
      approvedLeaves: (leaves || []).filter((l) => l.status === 'Approved').length,
      totalReviews: (reviews || []).length,
      avgRating,
      totalAppraisals: (appraisals || []).length,
      totalIncrementAmount: totalIncrement,
      stageBreakdown,
      departmentBreakdown: deptBreakdown,
      employmentTypeBreakdown: typeBreakdown,
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!stats) return null;

  const kpis = [
    { label: 'Total Employees', value: stats.totalEmployees, sub: `${stats.activeEmployees} active`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Open Positions', value: stats.activeJobs, sub: `${stats.totalJobPostings} total postings`, icon: Briefcase, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
    { label: 'Applicants', value: stats.totalApplications, sub: `${stats.hiredThisYear} hired`, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Leave Requests', value: stats.pendingLeaves, sub: `${stats.approvedLeaves} approved`, icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Avg Rating', value: stats.avgRating || '—', sub: `${stats.totalReviews} reviews`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Total Increments', value: formatINR(stats.totalIncrementAmount), sub: `${stats.totalAppraisals} appraisals`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  ];

  const deptEntries = Object.entries(stats.departmentBreakdown).sort((a, b) => b[1] - a[1]);
  const typeEntries = Object.entries(stats.employmentTypeBreakdown).sort((a, b) => b[1] - a[1]);
  const stageEntries = Object.entries(stats.stageBreakdown).filter(([, v]) => v > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">HR Analytics</h2>
        <p className="text-sm text-gray-500">Overview of your workforce metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <p className="text-xs text-gray-400">{kpi.label}</p>
            </div>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Application Pipeline</h3>
          <div className="space-y-2">
            {APPLICATION_STAGES.map((stage) => {
              const count = stats.stageBreakdown[stage] || 0;
              const pct = stats.totalApplications > 0 ? Math.round((count / stats.totalApplications) * 100) : 0;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 text-[10px] rounded border font-medium ${STAGE_COLORS[stage]}`}>{stage}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Employees by Department</h3>
          {deptEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No employees yet</p>
          ) : (
            <div className="space-y-3">
              {deptEntries.map(([dept, count], i) => {
                const pct = stats.totalEmployees > 0 ? Math.round((count / stats.totalEmployees) * 100) : 0;
                return (
                  <div key={dept}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300">{dept}</span>
                      <span className="text-xs text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Employment Types</h3>
          {typeEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No employees yet</p>
          ) : (
            <div className="space-y-4">
              {typeEntries.map(([type, count], i) => {
                const pct = stats.totalEmployees > 0 ? Math.round((count / stats.totalEmployees) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-300">{type}</span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
