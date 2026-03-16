import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Check, X, Clock, Settings, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatDate } from '../../../../lib/format';
import { LEAVE_STATUS_COLORS, LEAVE_STATUSES } from '../../../../lib/hr/constants';
import type { LeaveRequest } from '../../../../lib/hr/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

export default function LeaveOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionId, setActionId] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('hr_leave_requests')
      .select('*, leave_type:hr_leave_types(name, color, code)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRequests((data || []) as LeaveRequest[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAction = async () => {
    if (!actionId) return;
    const { id, action } = actionId;
    const updates: Record<string, string> = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      approved_at: new Date().toISOString(),
    };
    await supabase.from('hr_leave_requests').update(updates).eq('id', id);
    setActionId(null);
    toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}`);
    load();
  };

  const filtered = requests.filter((r) => filterStatus === 'All' || r.status === filterStatus);

  const stats = {
    pending: requests.filter((r) => r.status === 'Pending').length,
    approved: requests.filter((r) => r.status === 'Approved').length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Leave Management</h2>
          <p className="text-sm text-gray-500">{requests.length} total requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('types')}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-sm flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Leave Types
          </button>
          <button
            onClick={() => navigate('new')}
            className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Request Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['All', ...LEAVE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === s
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No leave requests</p>
          <p className="text-sm text-gray-500">Submit a leave request to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: (req.leave_type as any)?.color || '#666' }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">
                      {(req.leave_type as any)?.name || 'Leave'}
                      {req.is_half_day && <span className="text-xs text-gray-400 ml-1">(Half Day — {req.half_day_session})</span>}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(req.start_date)} – {formatDate(req.end_date)} · {req.days_requested} day{req.days_requested > 1 ? 's' : ''}
                  </p>
                  {req.reason && <p className="text-xs text-gray-500 mt-0.5">{req.reason}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 text-xs rounded-lg border font-medium ${LEAVE_STATUS_COLORS[req.status] || ''}`}>
                  {req.status}
                </span>
                {req.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => setActionId({ id: req.id, action: 'approve' })}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActionId({ id: req.id, action: 'reject' })}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!actionId}
        title={actionId?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
        message={`Are you sure you want to ${actionId?.action} this leave request?`}
        onConfirm={handleAction}
        onCancel={() => setActionId(null)}
      />
    </div>
  );
}
