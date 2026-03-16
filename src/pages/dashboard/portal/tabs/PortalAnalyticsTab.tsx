import { useState, useEffect, useCallback } from 'react';
import { Eye, Clock, MousePointerClick, TrendingUp, Download, FileText } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import type { ClientPortal, PortalActivityLog, PortalSharedDocument } from '../../../../lib/portal/types';

interface Props { portal: ClientPortal; }

const ACTION_LABELS: Record<string, string> = {
  login: 'Logged in',
  view_portfolio: 'Viewed Portfolio',
  view_case_studies: 'Viewed Case Studies',
  view_testimonials: 'Viewed Testimonials',
  view_services: 'Viewed Services',
  view_team: 'Viewed Team',
  view_documents: 'Viewed Documents',
  view_project_progress: 'Viewed Project Progress',
  view_announcements: 'Viewed Announcements',
  view_faq: 'Viewed FAQ',
  download_document: 'Downloaded Document',
};

export default function PortalAnalyticsTab({ portal }: Props) {
  const [logs, setLogs] = useState<PortalActivityLog[]>([]);
  const [documents, setDocuments] = useState<PortalSharedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [logsRes, docsRes] = await Promise.all([
      supabase
        .from('portal_activity_log')
        .select('*')
        .eq('portal_id', portal.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('portal_shared_documents')
        .select('*')
        .eq('portal_id', portal.id)
        .order('download_count', { ascending: false }),
    ]);
    setLogs((logsRes.data || []) as PortalActivityLog[]);
    setDocuments((docsRes.data || []) as PortalSharedDocument[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const actionCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  const uniqueDays = new Set(logs.map(l => new Date(l.created_at).toDateString())).size;
  const loginCount = actionCounts['login'] || 0;
  const totalDownloads = documents.reduce((sum, d) => sum + (d.download_count || 0), 0);
  const downloadedDocs = documents.filter(d => (d.download_count || 0) > 0);

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Total Views</span>
          </div>
          <p className="text-2xl font-bold">{portal.total_views}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <MousePointerClick className="w-4 h-4" />
            <span className="text-xs">Login Sessions</span>
          </div>
          <p className="text-2xl font-bold">{loginCount}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Total Actions</span>
          </div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Download className="w-4 h-4" />
            <span className="text-xs">Total Downloads</span>
          </div>
          <p className="text-2xl font-bold">{totalDownloads}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Active Days</span>
          </div>
          <p className="text-2xl font-bold">{uniqueDays}</p>
        </div>
      </div>

      {Object.keys(actionCounts).length > 0 && (
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Section Engagement</h3>
          <div className="space-y-3">
            {Object.entries(actionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([action, count]) => {
                const max = Math.max(...Object.values(actionCounts));
                return (
                  <div key={action}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{ACTION_LABELS[action] || action}</span>
                      <span className="text-gray-400 font-mono">{count}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {downloadedDocs.length > 0 && (
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold">Document Downloads</h3>
          </div>
          <div className="space-y-3">
            {downloadedDocs.map(doc => {
              const maxDl = Math.max(...downloadedDocs.map(d => d.download_count || 1));
              return (
                <div key={doc.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 truncate mr-3">{doc.document_name}</span>
                    <span className="text-gray-400 font-mono shrink-0">{doc.download_count}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                      style={{ width: `${((doc.download_count || 0) / maxDl) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No activity yet. Client hasn't accessed the portal.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                <span className="text-sm text-gray-300 flex-1">{ACTION_LABELS[log.action] || log.action}</span>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
