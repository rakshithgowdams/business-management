import { useEffect, useState, useMemo, useCallback } from 'react';
import { Download, Filter, MessageCircle, Mail, Linkedin, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface HistoryEntry {
  id: string;
  sent_at: string;
  client_name: string;
  type: string;
  channel: string;
  message_preview: string;
  status: string;
  amount?: number;
}

const TYPE_LABELS: Record<string, string> = {
  invoice_overdue: 'Invoice',
  proposal_followup: 'Proposal',
  cold_lead: 'Cold Lead',
  project_completed: 'Project',
  client_anniversary: 'Anniversary',
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="w-3.5 h-3.5 text-green-400" />,
  email: <Mail className="w-3.5 h-3.5 text-blue-400" />,
  linkedin: <Linkedin className="w-3.5 h-3.5 text-sky-400" />,
};

const STATUS_META: Record<string, { icon: React.ReactNode; color: string }> = {
  sent: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-400 bg-green-500/10' },
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-yellow-400 bg-yellow-500/10' },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10' },
};

interface Props {
  refreshKey?: number;
}

export default function FollowUpHistory({ refreshKey }: Props) {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('followup_history')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });
      setHistory(data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (filterType !== 'all' && h.type !== filterType) return false;
      if (filterChannel !== 'all' && h.channel !== filterChannel) return false;
      if (filterStatus !== 'all' && h.status !== filterStatus) return false;
      return true;
    });
  }, [history, filterType, filterChannel, filterStatus]);

  const exportCSV = () => {
    const header = 'Date,Client,Type,Channel,Message Preview,Status';
    const rows = filtered.map(
      (h) => `"${h.sent_at}","${h.client_name}","${h.type}","${h.channel}","${(h.message_preview || '').replace(/"/g, '""')}","${h.status}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `followup-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const types = [...new Set(history.map((h) => h.type))];
  const channels = [...new Set(history.map((h) => h.channel))];

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading history...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Follow-up History
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1f1f1f] text-gray-400">
            {filtered.length}
          </span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#141414] border border-[#1f1f1f] rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
              ))}
            </select>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="bg-[#141414] border border-[#1f1f1f] rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
            >
              <option value="all">All Channels</option>
              {channels.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#141414] border border-[#1f1f1f] rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">
          No follow-up history yet. Send your first follow-up to start tracking.
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const sm = STATUS_META[h.status] || STATUS_META.pending;
                  return (
                    <tr key={h.id} className="border-b border-[#1f1f1f]/50 hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(h.sent_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white font-medium">{h.client_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f1f1f] text-gray-400">
                          {TYPE_LABELS[h.type] || h.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs">
                          {CHANNEL_ICONS[h.channel]}
                          {h.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                        {h.message_preview || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${sm.color}`}>
                          {sm.icon} {h.status}
                        </span>
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
