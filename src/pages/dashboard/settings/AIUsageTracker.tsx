import { useState } from 'react';
import { Trash2, Download } from 'lucide-react';
import { getUsageLog, getUsageStats, clearUsageLog, exportUsageCSV } from '../../../lib/ai/models';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function AIUsageTracker() {
  const [showClear, setShowClear] = useState(false);
  const [, setRefresh] = useState(0);
  const stats = getUsageStats();
  const log = getUsageLog();
  const recentLog = [...log].reverse().slice(0, 20);

  const handleClear = () => {
    clearUsageLog();
    setShowClear(false);
    setRefresh((v) => v + 1);
  };

  const handleExport = () => {
    const csv = exportUsageCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          💸 AI Usage & Cost This Month
        </h2>
        <div className="flex items-center gap-2">
          {log.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="px-2.5 py-1 rounded-lg border border-white/10 text-gray-400 text-xs hover:bg-white/5 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Export CSV
              </button>
              <button
                onClick={() => setShowClear(true)}
                className="px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-dark-800 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Calls</p>
          <p className="text-xl font-bold text-white mt-0.5">{stats.totalCalls}</p>
        </div>
        <div className="bg-dark-800 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Cost</p>
          <p className="text-xl font-bold text-white mt-0.5">{'\u20B9'}{stats.estimatedCost.toFixed(2)}</p>
        </div>
        <div className="bg-dark-800 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top Model</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">{stats.mostUsedModel}</p>
        </div>
        <div className="bg-dark-800 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top Task</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">{stats.mostUsedTask}</p>
        </div>
      </div>

      {recentLog.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="text-left py-2 pr-3 font-medium">Date</th>
                <th className="text-left py-2 pr-3 font-medium">Task</th>
                <th className="text-left py-2 pr-3 font-medium">Model</th>
                <th className="text-left py-2 pr-3 font-medium">Tokens</th>
                <th className="text-left py-2 pr-3 font-medium">Est. Cost</th>
                <th className="text-left py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLog.map((entry, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3 text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-2 pr-3 text-white">{entry.taskType}</td>
                  <td className="py-2 pr-3 text-gray-300">{entry.modelName}</td>
                  <td className="py-2 pr-3 text-gray-400">{entry.tokensUsed || '-'}</td>
                  <td className="py-2 pr-3 text-gray-400">{'\u20B9'}{entry.estimatedCost.toFixed(2)}</td>
                  <td className="py-2">
                    {entry.status === 'success' ? (
                      <span className="text-green-400">OK</span>
                    ) : (
                      <span className="text-red-400">Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-gray-600 text-center py-6">No usage data yet. Start using AI features to track costs.</p>
      )}

      <ConfirmDialog
        open={showClear}
        title="Reset Usage Log"
        message="This will clear all AI usage history. This cannot be undone."
        onConfirm={handleClear}
        onCancel={() => setShowClear(false)}
      />
    </div>
  );
}
