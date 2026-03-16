import { useState } from 'react';
import {
  Shield, Check, X, Clock, Send, AlertCircle,
  ChevronRight, User,
} from 'lucide-react';
import type { MessageApproval, ChatContact } from '../../../lib/messaging/types';
import { useTeamAuth } from '../../../context/TeamAuthContext';

interface Props {
  approvals: MessageApproval[];
  contacts: ChatContact[];
  onReview: (approvalId: string, status: 'approved' | 'rejected') => void;
  onRequestApproval: (targetId: string, reason: string) => void;
  onClose: () => void;
  loading: boolean;
}

export default function ApprovalPanel({
  approvals,
  contacts,
  onReview,
  onRequestApproval,
  onClose,
  loading,
}: Props) {
  const { member } = useTeamAuth();
  const [showRequest, setShowRequest] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [reason, setReason] = useState('');

  const isEmployee = member?.role === 'employee';
  const isManagement = member?.role === 'management';

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const resolvedApprovals = approvals.filter(a => a.status !== 'pending');

  const managementContacts = contacts.filter(c => c.role === 'management');
  const availableTargets = managementContacts.filter(c => {
    const existingApproval = approvals.find(a => a.target_id === c.id);
    return !existingApproval || existingApproval.status === 'rejected';
  });

  const handleSubmitRequest = () => {
    if (!selectedTarget || !reason.trim()) return;
    onRequestApproval(selectedTarget, reason.trim());
    setSelectedTarget('');
    setReason('');
    setShowRequest(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
            <Check className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
            <X className="w-3 h-3" /> Rejected
          </span>
        );
    }
  };

  const renderAvatar = (person: { full_name: string; avatar_url: string; role: string } | null) => {
    if (!person) return null;
    const initials = person.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
        person.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
      }`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Message Approvals</h3>
              <p className="text-xs text-gray-500">
                {isEmployee ? 'Request access to message management' : 'Review employee messaging requests'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isEmployee && (
            <div>
              {!showRequest ? (
                <button
                  onClick={() => setShowRequest(true)}
                  disabled={availableTargets.length === 0}
                  className="w-full flex items-center justify-between px-4 py-3 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-gray-300 hover:text-white hover:border-brand-500/30 transition-all disabled:opacity-40"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-brand-400" />
                    <span>Request to message a manager</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="bg-dark-700 border border-white/[0.08] rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">Select Manager *</label>
                    <select
                      value={selectedTarget}
                      onChange={e => setSelectedTarget(e.target.value)}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-white/[0.08] rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-brand-500/50"
                    >
                      <option value="">Choose a manager</option>
                      {availableTargets.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} - {c.department || c.job_title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">Reason *</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Why do you need to message this manager?"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => { setShowRequest(false); setSelectedTarget(''); setReason(''); }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitRequest}
                      disabled={!selectedTarget || !reason.trim() || loading}
                      className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      {loading ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {pendingApprovals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Pending ({pendingApprovals.length})
              </h4>
              <div className="space-y-2">
                {pendingApprovals.map(approval => (
                  <div key={approval.id} className="bg-dark-700 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      {renderAvatar(isManagement ? approval.requester : approval.target)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {isManagement
                            ? approval.requester?.full_name
                            : approval.target?.full_name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {isManagement
                            ? `${approval.requester?.department || 'Employee'} wants to message you`
                            : `Waiting for ${approval.target?.full_name} to respond`}
                        </p>
                        {approval.reason && (
                          <p className="text-xs text-gray-400 mt-1.5 bg-dark-800 rounded-lg px-3 py-2">
                            "{approval.reason}"
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          {getStatusBadge(approval.status)}
                          <span className="text-[10px] text-gray-600">
                            {new Date(approval.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isManagement && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                        <button
                          onClick={() => onReview(approval.id, 'approved')}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => onReview(approval.id, 'rejected')}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolvedApprovals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                History
              </h4>
              <div className="space-y-2">
                {resolvedApprovals.map(approval => (
                  <div key={approval.id} className="bg-dark-700 border border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      {renderAvatar(isManagement ? approval.requester : approval.target)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          {isManagement ? approval.requester?.full_name : approval.target?.full_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getStatusBadge(approval.status)}
                          {approval.reviewed_at && (
                            <span className="text-[10px] text-gray-600">
                              {new Date(approval.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approvals.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No approval requests yet</p>
              {isEmployee && (
                <p className="text-xs text-gray-600 mt-1">
                  You need approval to message management members
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
